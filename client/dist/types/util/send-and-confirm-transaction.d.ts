import { Connection, Signer, Transaction, TransactionSignature, Keypair, PublicKey } from '@solana/web3.js';
export declare function sendAndConfirmTransaction(title: string, connection: Connection, transaction: Transaction, ...signers: Array<Signer>): Promise<TransactionSignature>;
export declare function initDerivedAccountWithSeed(connection: Connection, payer: Keypair, programId: PublicKey, seed: string, accountSize: number): Promise<PublicKey>;
