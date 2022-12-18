/// <reference path="../../../types/buffer-layout.d.ts" />
/// <reference types="node" />
import { AccountInfo, PublicKey } from '@solana/web3.js';
import { Parser } from '../util';
export interface Swap {
    version: number;
    bumpSeed: number;
    owner: PublicKey;
    tokenProgramId: PublicKey;
    tokenAMint: PublicKey;
    tokenAReserve: PublicKey;
    tokenBMint: PublicKey;
    tokenBReserve: PublicKey;
    rateNumberator: bigint;
    rateDenominator: bigint;
    tokenABalance: bigint;
    tokenBBalance: bigint;
}
export declare const SwapLayout: import("buffer-layout").Layout<Swap>;
export declare const SWAP_SIZE: number;
export declare const isSwap: (info: AccountInfo<Buffer>) => boolean;
export declare const parseLendingMarket: Parser<Swap>;
