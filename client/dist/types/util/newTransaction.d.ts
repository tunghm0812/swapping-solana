import { Connection, PublicKey, Transaction } from '@solana/web3.js';
export declare const newTransaction: (connection: Connection, feePayer: PublicKey) => Promise<Transaction>;
