use solana_program::{program_pack::Pack, pubkey::Pubkey};
use solana_program_test::*;
use solana_sdk::{
    account::Account,
    signature::{Signer, Keypair},
    transaction::{Transaction},
    system_instruction
};
use swapping::{
    state::{Swap}
};
use spl_token::{
    instruction as spl_token_instruction,
    state::{Account as Token, Mint},
};
use spl_associated_token_account::{
    get_associated_token_address, instruction::create_associated_token_account,
};

#[allow(dead_code)]
pub const NATIVE_RENT_EXEMPT: u64 = 2034280;

#[derive(Clone, Debug, Default, PartialEq)]
pub struct AccountWithSeed {
    pub pubkey: Pubkey,
    pub authority: Pubkey
}

#[derive(Clone, Debug, Default, PartialEq)]
pub struct SwapInfo {
    pub pubkey: Pubkey,
    pub authority: Pubkey,
    swapping_rate_numerator: u64,
    swapping_rate_denominator: u64,
    token_a_mint_pub: Pubkey,
    token_b_mint_pub: Pubkey,
    token_a_reserve_pub: Pubkey,
    token_b_reserve_pub: Pubkey
}

#[allow(dead_code)]
pub async fn get_spl_token_account(
    banks_client: &mut BanksClient,
    account: Pubkey
) -> Token {
    let spl_token_account: Account = banks_client
        .get_account(account)
        .await
        .unwrap()
        .unwrap();
    let spl_token = Token::unpack(&spl_token_account.data[..]).unwrap();
    spl_token
}

#[allow(dead_code)]
pub async fn swap(
    banks_client: &mut BanksClient, 
    payer: &Keypair,
    swap_info: &SwapInfo,
    amount: u64,
    src_from_ata: Pubkey,
    dst_to_ata: Pubkey
) {
    let dst_from_reserve: Pubkey;
    let src_to_reserve: Pubkey;

    let src_from_ata_info = get_spl_token_account(banks_client, src_from_ata).await;
    let dst_to_ata_info = get_spl_token_account(banks_client, dst_to_ata).await;

    if src_from_ata_info.mint == swap_info.token_a_mint_pub && dst_to_ata_info.mint == swap_info.token_b_mint_pub {
        dst_from_reserve = swap_info.token_a_reserve_pub;
        src_to_reserve = swap_info.token_b_reserve_pub;
    } else if src_from_ata_info.mint == swap_info.token_b_mint_pub && dst_to_ata_info.mint == swap_info.token_a_mint_pub {
        dst_from_reserve = swap_info.token_b_reserve_pub;
        src_to_reserve = swap_info.token_a_reserve_pub;
    } else {
        println!("swap error!");
        return;
    }

    let transaction = Transaction::new_signed_with_payer(
        &[
            swapping::instruction::swap(
                swapping::id(),
                amount,
                swap_info.pubkey,
                swap_info.authority,
                payer.pubkey(),
                src_from_ata,
                dst_from_reserve,
                src_to_reserve,
                dst_to_ata
            )
        ],
        Some(&payer.pubkey()),
        &[payer],
        banks_client.get_latest_blockhash().await.unwrap()
    );
    let _result = banks_client.process_transaction(transaction).await;
}

#[allow(dead_code)]
pub async fn deposit_to_swap(
    banks_client: &mut BanksClient, 
    payer: &Keypair,
    swap_info: &SwapInfo,
    deposit_a_amount: u64,
    deposit_b_amount: u64,
    src_a_ata: Pubkey,
    src_b_ata: Pubkey
) {
    let transaction = Transaction::new_signed_with_payer(
        &[
            swapping::instruction::deposit(
                swapping::id(),
                deposit_a_amount,
                deposit_b_amount,
                swap_info.pubkey,
                payer.pubkey(),
                src_a_ata,
                swap_info.token_a_reserve_pub,
                src_b_ata,
                swap_info.token_b_reserve_pub
            )
        ],
        Some(&payer.pubkey()),
        &[payer],
        banks_client.get_latest_blockhash().await.unwrap()
    );
    let _result = banks_client.process_transaction(transaction).await;
}

#[allow(dead_code)]
pub async fn create_swap(
    banks_client: &mut BanksClient, 
    payer: &Keypair,
    swapping_rate_numerator: u64,
    swapping_rate_denominator: u64,
    token_a_mint_pub: Pubkey,
    token_b_mint_pub: Pubkey
) -> SwapInfo {
    let swap_seed = "MOVE_WSOL";
    let token_a_reserve_seed = "MOVE_RESERVE";
    let token_b_reserve_seed = "WSOL_RESERVE";
    
    let swap_account_info = init_account_with_seed(
        banks_client, 
        payer,
        swap_seed,
        swapping::id(),
        Swap::LEN as u64
    ).await;

    let token_a_reserve_info = init_account_with_seed(
        banks_client, 
        payer,
        token_a_reserve_seed,
        spl_token::id(),
        Token::LEN as u64
    ).await;

    let token_b_reserve_info = init_account_with_seed(
        banks_client, 
        payer,
        token_b_reserve_seed,
        spl_token::id(),
        Token::LEN as u64
    ).await;

    let tx = init_swap(
        banks_client, 
        payer,
        swapping_rate_numerator,
        swapping_rate_denominator,
        swap_account_info.pubkey,
        swap_account_info.authority,
        token_a_mint_pub,
        token_a_reserve_info.pubkey,
        token_b_mint_pub,
        token_b_reserve_info.pubkey
    ).await;
    let _result = banks_client.process_transaction(tx).await;

    SwapInfo {
        pubkey: swap_account_info.pubkey,
        authority: swap_account_info.authority,
        swapping_rate_numerator,
        swapping_rate_denominator,
        token_a_mint_pub,
        token_b_mint_pub,
        token_a_reserve_pub: token_a_reserve_info.pubkey,
        token_b_reserve_pub: token_b_reserve_info.pubkey
    }
}

#[allow(dead_code)]
pub async fn create_ata_then_mint_to(
    banks_client: &mut BanksClient, 
    payer: &Keypair,
    token_mint: &AccountWithSeed,
    amount: u64
) -> AccountWithSeed {
    let token_ata = create_associated_token_address(
        banks_client, 
        &payer,
        payer.pubkey(),
        token_mint.pubkey
    ).await;

    mint_to(
        banks_client, 
        &payer,
        &token_mint.pubkey,
        &token_ata.pubkey,
        &payer,
        amount
    ).await;

    token_ata
}

#[allow(dead_code)]
pub async fn init_swap(
    banks_client: &mut BanksClient, 
    payer: &Keypair,
    swapping_rate_numerator: u64,
    swapping_rate_denominator: u64,
    swap_pubkey: Pubkey,
    swap_authority: Pubkey,
    token_a_mint_pub: Pubkey,
    token_a_reserve_pub: Pubkey,
    token_b_mint_pub: Pubkey,
    token_b_reserve_pub: Pubkey
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
                token_a_mint_pub,
                token_a_reserve_pub,
                token_b_mint_pub,
                token_b_reserve_pub
            )
        ],
        Some(&payer.pubkey()),
        &[payer],
        banks_client.get_latest_blockhash().await.unwrap()
    );
    transaction
}

#[allow(dead_code)]
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
    let _result = banks_client.process_transaction(transaction).await;

    AccountWithSeed {
        pubkey,
        authority
    }
}

#[allow(dead_code)]
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
            spl_token_instruction::initialize_mint(&spl_token::id(), &token_mint_info.pubkey, owner, None, decimals).unwrap(),
        ],
        Some(&payer.pubkey()),
        &[payer],
        banks_client.get_latest_blockhash().await.unwrap(),
    );
    let _result = banks_client.process_transaction(transaction).await;

    AccountWithSeed {
        pubkey: token_mint_info.pubkey,
        authority: token_mint_info.authority
    }
}

#[allow(dead_code)]
pub async fn create_associated_token_address(
    banks_client: &mut BanksClient,
    payer: &Keypair,
    owner: Pubkey,
    token_mint: Pubkey,
) -> AccountWithSeed {
    let associated_token_address =
        get_associated_token_address(&owner, &token_mint);

    // Associated account does not exist
    assert_eq!(
        banks_client
            .get_account(associated_token_address)
            .await
            .expect("get_account"),
        None,
    );

    let transaction = Transaction::new_signed_with_payer(
        &[create_associated_token_account(
            &payer.pubkey(),
            &owner,
            &token_mint,
            &spl_token::id(),
        )],
        Some(&payer.pubkey()),
        &[payer],
        banks_client.get_latest_blockhash().await.unwrap(),
    );
    banks_client.process_transaction(transaction).await.unwrap();

    AccountWithSeed {
        pubkey: associated_token_address,
        authority: owner
    }
}

#[allow(dead_code)]
pub async fn mint_to(
    banks_client: &mut BanksClient,
    payer: &Keypair,
    mint: &Pubkey,
    account: &Pubkey,
    mint_authority: &Keypair,
    amount: u64,
) {
    let transaction = Transaction::new_signed_with_payer(
        &[
            spl_token_instruction::mint_to(&spl_token::id(), mint, account, &mint_authority.pubkey(), &[], amount)
                .unwrap(),
        ],
        Some(&payer.pubkey()),
        &[payer, mint_authority],
        banks_client.get_latest_blockhash().await.unwrap(),
    );
    let _result = banks_client.process_transaction(transaction).await;
}

#[allow(dead_code)]
pub async fn spl_transfer(
    banks_client: &mut BanksClient,
    payer: &Keypair,
    source: &Pubkey,
    destination: &Pubkey,
    authority: &Keypair,
    amount: u64,
) {
    let transaction = Transaction::new_signed_with_payer(
        &[
            spl_token_instruction::transfer(&spl_token::id(), source, destination, &authority.pubkey(), &[], amount)
                .unwrap(),
        ],
        Some(&payer.pubkey()),
        &[payer, authority],
        banks_client.get_latest_blockhash().await.unwrap(),
    );
    let _result = banks_client.process_transaction(transaction).await;
}

#[allow(dead_code)]
pub async fn initialize_account(
    banks_client: &mut BanksClient,
    payer: &Keypair,
    account: &Pubkey,
    pool_mint: &Pubkey,
    owner: &Pubkey,
) {
    let transaction = Transaction::new_signed_with_payer(
        &[
            spl_token_instruction::initialize_account(&spl_token::id(), account, pool_mint, owner).unwrap(),
        ],
        Some(&payer.pubkey()),
        &[payer],
        banks_client.get_latest_blockhash().await.unwrap(),
    );
    let _result = banks_client.process_transaction(transaction).await;
}

#[allow(dead_code)]
pub async fn sync_native(
    banks_client: &mut BanksClient,
    payer: &Keypair,
    account: &Pubkey,
) {
    let transaction = Transaction::new_signed_with_payer(
        &[
            spl_token_instruction::sync_native(&spl_token::id(), account).unwrap(),
        ],
        Some(&payer.pubkey()),
        &[payer],
        banks_client.get_latest_blockhash().await.unwrap(),
    );
    let _result = banks_client.process_transaction(transaction).await;
}

#[allow(dead_code)]
pub async fn wrap_sol(
    banks_client: &mut BanksClient,
    owner: &Keypair,
    wallet: &Pubkey,
    lamports: u64
) -> AccountWithSeed {
    let associated_token_address =
        get_associated_token_address(&wallet, &spl_token::native_mint::ID);

    // Associated account does not exist
    assert_eq!(
        banks_client
            .get_account(associated_token_address)
            .await
            .expect("get_account"),
        None,
    );

    let ixs = &[
        create_associated_token_account(
            &owner.pubkey(),
            &owner.pubkey(),
            &spl_token::native_mint::ID,
            &spl_token::id(),
        ),
        system_instruction::transfer(
            &owner.pubkey(),
            &associated_token_address,
            lamports
        ),
        spl_token_instruction::sync_native(&spl_token::id(), &associated_token_address).unwrap()
    ];
    
    let transaction = Transaction::new_signed_with_payer(
        ixs,
        Some(&owner.pubkey()),
        &[owner],
        banks_client.get_latest_blockhash().await.unwrap(),
    );
    let _result = banks_client.process_transaction(transaction).await;

    AccountWithSeed {
        pubkey: associated_token_address,
        authority: owner.pubkey()
    }
}

#[allow(dead_code)]
pub async fn unwrap_sol(
    banks_client: &mut BanksClient,
    owner: &Keypair
) {
    let associated_token_address =
        get_associated_token_address(&owner.pubkey(), &spl_token::native_mint::ID);

    let transaction = Transaction::new_signed_with_payer(
        &[
            spl_token_instruction::close_account(
                &spl_token::id(),
                &associated_token_address,
                &owner.pubkey(),
                &owner.pubkey(),
                &[],
            ).unwrap()
        ],
        Some(&owner.pubkey()),
        &[owner],
        banks_client.get_latest_blockhash().await.unwrap(),
    );
    let _result = banks_client.process_transaction(transaction).await;
}


