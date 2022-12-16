//! Program state processor

use crate::{
    error::Errors,
    instruction::Instructions,
    // event::LendingEvent,
    state::{Swap, InitSwapParams},
    // tools::{
    //     account::{
    //         get_account_data, get_uninitialized_account_data, 
    //         create_and_serialize_account_signed
    //     },
    //     spl_token::{get_spl_token_owner, get_spl_token_amount}
    // }
};
use num_traits::FromPrimitive;
use solana_program::{
    system_instruction,
    account_info::{next_account_info, AccountInfo},
    decode_error::DecodeError,
    entrypoint::ProgramResult,
    instruction::Instruction,
    msg,
    program::{invoke, invoke_signed},
    program_error::{PrintProgramError, ProgramError},
    program_pack::{IsInitialized, Pack},
    pubkey::Pubkey,
    sysvar::{clock::Clock, rent::Rent, Sysvar},
};
// use spl_token::state::{Account, Mint};
// use std::convert::TryInto;
use borsh::{BorshSerialize, BorshDeserialize};

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
        Instructions::SwapSOLToTokens {
            amount_a,
        } => {
            process_swap_sol_to_tokens(program_id, accounts,amount_a,
            )
        }
    }
}

fn process_deposit(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount_a: u64,
    amount_b: u64
) -> ProgramResult {
    if amount_a == 0 || amount_b == 0 {
        return Err(Errors::InvalidAmount.into());
    }

    let account_info_iter = &mut accounts.iter();
    let swap_info = next_account_info(account_info_iter)?;
    let token_program_id = next_account_info(account_info_iter)?;
    let user_transfer_authority_info = next_account_info(account_info_iter)?;
    let src_token_a_account_info = next_account_info(account_info_iter)?;
    let dest_token_a_reserve_info = next_account_info(account_info_iter)?;
    let src_token_b_account_info = next_account_info(account_info_iter)?;
    let dest_token_b_reserve_info = next_account_info(account_info_iter)?;

    if swap_info.owner != program_id {
        return Err(Errors::InvalidAccountOwner.into());
    }

    let mut swap = Swap::unpack(&swap_info.data.borrow())?;
    if &swap.token_program_id != token_program_id.key {
        return Err(Errors::InvalidTokenProgram.into());
    }

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
    Swap::pack(swap, &mut swap_info.data.borrow_mut())?;

    Ok(())
}

fn process_swap_sol_to_tokens(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount_SOL: u64,
) -> ProgramResult {
    if amount_SOL == 0 {
        return Err(Errors::InvalidAmount.into());
    }

    let account_info_iter = &mut accounts.iter();
    let swap_info = next_account_info(account_info_iter)?;
    let token_program_id = next_account_info(account_info_iter)?;
    let swap_authority_info = next_account_info(account_info_iter)?;
    let user_transfer_authority_info = next_account_info(account_info_iter)?;
    let swapping_token_reserve_info = next_account_info(account_info_iter)?;
    let destination_token_account_info = next_account_info(account_info_iter)?;

    // if swap_info.owner != program_id {
    //     return Err(Errors::InvalidAccountOwner.into());
    // }

    // let mut swap = Swap::unpack(&swap_info.data.borrow())?;
    // if &swap.token_program_id != token_program_id.key {
    //     return Err(Errors::InvalidTokenProgram.into());
    // }

    // let authority_signer_seeds = &[
    //     swap_info.key.as_ref(),
    //     &[swap.bump_seed],
    // ];
    // let swap_authority_expected_pubkey = Pubkey::create_program_address(authority_signer_seeds, program_id)?;
    // if &swap_authority_expected_pubkey != swap_authority_info.key {
    //     return Err(Errors::InvalidAuthorityPubkey.into());
    // }

    // if &swap.token_a_reserve != swapping_token_reserve_info.key {
    //     return Err(Errors::InvalidAccountInput.into());
    // }

    // let amount_token_out = amount_SOL * swap.swapping_rate_numerator / swap.swapping_rate_denominator;
    // if amount_token_out == 0 {
    //     return Err(Errors::AmountOutTooLess.into());
    // }
    // if amount_token_out > swap.token_balance {
    //     return Err(Errors::AmountOutNotEnough.into());
    // }

    // transfer_lamports(user_transfer_authority_info, swap_info, amount_SOL);
    // spl_token_transfer(TokenTransferParams {
    //     source: swapping_token_reserve_info.clone(),
    //     destination: destination_token_account_info.clone(),
    //     amount: amount_token_out,
    //     authority: swap_authority_info.clone(),
    //     authority_signer_seeds,
    //     token_program: token_program_id.clone(),
    // })?;

    // swap.sol_balance += amount_SOL;
    // swap.token_balance -= amount_token_out;
    // Swap::pack(swap, &mut swap_info.data.borrow_mut())?;

    Ok(())
}

fn process_init_swap(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    owner: Pubkey,
    swapping_rate_numerator: u64,
    swapping_rate_denominator: u64
) -> ProgramResult {
    if swapping_rate_numerator == 0 || swapping_rate_denominator == 0 {
        return Err(Errors::InvalidRate.into());
    }

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
    if swap_info.owner != program_id {
        return Err(Errors::InvalidAccountOwner.into());
    }

    if token_a_mint_info.owner != token_program_id.key || token_b_mint_info.owner != token_program_id.key {
        return Err(Errors::InvalidAccountOwner.into());
    }
    
    // check provided authority account
    let bump_seed = Pubkey::find_program_address(&[swap_info.key.as_ref()], program_id).1;
    let authority_signer_seeds = &[
        swap_info.key.as_ref(),
        &[bump_seed],
    ];
    let swap_authority_expected_pubkey = Pubkey::create_program_address(authority_signer_seeds, program_id)?;
    if &swap_authority_expected_pubkey != swap_authority_info.key {
        return Err(Errors::InvalidAuthorityPubkey.into());
    }

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

    Ok(())
}

struct TokenInitializeAccountParams<'a> {
    account: AccountInfo<'a>,
    mint: AccountInfo<'a>,
    owner: AccountInfo<'a>,
    rent: AccountInfo<'a>,
    token_program: AccountInfo<'a>,
}

struct TokenTransferParams<'a: 'b, 'b> {
    source: AccountInfo<'a>,
    destination: AccountInfo<'a>,
    amount: u64,
    authority: AccountInfo<'a>,
    authority_signer_seeds: &'b [&'b [u8]],
    token_program: AccountInfo<'a>,
}

fn spl_token_transfer(params: TokenTransferParams<'_, '_>) -> ProgramResult {
    let TokenTransferParams {
        source,
        destination,
        authority,
        token_program,
        amount,
        authority_signer_seeds,
    } = params;
    let result = invoke_optionally_signed(
        &spl_token::instruction::transfer(
            token_program.key,
            source.key,
            destination.key,
            authority.key,
            &[],
            amount,
        )?,
        &[source, destination, authority, token_program],
        authority_signer_seeds,
    );
    result.map_err(|_| Errors::TokenTransferFailed.into())
}

fn invoke_optionally_signed(
    instruction: &Instruction,
    account_infos: &[AccountInfo],
    authority_signer_seeds: &[&[u8]],
) -> ProgramResult {
    if authority_signer_seeds.is_empty() {
        invoke(instruction, account_infos)
    } else {
        invoke_signed(instruction, account_infos, &[authority_signer_seeds])
    }
}

fn spl_token_init_account(params: TokenInitializeAccountParams<'_>) -> ProgramResult {
    let TokenInitializeAccountParams {
        account,
        mint,
        owner,
        rent,
        token_program,
    } = params;
    let ix = spl_token::instruction::initialize_account(
        token_program.key,
        account.key,
        mint.key,
        owner.key,
    )?;
    let result = invoke(&ix, &[account, mint, owner, rent, token_program]);
    result.map_err(|_| Errors::TokenInitializeAccountFailed.into())
}

fn transfer_lamports(
    from_account: &AccountInfo,
    to_account: &AccountInfo,
    amount_of_lamports: u64,
) -> ProgramResult {
    // Does the from account have enough lamports to transfer?
    if **from_account.try_borrow_lamports()? < amount_of_lamports {
        return Err(Errors::InsufficientFundsForTransaction.into());
    }
    // Debit from_account and credit to_account
    **from_account.try_borrow_mut_lamports()? -= amount_of_lamports;
    **to_account.try_borrow_mut_lamports()? += amount_of_lamports;
    Ok(())
}

fn assert_rent_exempt(rent: &Rent, account_info: &AccountInfo) -> ProgramResult {
    if !rent.is_exempt(account_info.lamports(), account_info.data_len()) {
        msg!(&rent.minimum_balance(account_info.data_len()).to_string());
        Err(Errors::NotRentExempt.into())
    } else {
        Ok(())
    }
}

fn assert_uninitialized<T: Pack + IsInitialized>(
    account_info: &AccountInfo,
) -> Result<T, ProgramError> {
    let account: T = T::unpack_unchecked(&account_info.data.borrow())?;
    if account.is_initialized() {
        Err(Errors::AlreadyInitialized.into())
    } else {
        Ok(account)
    }
}


impl PrintProgramError for Errors {
    fn print<E>(&self)
    where
        E: 'static + std::error::Error + DecodeError<E> + PrintProgramError + FromPrimitive,
    {
        msg!(&self.to_string());
    }
}
