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
async fn test_init_swap() {
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

    let swap_account: Account = banks_client
        .get_account(swap_account_info.pubkey)
        .await
        .unwrap()
        .unwrap();

    let swap_data = Swap::unpack(&swap_account.data[..]).unwrap();
    assert_eq!(swap_data.version, PROGRAM_VERSION);
    assert_eq!(swap_data.swapping_rate_numerator, swapping_rate_numerator);
    assert_eq!(swap_data.swapping_rate_denominator, swapping_rate_denominator);

    // return error if swap was initialized
    // let tx = init_swap(
    //     &mut banks_client, 
    //     &payer,
    //     swapping_rate_numerator,
    //     swapping_rate_denominator,
    //     swap_account_info.pubkey,
    //     swap_account_info.authority,
    //     token_mint.pubkey,
    //     token_reserve_info.pubkey
    // ).await;
    // assert!(banks_client.process_transaction(tx).await.is_err());

}

