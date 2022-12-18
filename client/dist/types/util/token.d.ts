import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { SPLAccount } from '../state';
export declare const getAssociatedTokenAddress: (programId: PublicKey, mint: PublicKey, owner: PublicKey, allowOwnerOffCurve?: boolean) => Promise<PublicKey>;
export declare const createSPLTokenAccount: (connection: Connection, mint: PublicKey, owner: Keypair) => Promise<PublicKey>;
export declare const getOrCreateSPLTokenAccount: (connection: Connection, mint: PublicKey, owner: Keypair) => Promise<PublicKey>;
export declare const getSPLTokenAccount: (connection: Connection, mint: PublicKey, owner: PublicKey) => Promise<SPLAccount | null>;
export declare const getOrCreateSPLMint: (connection: Connection, owner: Keypair, symbol: string, decimals: number) => Promise<PublicKey | null>;
