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
pub enum SwapInstructions {
    // 0
    /// Initializes a new swap.
    ///
    /// Accounts expected by this instruction:
    ///
    ///   0. `[writable]` Swap account - uninitialized.
    ///   1. `[]` Rent sysvar.
    ///   2. `[]` Token program id.
    ///   3. `[]` Derived swap authority.
    ///   4. `[]` Swapping token mint.
    ///   5. `[writable]` Swapping token reserve.
    InitSwap {
        owner: Pubkey,
        swapping_rate_numerator: u64,
        swapping_rate_denominator: u64
    },
    // 1
    /// Swap SOL to Tokens
    /// 
    /// Accounts expected by this instruction:
    ///
    ///   0. `[writable]` swap account.
    ///   1. `[]` Token program id.
    ///   2. `[]` Derived swap authority.
    ///   3. `[signer]` User transfer authority.
    ///   4. `[]` Source token account (swapping_token_reserve).
    ///   5. `[]` Destination token account (user_account).
    SwapSOLToTokens {
        amountSOL: u64
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
    token_mint: Pubkey,
    token_reserve: Pubkey
) -> Instruction {
    Instruction {
        program_id,
        accounts: vec![
            AccountMeta::new(swap_pubkey, false),
            AccountMeta::new_readonly(sysvar::rent::id(), false),
            AccountMeta::new_readonly(spl_token::id(), false),
            AccountMeta::new_readonly(swap_authority, false),
            AccountMeta::new_readonly(token_mint, false),
            AccountMeta::new(token_reserve, false),
        ],
        data: SwapInstructions::InitSwap {
            owner,
            swapping_rate_numerator,
            swapping_rate_denominator
        }
        .try_to_vec().unwrap(),
    }
}

