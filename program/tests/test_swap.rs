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

    let wsol_payer_balance_before_swap = get_spl_token_account(&mut banks_client, wsol_payer_ata.pubkey).await.amount;
    let move_payer_balance_before_swap = get_spl_token_account(&mut banks_client, move_payer_ata.pubkey).await.amount;

    /// Swap 20 MOVE to 2 WSOL (in lamports)
    let swap_amount: u64 = 20;
    let expected_wsol_amount: u64 = swap_amount * swapping_rate_denominator / swapping_rate_numerator;

    swap(
        &mut banks_client, 
        &payer,
        &swap_info,
        swap_amount,
        move_payer_ata.pubkey,
        wsol_payer_ata.pubkey
    ).await;

    let wsol_payer_balance_after_swap = get_spl_token_account(&mut banks_client, wsol_payer_ata.pubkey).await.amount;
    let move_payer_balance_after_swap = get_spl_token_account(&mut banks_client, move_payer_ata.pubkey).await.amount;

    assert_eq!(move_payer_balance_before_swap - move_payer_balance_after_swap, swap_amount);
    assert_eq!(wsol_payer_balance_after_swap - wsol_payer_balance_before_swap, expected_wsol_amount);

    /// Unwrap SOL
    let sol_payer_balance_before_unwrap = banks_client.get_balance(payer.pubkey()).await.unwrap();
    unwrap_sol(&mut banks_client, &payer).await;
    let sol_payer_balance_after_unwrap = banks_client.get_balance(payer.pubkey()).await.unwrap();
    assert_eq!(sol_payer_balance_after_unwrap, sol_payer_balance_before_unwrap + wsol_payer_balance_after_swap + NATIVE_RENT_EXEMPT);

    /// Swap 1_000 SOL to 20_000 MOVE (in lamports)
    let swap_amount: u64 = 1_000;
    let expected_move_amount: u64 = swap_amount * swapping_rate_numerator / swapping_rate_denominator;

    let wsol_payer_ata = wrap_sol(
        &mut banks_client, 
        &payer,
        &payer.pubkey(),
        swap_amount
    ).await;

    let wsol_payer_balance_before_swap = get_spl_token_account(&mut banks_client, wsol_payer_ata.pubkey).await.amount;
    let move_payer_balance_before_swap = get_spl_token_account(&mut banks_client, move_payer_ata.pubkey).await.amount;

    swap(
        &mut banks_client, 
        &payer,
        &swap_info,
        swap_amount,
        wsol_payer_ata.pubkey,
        move_payer_ata.pubkey
    ).await;

    let wsol_payer_balance_after_swap = get_spl_token_account(&mut banks_client, wsol_payer_ata.pubkey).await.amount;
    let move_payer_balance_after_swap = get_spl_token_account(&mut banks_client, move_payer_ata.pubkey).await.amount;

    assert_eq!(move_payer_balance_after_swap - move_payer_balance_before_swap, expected_move_amount);
    assert_eq!(wsol_payer_balance_before_swap - wsol_payer_balance_after_swap, swap_amount);

    unwrap_sol(&mut banks_client, &payer).await;
}