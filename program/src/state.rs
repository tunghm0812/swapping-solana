use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};
use solana_program::{
    msg,
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::{Pubkey, PUBKEY_BYTES},
};

pub const PROGRAM_VERSION: u8 = 1;
pub const UNINITIALIZED_VERSION: u8 = 0;

/// States of swap
#[derive(Clone, Debug, Default, PartialEq)]
pub struct Swap {
    /// Version of swap
    pub version: u8,
    /// Bump seed for derived authority address
    pub bump_seed: u8,
    /// Owner authority
    pub owner: Pubkey,
    /// Token program id
    pub token_program_id: Pubkey,
    /// Token a mint
    pub token_a_mint: Pubkey,
    /// Token a reserve
    pub token_a_reserve: Pubkey, 
    /// Token b mint
    pub token_b_mint: Pubkey,
    /// Token b reserve
    pub token_b_reserve: Pubkey,
    /// WRAP SOL/Token B <=> swapping_rate_numerator/swapping_rate_denominator
    pub swapping_rate_numerator: u64,
    pub swapping_rate_denominator: u64,
    /// A balance (WRAP SOL)
    pub a_balance: u64,
    /// B balance
    pub b_balance: u64,
}

/// Initialize a lending market
pub struct InitSwapParams {
    pub bump_seed: u8,
    pub owner: Pubkey,
    pub token_program_id: Pubkey,
    pub token_a_mint: Pubkey,
    pub token_a_reserve: Pubkey,
    pub token_b_mint: Pubkey,
    pub token_b_reserve: Pubkey,
    pub swapping_rate_numerator: u64,
    pub swapping_rate_denominator: u64,
}
impl Sealed for Swap {}

impl IsInitialized for Swap {
    fn is_initialized(&self) -> bool {
        self.version != UNINITIALIZED_VERSION
    }
}

impl Swap {
    pub fn new(params: InitSwapParams) -> Self {
        let mut swap = Self::default();
        Self::init(&mut swap, params);
        swap
    }

    pub fn init(&mut self, params: InitSwapParams) {
        self.version = PROGRAM_VERSION;
        self.bump_seed = params.bump_seed;
        self.owner = params.owner;
        self.token_program_id = params.token_program_id;
        self.token_a_mint = params.token_a_mint;
        self.token_a_reserve = params.token_a_reserve;
        self.token_b_mint = params.token_b_mint;
        self.token_b_reserve = params.token_b_reserve;
        self.swapping_rate_numerator = params.swapping_rate_numerator;
        self.swapping_rate_denominator = params.swapping_rate_denominator;
    }
}

const SWAP_LEN: usize = 1 + 1 + PUBKEY_BYTES + PUBKEY_BYTES + PUBKEY_BYTES + PUBKEY_BYTES + PUBKEY_BYTES + PUBKEY_BYTES + 8 + 8 + 8 + 8;
impl Pack for Swap {
    const LEN: usize = SWAP_LEN;

    fn pack_into_slice(&self, output: &mut [u8]) {
        let output = array_mut_ref![output, 0, SWAP_LEN];
        #[allow(clippy::ptr_offset_with_cast)]
        let (
            version,
            bump_seed,
            owner,
            token_program_id,
            token_a_mint,
            token_a_reserve,
            token_b_mint,
            token_b_reserve,
            swapping_rate_numerator,
            swapping_rate_denominator,
            a_balance,
            b_balance
        ) = mut_array_refs![
            output,
            1,
            1,
            PUBKEY_BYTES,
            PUBKEY_BYTES,
            PUBKEY_BYTES,
            PUBKEY_BYTES,
            PUBKEY_BYTES,
            PUBKEY_BYTES,
            8,
            8,
            8,
            8
        ];

        *version = self.version.to_le_bytes();
        *bump_seed = self.bump_seed.to_le_bytes();
        owner.copy_from_slice(self.owner.as_ref());
        token_program_id.copy_from_slice(self.token_program_id.as_ref());
        token_a_mint.copy_from_slice(self.token_a_mint.as_ref());
        token_a_reserve.copy_from_slice(self.token_a_reserve.as_ref());
        token_b_mint.copy_from_slice(self.token_b_mint.as_ref());
        token_b_reserve.copy_from_slice(self.token_b_reserve.as_ref());
        *swapping_rate_numerator = self.swapping_rate_numerator.to_le_bytes();
        *swapping_rate_denominator = self.swapping_rate_denominator.to_le_bytes();
        *a_balance = self.a_balance.to_le_bytes();
        *b_balance = self.b_balance.to_le_bytes();
    }

    /// Unpacks a byte buffer into a Struct
    fn unpack_from_slice(input: &[u8]) -> Result<Self, ProgramError> {
        let input = array_ref![input, 0, SWAP_LEN];
        #[allow(clippy::ptr_offset_with_cast)]
        let (
            version,
            bump_seed,
            owner,
            token_program_id,
            token_a_mint,
            token_a_reserve,
            token_b_mint,
            token_b_reserve,
            swapping_rate_numerator,
            swapping_rate_denominator,
            a_balance,
            b_balance
        ) = array_refs![
            input,
            1,
            1,
            PUBKEY_BYTES,
            PUBKEY_BYTES,
            PUBKEY_BYTES,
            PUBKEY_BYTES,
            PUBKEY_BYTES,
            PUBKEY_BYTES,
            8,
            8,
            8,
            8
        ];

        let version = u8::from_le_bytes(*version);
        if version > PROGRAM_VERSION {
            msg!("version does not match");
            return Err(ProgramError::InvalidAccountData);
        }

        Ok(Self {
            version,
            bump_seed: u8::from_le_bytes(*bump_seed),
            owner: Pubkey::new_from_array(*owner),
            token_program_id: Pubkey::new_from_array(*token_program_id),
            token_a_mint: Pubkey::new_from_array(*token_a_mint),
            token_a_reserve: Pubkey::new_from_array(*token_a_reserve),
            token_b_mint: Pubkey::new_from_array(*token_b_mint),
            token_b_reserve: Pubkey::new_from_array(*token_b_reserve),
            swapping_rate_numerator: u64::from_le_bytes(*swapping_rate_numerator),
            swapping_rate_denominator: u64::from_le_bytes(*swapping_rate_denominator),
            a_balance: u64::from_le_bytes(*a_balance),
            b_balance: u64::from_le_bytes(*b_balance)
        })
    }
}


