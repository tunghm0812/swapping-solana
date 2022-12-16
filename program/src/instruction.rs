//! Instruction types

// use crate::{
//     state::{ReserveConfig, InterestRateMode},
// };
use solana_program::{
    instruction::{AccountMeta, Instruction},
    pubkey::{Pubkey, PUBKEY_BYTES},
    sysvar,
};
use borsh::{BorshDeserialize, BorshSchema, BorshSerialize};

/// Instructions supported by the program.
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
pub enum Instructions {
    // 0
    /// Initializes a new swap.
    ///
    /// Accounts expected by this instruction:
    ///
    ///   0. `[writable]` Swap account - uninitialized.
    ///   1. `[]` Rent sysvar.
    ///   2. `[]` Token program id.
    ///   3. `[]` Derived swap authority.
    ///   4. `[]` token a mint.
    ///   5. `[writable]` token a reserve.
    ///   6. `[]` token b mint.
    ///   7. `[writable]` token b reserve.
    InitSwap {
        owner: Pubkey,
        swapping_rate_numerator: u64,
        swapping_rate_denominator: u64
    },
    // 1
    /// Deposit SOL and Tokens to swap pool
    /// 
    /// Accounts expected by this instruction:
    ///
    ///   0. `[writable]` swap account.
    ///   1. `[]` Token program id.
    ///   2. `[signer]` User transfer authority.
    ///   3. `[writable]` src token a account (user_account).
    ///   4. `[writable]` dest token a reserve.
    ///   5. `[writable]` src token b account (user_account).
    ///   6. `[writable]` dest token b reserve.
    Deposit {
        amount_a: u64,
        amount_b: u64
    },
    // 2
    /// Swap SOL to Tokens
    /// 
    /// Accounts expected by this instruction:
    ///
    ///   0. `[writable]` swap account.
    ///   1. `[]` Token program id.
    ///   2. `[]` Derived swap authority.
    ///   3. `[signer]` User transfer authority.
    ///   4. `[writable]` Source token account (swapping_token_reserve).
    ///   5. `[writable]` Destination token account (user_account).
    SwapSOLToTokens {
        amount_a: u64
    },
}


/// Creates an 'InitSwap' instruction.
pub fn init_swap(
    program_id: Pubkey,
    owner: Pubkey,
    swapping_rate_numerator: u64,
    swapping_rate_denominator: u64,
    swap_pubkey: Pubkey,
    swap_authority: Pubkey,
    token_a_mint: Pubkey,
    token_a_reserve: Pubkey,
    token_b_mint: Pubkey,
    token_b_reserve: Pubkey
) -> Instruction {
    Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(swap_pubkey, false),
            AccountMeta::new_readonly(sysvar::rent::id(), false),
            AccountMeta::new_readonly(spl_token::id(), false),
            AccountMeta::new_readonly(swap_authority, false),
            AccountMeta::new_readonly(token_a_mint, false),
            AccountMeta::new(token_a_reserve, false),
            AccountMeta::new_readonly(token_b_mint, false),
            AccountMeta::new(token_b_reserve, false),
        ],
        data: Instructions::InitSwap {
            owner,
            swapping_rate_numerator,
            swapping_rate_denominator
        }
        .try_to_vec().unwrap(),
    }
}

/// Creates an 'Deposit' instruction.
pub fn deposit(
    program_id: Pubkey,
    amount_a: u64,
    amount_b: u64,
    swap_pubkey: Pubkey,
    user_pubkey: Pubkey,
    src_token_a_account: Pubkey,
    dest_token_a_reserve: Pubkey,
    src_token_b_account: Pubkey,
    dest_token_b_reserve: Pubkey
) -> Instruction {
    Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(swap_pubkey, false),
            AccountMeta::new_readonly(spl_token::id(), false),
            AccountMeta::new(user_pubkey, true),
            AccountMeta::new(src_token_a_account, false),
            AccountMeta::new(dest_token_a_reserve, false),
            AccountMeta::new(src_token_b_account, false),
            AccountMeta::new(dest_token_b_reserve, false),
        ],
        data: Instructions::Deposit {
            amount_a,
            amount_b
        }
        .try_to_vec().unwrap(),
    }
}

/// Creates an 'SwapSOLToTokens' instruction.
pub fn swap_sol_to_tokens(
    program_id: Pubkey,
    amount_a: u64,
    swap_pubkey: Pubkey,
    swap_authority: Pubkey,
    user_pubkey: Pubkey,
    src_token_reserve: Pubkey,
    dest_user_token_account: Pubkey,

) -> Instruction {
    Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(swap_pubkey, false),
            AccountMeta::new_readonly(spl_token::id(), false),
            AccountMeta::new_readonly(swap_authority, false),
            AccountMeta::new(user_pubkey, true),
            AccountMeta::new(src_token_reserve, false),
            AccountMeta::new(dest_user_token_account, false),
        ],
        data: Instructions::SwapSOLToTokens {
            amount_a
        }
        .try_to_vec().unwrap(),
    }
}
