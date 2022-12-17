use crate::{error::Errors,};
use solana_program::{
    account_info::{AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program_error::{ProgramError},
    program_pack::{IsInitialized, Pack},
    pubkey::Pubkey,
    sysvar::{rent::Rent,},
};

pub fn assert_u64_non_zero(value: u64) -> ProgramResult {
    if value == 0 {
        return Err(Errors::InvalidAmount.into());
    }
    Ok(())
}

pub fn assert_must_signer(signer: &AccountInfo) -> ProgramResult {
    if !signer.is_signer {
        return Err(Errors::MustSigner.into())
    }
    Ok(())
}

pub fn assert_program_id(
    expected_program_id: &Pubkey, 
    provided_program_id: &Pubkey, 
) -> ProgramResult {
    if provided_program_id != expected_program_id {
        return Err(Errors::InvalidAccountOwner.into());
    }
    Ok(())
}

pub fn assert_authority(
    program_id: &Pubkey,
    authority_signer_seeds: &[&[u8]],
    authority_pubkey: &Pubkey,
) -> ProgramResult {
    let authority_expected_pubkey = Pubkey::create_program_address(authority_signer_seeds, program_id)?;
    if &authority_expected_pubkey != authority_pubkey {
        return Err(Errors::InvalidAuthorityPubkey.into());
    }
    Ok(())
}

pub fn assert_rent_exempt(rent: &Rent, account_info: &AccountInfo) -> ProgramResult {
    if !rent.is_exempt(account_info.lamports(), account_info.data_len()) {
        msg!(&rent.minimum_balance(account_info.data_len()).to_string());
        Err(Errors::NotRentExempt.into())
    } else {
        Ok(())
    }
}

pub fn assert_uninitialized<T: Pack + IsInitialized>(
    account_info: &AccountInfo,
) -> Result<T, ProgramError> {
    let account: T = T::unpack_unchecked(&account_info.data.borrow())?;
    if account.is_initialized() {
        Err(Errors::AlreadyInitialized.into())
    } else {
        Ok(account)
    }
}