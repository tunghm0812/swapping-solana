extern crate hex;

use solana_program::{
    pubkey::{Pubkey},msg,
};
use borsh::{BorshDeserialize, BorshSchema, BorshSerialize};

/// Events supported by the program.
#[derive(Clone, Debug, PartialEq, BorshDeserialize, BorshSerialize, BorshSchema)]

pub enum Events {
    /// 0
    InitSwap {
        #[allow(dead_code)]
        swapping_rate_numerator: u64,

        #[allow(dead_code)]
        swapping_rate_denominator: u64,

        #[allow(dead_code)]
        token_a_mint: Pubkey,

        #[allow(dead_code)]
        token_b_mint: Pubkey,
    },
    Deposit {
        #[allow(dead_code)]
        amount_a: u64,

        #[allow(dead_code)]
        amount_b: u64,

        #[allow(dead_code)]
        balance_a: u64,

        #[allow(dead_code)]
        balance_b: u64
    },
    Swap {
        #[allow(dead_code)]
        from_mint: Pubkey,

        #[allow(dead_code)]
        amount_in: u64,

        #[allow(dead_code)]
        to_mint: Pubkey,

        #[allow(dead_code)]
        amount_out: u64
    }
}

impl Events {
    /// Emit a [Events] into a hex string.
    pub fn emit(&self) -> String {
        let buf = self.try_to_vec().unwrap();
        let hex = hex::encode(buf);

        msg!("Event: {}", hex);
        hex
    }
}