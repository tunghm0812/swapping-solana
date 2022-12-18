import { Connection, PublicKey, Transaction, Commitment } from '@solana/web3.js';
import * as states from './state';
export interface ConfigAccounts {
    swapProgramID: PublicKey;
}
export declare class Provider {
    network: string;
    commitment: Commitment;
    connection: Connection;
    swapProgramID: PublicKey;
    constructor(network: string, commitment?: Commitment);
    connect(): Promise<Connection>;
    createInitSwapTx(programId: PublicKey, owner: PublicKey, rateNumberator: bigint, rateDenominator: bigint, swapPub: PublicKey, swapAuthority: PublicKey, tokenAMint: PublicKey, tokenAReserve: PublicKey, tokenBMint: PublicKey, tokenBReserve: PublicKey): Promise<Transaction>;
    createDepositTx(programId: PublicKey, owner: PublicKey, swapPubkey: PublicKey, swapInfo: states.Swap, moveAmount: number, wsolAmount: number): Promise<Transaction>;
    createSwapTx(programId: PublicKey, owner: PublicKey, swapPubkey: PublicKey, swapAuthority: PublicKey, swapInfo: states.Swap, fromMint: PublicKey, toMint: PublicKey, amount: number): Promise<Transaction>;
    newTransaction(feePayer: PublicKey): Promise<Transaction>;
}
