/// <reference path="../../../types/buffer-layout.d.ts" />
/// <reference types="node" />
import { AccountInfo, PublicKey } from '@solana/web3.js';
import { Parser } from '../util';
declare enum States {
    'Uninitialized' = 0,
    'Initialized' = 1,
    'Frozen' = 2
}
export interface MintInfo {
    mintAuthorityOption: number;
    mintAuthority: null | PublicKey;
    supply: bigint;
    decimals: number;
    isInitialized: boolean;
    freezeAuthorityOption: number;
    freezeAuthority: null | PublicKey;
}
export declare const MintInfoLayout: import("buffer-layout").Layout<MintInfo>;
export declare const MINT_INFO_SIZE: number;
export declare const isMintInfo: (info: AccountInfo<Buffer>) => boolean;
export declare const parseMintInfo: Parser<MintInfo>;
export interface SPLAccount {
    pubkey: PublicKey;
    mint: PublicKey;
    owner: PublicKey;
    amount: bigint;
    delegateOption: number;
    delegate: null | PublicKey;
    state: States;
    isNativeOption: number;
    isNative: null | boolean;
    delegatedAmount: bigint;
    closeAuthorityOption: number;
    closeAuthority: null | PublicKey;
}
export declare const SPLAccountLayout: import("buffer-layout").Layout<SPLAccount>;
export declare const SPL_ACCOUNT_SIZE: number;
export declare const isSPLAccount: (info: AccountInfo<Buffer>) => boolean;
export declare const parseSPLAccount: Parser<SPLAccount>;
export {};
