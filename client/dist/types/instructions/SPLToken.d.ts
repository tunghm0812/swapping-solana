/// <reference path="../../../types/buffer-layout.d.ts" />
import { AccountMeta, PublicKey, TransactionInstruction, Signer } from '@solana/web3.js';
import { TokenInstruction } from './instruction';
/**
 * Construct an InitializeMint instruction
 *
 * @param programId SPL Token program account
 * @param mint Token mint account
 * @param decimals Number of decimals in token account amounts
 * @param mintAuthority Minting authority
 * @param freezeAuthority Optional authority that can freeze token accounts
 */
export declare const initMintInstruction: (mint: PublicKey, decimals: number, mintAuthority: PublicKey, freezeAuthority: PublicKey | null) => TransactionInstruction;
export declare const initSPLTokenAccountInstruction: (mint: PublicKey, account: PublicKey, owner: PublicKey) => TransactionInstruction;
/**
 * Construct the AssociatedTokenProgram instruction to create the associated
 * token account
 *
 * @param associatedProgramId SPL Associated Token program account
 * @param programId SPL Token program account
 * @param mint Token mint account
 * @param associatedAccount New associated account
 * @param owner Owner of the new account
 * @param payer Payer of fees
 */
export declare const createAssociatedTokenAccountInstruction: (programId: PublicKey, mint: PublicKey, associatedAccount: PublicKey, owner: PublicKey, payer: PublicKey) => TransactionInstruction;
/**
 * Construct a MintTo instruction
 *
 * @param mint Public key of the mint
 * @param dest Public key of the account to mint to
 * @param authority The mint authority
 * @param multiSigners Signing accounts if `authority` is a multiSig
 * @param amount Amount to mint
 */
export declare const mintToInstruction: (mint: PublicKey, dest: PublicKey, authority: PublicKey, multiSigners: Array<Signer>, amount: number) => TransactionInstruction;
/**
 * Construct a Transfer instruction
 *
 * @param programId SPL Token program account
 * @param source Source account
 * @param destination Destination account
 * @param owner Owner of the source account
 * @param multiSigners Signing accounts if `authority` is a multiSig
 * @param amount Number of tokens to transfer
 */
export declare const transferInstruction: (source: PublicKey, destination: PublicKey, owner: PublicKey, multiSigners: Array<Signer>, amount: number) => TransactionInstruction;
export interface SyncNativeInstructionData {
    instruction: TokenInstruction.SyncNative;
}
export declare const syncNativeInstructionData: import("buffer-layout").Layout<SyncNativeInstructionData>;
/**
 * Construct a SyncNative instruction
 *
 * @param account   Native account to sync lamports from
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createSyncNativeInstruction(account: PublicKey, programId?: PublicKey): TransactionInstruction;
export interface CloseAccountInstructionData {
    instruction: TokenInstruction.CloseAccount;
}
export declare const closeAccountInstructionData: import("buffer-layout").Layout<CloseAccountInstructionData>;
/**
 * Construct a CloseAccount instruction
 *
 * @param account      Account to close
 * @param destination  Account to receive the remaining balance of the closed account
 * @param authority    Account close authority
 * @param multiSigners Signing accounts if `authority` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export declare function createCloseAccountInstruction(account: PublicKey, destination: PublicKey, authority: PublicKey, multiSigners?: Signer[], programId?: PublicKey): TransactionInstruction;
export declare function addSigners(keys: AccountMeta[], ownerOrAuthority: PublicKey, multiSigners: Signer[]): AccountMeta[];
