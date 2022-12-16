#![cfg(feature = "test-sbf")]
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

    let token_mint = create_mint(
        &mut banks_client, 
        &payer,
        &payer.pubkey(),
        "MOVE",
        6
    ).await;

    let swap_seed = "SWAP_V1";
    let swap_account_info = init_account_with_seed(
        &mut banks_client, 
        &payer,
        swap_seed,
        swapping::id(),
        Swap::LEN as u64
    ).await;

    let token_reserve_seed = "MOVE_RESERVE";
    let token_reserve_info = init_account_with_seed(
        &mut banks_client, 
        &payer,
        token_reserve_seed,
        spl_token::id(),
        Token::LEN as u64
    ).await;

    let swapping_rate_numerator: u64 = 10;
    let swapping_rate_denominator: u64 = 1;

    let tx = init_swap(
        &mut banks_client, 
        &payer,
        swapping_rate_numerator,
        swapping_rate_denominator,
        swap_account_info.pubkey,
        swap_account_info.authority,
        token_mint.pubkey,
        token_reserve_info.pubkey
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
    let tx = init_swap(
        &mut banks_client, 
        &payer,
        swapping_rate_numerator,
        swapping_rate_denominator,
        swap_account_info.pubkey,
        swap_account_info.authority,
        token_mint.pubkey,
        token_reserve_info.pubkey
    ).await;
    assert!(banks_client.process_transaction(tx).await.is_err());

}

pub struct AccountWithSeed {
    pub pubkey: Pubkey,
    pub authority: Pubkey
}

pub async fn init_account_with_seed(
    banks_client: &mut BanksClient,
    payer: &Keypair,
    seed: &str,
    program_id: Pubkey,
    size: u64
) -> AccountWithSeed {
    let pubkey = Pubkey::create_with_seed(&payer.pubkey(), seed, &program_id).unwrap();
    let authority = Pubkey::find_program_address(&[pubkey.as_ref()], &program_id).0;
    let rent = banks_client.get_rent().await.unwrap();

    let transaction = Transaction::new_signed_with_payer(
        &[
            system_instruction::create_account_with_seed(
                &payer.pubkey(),
                &pubkey,
                &payer.pubkey(),
                seed,
                rent.minimum_balance(size.try_into().unwrap()),
                size,
                &program_id,
            )
        ],
        Some(&payer.pubkey()),
        &[payer],
        banks_client.get_latest_blockhash().await.unwrap()
    );
    banks_client.process_transaction(transaction).await;

    AccountWithSeed {
        pubkey,
        authority
    }
}

pub async fn init_swap(
    banks_client: &mut BanksClient, 
    payer: &Keypair,
    swapping_rate_numerator: u64,
    swapping_rate_denominator: u64,
    swap_pubkey: Pubkey,
    swap_authority: Pubkey,
    token_mint_pub: Pubkey,
    token_reserve_pub: Pubkey
) -> Transaction {
    let transaction = Transaction::new_signed_with_payer(
        &[
            swapping::instruction::init_swap(
                swapping::id(),
                payer.pubkey(),
                swapping_rate_numerator,
                swapping_rate_denominator,
                swap_pubkey,
                swap_authority,
                token_mint_pub,
                token_reserve_pub
            )
        ],
        Some(&payer.pubkey()),
        &[payer],
        banks_client.get_latest_blockhash().await.unwrap()
    );
    // banks_client.process_transaction(transaction).await;
    transaction
}

pub async fn create_mint(
    banks_client: &mut BanksClient,
    payer: &Keypair,
    owner: &Pubkey,
    symbol: &str,
    decimals: u8,
) -> AccountWithSeed {
    let token_mint_info = init_account_with_seed(
        banks_client, 
        &payer,
        symbol,
        spl_token::id(),
        Mint::LEN as u64
    ).await;

    let transaction = Transaction::new_signed_with_payer(
        &[
            instruction::initialize_mint(&spl_token::id(), &token_mint_info.pubkey, owner, None, decimals).unwrap(),
        ],
        Some(&payer.pubkey()),
        &[payer],
        banks_client.get_latest_blockhash().await.unwrap(),
    );
    banks_client.process_transaction(transaction).await;

    AccountWithSeed {
        pubkey: token_mint_info.pubkey,
        authority: token_mint_info.authority
    }
}
