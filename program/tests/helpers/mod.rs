use solana_program::{program_pack::Pack, pubkey::Pubkey};
use solana_program_test::*;
use solana_sdk::{
    instruction::Instruction,
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
use spl_associated_token_account::{
    get_associated_token_address, instruction::create_associated_token_account,
};

pub const NATIVE_RENT_EXEMPT: u64 = 2_040_000;

pub struct AccountWithSeed {
    pub pubkey: Pubkey,
    pub authority: Pubkey
}

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

pub async fn create_associated_token_address(
    banks_client: &mut BanksClient,
    payer: &Keypair,
    owner: Pubkey,
    token_mint: Pubkey,
) -> AccountWithSeed {
    let associated_token_address =
        get_associated_token_address(&owner, &token_mint);

    let rent = banks_client.get_rent().await.unwrap();
    let expected_token_account_len = Token::LEN;
    let expected_token_account_balance = rent.minimum_balance(expected_token_account_len);

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
            instruction::mint_to(&spl_token::id(), mint, account, &mint_authority.pubkey(), &[], amount)
                .unwrap(),
        ],
        Some(&payer.pubkey()),
        &[payer, mint_authority],
        banks_client.get_latest_blockhash().await.unwrap(),
    );
    banks_client.process_transaction(transaction).await;
}

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
            instruction::transfer(&spl_token::id(), source, destination, &authority.pubkey(), &[], amount)
                .unwrap(),
        ],
        Some(&payer.pubkey()),
        &[payer, authority],
        banks_client.get_latest_blockhash().await.unwrap(),
    );
    banks_client.process_transaction(transaction).await;
}

pub async fn initialize_account(
    banks_client: &mut BanksClient,
    payer: &Keypair,
    account: &Pubkey,
    pool_mint: &Pubkey,
    owner: &Pubkey,
) {
    let transaction = Transaction::new_signed_with_payer(
        &[
            instruction::initialize_account(&spl_token::id(), account, pool_mint, owner).unwrap(),
        ],
        Some(&payer.pubkey()),
        &[payer],
        banks_client.get_latest_blockhash().await.unwrap(),
    );
    banks_client.process_transaction(transaction).await;
}

pub async fn sync_native(
    banks_client: &mut BanksClient,
    payer: &Keypair,
    account: &Pubkey,
) {
    let transaction = Transaction::new_signed_with_payer(
        &[
            instruction::sync_native(&spl_token::id(), account).unwrap(),
        ],
        Some(&payer.pubkey()),
        &[payer],
        banks_client.get_latest_blockhash().await.unwrap(),
    );
    banks_client.process_transaction(transaction).await;
}

// pub fn all_instructions_wrap_sol(
//     &self,
//     wallet_address: &Pubkey,
//     ui_amount: f64,
// ) -> Result<Vec<Instruction>, FarmClientError> {
//     let target_account = self.get_associated_token_address(wallet_address, "SOL")?;
//     let mut inst = vec![];
//     if !self.has_active_token_account(wallet_address, "SOL") {
//         inst.push(self.new_instruction_create_token_account(wallet_address, "SOL")?);
//     } else {
//         self.check_ata_owner(wallet_address, "SOL")?;
//     }
//     inst.push(self.new_instruction_transfer(wallet_address, &target_account, ui_amount)?);
//     Ok(inst)
// }

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
        instruction::sync_native(&spl_token::id(), &associated_token_address).unwrap()
    ];
    
    let transaction = Transaction::new_signed_with_payer(
        ixs,
        Some(&owner.pubkey()),
        &[owner],
        banks_client.get_latest_blockhash().await.unwrap(),
    );
    banks_client.process_transaction(transaction).await;

    AccountWithSeed {
        pubkey: associated_token_address,
        authority: owner.pubkey()
    }
}



