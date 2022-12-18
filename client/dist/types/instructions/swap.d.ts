/// <reference path="../../../types/buffer-layout.d.ts" />
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
interface InitSwapData {
    instruction: number;
    owner: PublicKey;
    rateNumberator: bigint;
    rateDenominator: bigint;
}
interface DepositData {
    instruction: number;
    moveAmount: bigint;
    wsolAmount: bigint;
}
interface SwapData {
    instruction: number;
    amount: bigint;
}
export declare const InitSwapDataLayout: import("buffer-layout").Layout<InitSwapData>;
export declare const initSwapInstruction: (programId: PublicKey, owner: PublicKey, rateNumberator: bigint, rateDenominator: bigint, swapPub: PublicKey, swapAuthority: PublicKey, tokenAMint: PublicKey, tokenAReserve: PublicKey, tokenBMint: PublicKey, tokenBReserve: PublicKey) => TransactionInstruction;
export declare const DepositDataLayout: import("buffer-layout").Layout<DepositData>;
export declare const depositInstruction: (programId: PublicKey, owner: PublicKey, moveAmount: bigint, wsolAmount: bigint, swapPub: PublicKey, moveOwnerATA: PublicKey, moveReservePDA: PublicKey, wsolOwnerATA: PublicKey, wsolReservePDA: PublicKey) => TransactionInstruction;
export declare const SwapDataLayout: import("buffer-layout").Layout<SwapData>;
export declare const swapInstruction: (programId: PublicKey, owner: PublicKey, amount: bigint, swapPub: PublicKey, swapAuthority: PublicKey, srcFromOwnerATA: PublicKey, dstFromReservePDA: PublicKey, srcToReservePDA: PublicKey, dstToOwnerATA: PublicKey) => TransactionInstruction;
export {};
