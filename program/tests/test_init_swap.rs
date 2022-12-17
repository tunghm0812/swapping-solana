#![cfg(feature = "test-sbf")]

mod helpers;

use helpers::*;
use solana_program::{program_pack::Pack};
use solana_program_test::*;
use solana_sdk::{
    account::Account,
    signature::{Signer},
};
use swapping::{
    processor::process_instruction,
    state::{Swap}
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

    let swap_info = create_swap(
        &mut banks_client, 
        &payer,
        swapping_rate_numerator,
        swapping_rate_denominator,
        move_mint.pubkey,
        spl_token::native_mint::ID
    ).await;

    let swap_account: Account = banks_client
        .get_account(swap_info.pubkey)
        .await
        .unwrap()
        .unwrap();
    let swap = Swap::unpack(&swap_account.data[..]).unwrap();

    assert_eq!(swap.token_a_mint, move_mint.pubkey);
    assert_eq!(swap.token_b_mint, spl_token::native_mint::ID);
    assert_eq!(swap.swapping_rate_numerator, swapping_rate_numerator);
    assert_eq!(swap.swapping_rate_denominator, swapping_rate_denominator);
}