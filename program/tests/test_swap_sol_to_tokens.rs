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
async fn test_swap_sol_to_tokens() {
    let test = ProgramTest::new(
        "swapping",
        swapping::id(),
        processor!(process_instruction),
    );

    let (mut banks_client, payer, _recent_blockhash) = test.start().await;

    let token_a_symbol = "WSOL";
    let token_b_symbol = "MOVE";
    let token_a_reserve_seed = "WSOL_RESERVE";
    let token_b_reserve_seed = "MOVE_RESERVE";
    let decimals = spl_token::native_mint::DECIMALS;
    let token_a_mint_pub = spl_token::native_mint::ID;
    let swapping_rate_numerator: u64 = 10;
    let swapping_rate_denominator: u64 = 1;

    let token_b_mint = create_mint(
        &mut banks_client, 
        &payer,
        &payer.pubkey(),
        token_b_symbol,
        decimals
    ).await;

    let swap_seed = "SWAP_V1";
    let swap_account_info = init_account_with_seed(
        &mut banks_client, 
        &payer,
        swap_seed,
        swapping::id(),
        Swap::LEN as u64
    ).await;

    let token_a_reserve_info = init_account_with_seed(
        &mut banks_client, 
        &payer,
        token_a_reserve_seed,
        spl_token::id(),
        Token::LEN as u64
    ).await;

    let token_b_reserve_info = init_account_with_seed(
        &mut banks_client, 
        &payer,
        token_b_reserve_seed,
        spl_token::id(),
        Token::LEN as u64
    ).await;

    let tx = init_swap(
        &mut banks_client, 
        &payer,
        swapping_rate_numerator,
        swapping_rate_denominator,
        swap_account_info.pubkey,
        swap_account_info.authority,
        token_a_mint_pub,
        token_a_reserve_info.pubkey,
        token_b_mint.pubkey,
        token_b_reserve_info.pubkey
    ).await;
    banks_client.process_transaction(tx).await;

    let token_ata = create_associated_token_address(
        &mut banks_client, 
        &payer,
        payer.pubkey(),
        token_b_mint.pubkey
    ).await;

    mint_to(
        &mut banks_client, 
        &payer,
        &token_b_mint.pubkey,
        &token_ata.pubkey,
        &payer,
        1000000000000
    ).await;

    let wrap_sol_ata = wrap_sol(
        &mut banks_client, 
        &payer,
        &payer.pubkey(),
        1000000000000
    ).await;

    let tx = deposit(
        &mut banks_client, 
        &payer,
        10000,
        10000,
        swap_account_info.pubkey,
        payer.pubkey(),
        wrap_sol_ata.pubkey,
        token_a_reserve_info.pubkey,
        token_ata.pubkey,
        token_b_reserve_info.pubkey
    ).await;
    banks_client.process_transaction(tx).await;

}

pub async fn deposit(
    banks_client: &mut BanksClient, 
    payer: &Keypair,
    amount_a: u64,
    amount_b: u64,
    swap_pubkey: Pubkey,
    user_pubkey: Pubkey,
    src_token_a_account: Pubkey,
    dest_token_a_reserve: Pubkey,
    src_token_b_account: Pubkey,
    dest_token_b_reserve: Pubkey
) -> Transaction {
    let transaction = Transaction::new_signed_with_payer(
        &[
            swapping::instruction::deposit(
                swapping::id(),
                amount_a,
                amount_b,
                swap_pubkey,
                user_pubkey,
                src_token_a_account,
                dest_token_a_reserve,
                src_token_b_account,
                dest_token_b_reserve
            )
        ],
        Some(&payer.pubkey()),
        &[payer],
        banks_client.get_latest_blockhash().await.unwrap()
    );
    transaction
}