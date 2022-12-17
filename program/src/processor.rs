//! Program state processor
use crate::{
    error::Errors,
    instruction::Instructions,
    event::Events,
    state::{Swap, InitSwapParams},
    tools::{
        spl_token::{
            spl_token_transfer, spl_token_init_account,
            TokenInitializeAccountParams, TokenTransferParams
        },
        modifers::{
            assert_must_signer, assert_program_id, assert_authority,
            assert_rent_exempt, assert_uninitialized, assert_u64_non_zero
        }
    }
};
use num_traits::FromPrimitive;
use solana_program::{
    msg,
    account_info::{next_account_info, AccountInfo},
    decode_error::DecodeError,
    entrypoint::ProgramResult,
    program_error::{PrintProgramError, ProgramError},
    program_pack::{Pack},
    pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar},
};
use borsh::{BorshDeserialize};

/// Processes an instruction
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    let instruction = Instructions::try_from_slice(input)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    msg!("PROGRAM-INSTRUCTION: {:?}", instruction);
    match instruction {
        Instructions::InitSwap {
            owner,
            swapping_rate_numerator,
            swapping_rate_denominator
        } => {
            process_init_swap(program_id, accounts, owner, swapping_rate_numerator, swapping_rate_denominator)
        }
        Instructions::Deposit { amount_a, amount_b } => {
            process_deposit(program_id, accounts, amount_a, amount_b)
        }
        Instructions::Swap {
            amount,
        } => {
            process_swap(program_id, accounts, amount)
        }
    }
}

fn process_deposit(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount_a: u64,
    amount_b: u64
) -> ProgramResult {
    assert_u64_non_zero(amount_a)?;
    assert_u64_non_zero(amount_b)?;

    let account_info_iter = &mut accounts.iter();
    let swap_info = next_account_info(account_info_iter)?;
    let token_program_id = next_account_info(account_info_iter)?;
    let user_transfer_authority_info = next_account_info(account_info_iter)?;
    let src_token_a_account_info = next_account_info(account_info_iter)?;
    let dest_token_a_reserve_info = next_account_info(account_info_iter)?;
    let src_token_b_account_info = next_account_info(account_info_iter)?;
    let dest_token_b_reserve_info = next_account_info(account_info_iter)?;

    assert_must_signer(user_transfer_authority_info)?;

    let mut swap = Swap::unpack(&swap_info.data.borrow())?;
    assert_program_id(program_id, swap_info.owner)?;
    assert_program_id(token_program_id.key, &swap.token_program_id)?;

    if &swap.token_a_reserve != dest_token_a_reserve_info.key {
        return Err(Errors::InvalidAccountInput.into());
    }
    if &swap.token_b_reserve != dest_token_b_reserve_info.key {
        return Err(Errors::InvalidAccountInput.into());
    }

    spl_token_transfer(TokenTransferParams {
        source: src_token_a_account_info.clone(),
        destination: dest_token_a_reserve_info.clone(),
        amount: amount_a,
        authority: user_transfer_authority_info.clone(),
        authority_signer_seeds: &[],
        token_program: token_program_id.clone(),
    })?;

    spl_token_transfer(TokenTransferParams {
        source: src_token_b_account_info.clone(),
        destination: dest_token_b_reserve_info.clone(),
        amount: amount_b,
        authority: user_transfer_authority_info.clone(),
        authority_signer_seeds: &[],
        token_program: token_program_id.clone(),
    })?;

    swap.a_balance += amount_a;
    swap.b_balance += amount_b;

    let event = Events::Deposit {
        amount_a,
        amount_b,
        balance_a: swap.a_balance,
        balance_b: swap.b_balance
    };
    event.emit();

    Swap::pack(swap, &mut swap_info.data.borrow_mut())?;
    Ok(())
}

fn process_swap(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    assert_u64_non_zero(amount)?;

    let account_info_iter = &mut accounts.iter();

    let swap_info = next_account_info(account_info_iter)?;
    let token_program_id = next_account_info(account_info_iter)?;
    let user_transfer_authority_info = next_account_info(account_info_iter)?;
    let swap_authority_info = next_account_info(account_info_iter)?;
    let src_from_user_account_info = next_account_info(account_info_iter)?;
    let dst_from_reserve_info = next_account_info(account_info_iter)?;
    let src_to_reserve_info = next_account_info(account_info_iter)?;
    let dst_to_user_account_info = next_account_info(account_info_iter)?;

    assert_must_signer(user_transfer_authority_info)?;

    let mut swap = Swap::unpack(&swap_info.data.borrow())?;
    assert_program_id(program_id, swap_info.owner)?;
    assert_program_id(token_program_id.key, &swap.token_program_id)?;

    let authority_signer_seeds = &[
        swap_info.key.as_ref(),
        &[swap.bump_seed],
    ];

    assert_authority(
        program_id,
        authority_signer_seeds,
        swap_authority_info.key
    )?;

    let amount_out: u64;
    let from_mint: Pubkey;
    let to_mint: Pubkey;

    if dst_from_reserve_info.key == &swap.token_a_reserve {
        // swap `from` token a `to` token b
        if src_to_reserve_info.key != &swap.token_b_reserve {
            return Err(Errors::InvalidAccountInput.into());
        }
        amount_out = amount * swap.swapping_rate_denominator / swap.swapping_rate_numerator;
        if amount_out > swap.b_balance {
            return Err(Errors::AmountOutNotEnough.into());
        }
        swap.a_balance += amount;
        swap.b_balance -= amount_out;
        from_mint = swap.token_a_mint;
        to_mint = swap.token_b_mint;
    } else if dst_from_reserve_info.key == &swap.token_b_reserve {
        // swap `from` token b `to` token a
        if src_to_reserve_info.key != &swap.token_a_reserve {
            return Err(Errors::InvalidAccountInput.into());
        }
        amount_out = amount * swap.swapping_rate_numerator / swap.swapping_rate_denominator;
        if amount_out > swap.a_balance {
            return Err(Errors::AmountOutNotEnough.into());
        }
        swap.b_balance += amount;
        swap.a_balance -= amount_out;
        from_mint = swap.token_b_mint;
        to_mint = swap.token_a_mint;
    } else {
        return Err(Errors::InvalidAccountInput.into());
    }

    if amount_out == 0 {
        return Err(Errors::AmountOutTooLess.into());
    }

    spl_token_transfer(TokenTransferParams {
        source: src_from_user_account_info.clone(),
        destination: dst_from_reserve_info.clone(),
        amount,
        authority: user_transfer_authority_info.clone(),
        authority_signer_seeds: &[],
        token_program: token_program_id.clone(),
    })?;

    spl_token_transfer(TokenTransferParams {
        source: src_to_reserve_info.clone(),
        destination: dst_to_user_account_info.clone(),
        amount: amount_out,
        authority: swap_authority_info.clone(),
        authority_signer_seeds,
        token_program: token_program_id.clone(),
    })?;

    let event = Events::Swap {
        from_mint,
        amount_in: amount,
        to_mint,
        amount_out
    };
    event.emit();

    Swap::pack(swap, &mut swap_info.data.borrow_mut())?;
    
    Ok(())
}

fn process_init_swap(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    owner: Pubkey,
    swapping_rate_numerator: u64,
    swapping_rate_denominator: u64
) -> ProgramResult {
    assert_u64_non_zero(swapping_rate_numerator)?;
    assert_u64_non_zero(swapping_rate_denominator)?;

    let account_info_iter = &mut accounts.iter();
    let swap_info = next_account_info(account_info_iter)?;
    let rent_info = next_account_info(account_info_iter)?;
    let rent = &Rent::from_account_info(rent_info)?;
    let token_program_id = next_account_info(account_info_iter)?;
    let swap_authority_info = next_account_info(account_info_iter)?;
    let token_a_mint_info = next_account_info(account_info_iter)?;
    let token_a_reserve_info = next_account_info(account_info_iter)?;
    let token_b_mint_info = next_account_info(account_info_iter)?;
    let token_b_reserve_info = next_account_info(account_info_iter)?;

    assert_rent_exempt(rent, swap_info)?;
    let mut swap = assert_uninitialized::<Swap>(swap_info)?;

    assert_program_id(program_id, swap_info.owner)?;
    assert_program_id(token_program_id.key, token_a_mint_info.owner)?;
    assert_program_id(token_program_id.key, token_b_mint_info.owner)?;
    
    // check provided authority account
    let bump_seed = Pubkey::find_program_address(&[swap_info.key.as_ref()], program_id).1;
    let authority_signer_seeds = &[
        swap_info.key.as_ref(),
        &[bump_seed],
    ];
    assert_authority(
        program_id,
        authority_signer_seeds,
        swap_authority_info.key
    )?;

    swap.init(InitSwapParams {
        bump_seed,
        owner,
        token_program_id: *token_program_id.key,
        token_a_mint: *token_a_mint_info.key,
        token_a_reserve: *token_a_reserve_info.key,
        token_b_mint: *token_b_mint_info.key,
        token_b_reserve: *token_b_reserve_info.key,
        swapping_rate_numerator,
        swapping_rate_denominator,
    });
    Swap::pack(swap, &mut swap_info.data.borrow_mut())?;

    spl_token_init_account(TokenInitializeAccountParams {
        account: token_a_reserve_info.clone(),
        mint: token_a_mint_info.clone(),
        owner: swap_authority_info.clone(),
        rent: rent_info.clone(),
        token_program: token_program_id.clone(),
    })?;

    spl_token_init_account(TokenInitializeAccountParams {
        account: token_b_reserve_info.clone(),
        mint: token_b_mint_info.clone(),
        owner: swap_authority_info.clone(),
        rent: rent_info.clone(),
        token_program: token_program_id.clone(),
    })?;

    let event = Events::InitSwap {
        swapping_rate_numerator,
        swapping_rate_denominator,
        token_a_mint: *token_a_mint_info.key,
        token_b_mint: *token_b_mint_info.key,
    };
    event.emit();

    Ok(())
}

impl PrintProgramError for Errors {
    fn print<E>(&self)
    where
        E: 'static + std::error::Error + DecodeError<E> + PrintProgramError + FromPrimitive,
    {
        msg!(&self.to_string());
    }
}
