#![cfg(feature = "test-sbf")]

mod helpers;

use helpers::*;
use solana_program::{program_pack::Pack, pubkey::Pubkey,};
use solana_program_test::*;
use solana_sdk::{
    account::Account,
    signature::{Signer, Keypair},
    transaction::{Transaction},
    system_instruction
};
use swapping::{
    processor::process_instruction,
    state::{Swap, PROGRAM_VERSION}
};
use spl_token::{
    instruction,
    state::{Account as Token, Mint},
};

#[tokio::test]
async fn test_swap() {
    let test = ProgramTest::new(
        "swapping",
        swapping::id(),
        processor!(process_instruction),
    );

    let (mut banks_client, payer, _recent_blockhash) = test.start().await;

    let move_symbol = "MOVE";
    let decimals = spl_token::native_mint::DECIMALS as u64;
    let move_balance = 1_000_000;
    let wsol_balance = 1_000_000;
    let deposited_move_amount = 10_000;
    let deposited_wsol_amount = 1_000;

    // rate in lamports
    let swapping_rate_numerator: u64 = 10;
    let swapping_rate_denominator: u64 = 1;

    let move_mint = create_mint(
        &mut banks_client, 
        &payer,
        &payer.pubkey(),
        move_symbol,
        decimals.try_into().unwrap()
    ).await;

    let move_payer_ata = create_ata_then_mint_to(
        &mut banks_client, 
        &payer,
        &move_mint,
        move_balance
    ).await;

    let wsol_payer_ata = wrap_sol(
        &mut banks_client, 
        &payer,
        &payer.pubkey(),
        wsol_balance
    ).await;

    let swap_info = create_swap(
        &mut banks_client, 
        &payer,
        swapping_rate_numerator,
        swapping_rate_denominator,
        move_mint.pubkey,
        spl_token::native_mint::ID
    ).await;

    deposit_to_swap(
        &mut banks_client, 
        &payer,
        &swap_info,
        deposited_move_amount,
        deposited_wsol_amount,
        move_payer_ata.pubkey,
        wsol_payer_ata.pubkey
    ).await;

    let swap_account: Account = banks_client
        .get_account(swap_info.pubkey)
        .await
        .unwrap()
        .unwrap();
    let swap = Swap::unpack(&swap_account.data[..]).unwrap();

    assert_eq!(swap.a_balance, deposited_move_amount);
    assert_eq!(swap.b_balance, deposited_wsol_amount);
}