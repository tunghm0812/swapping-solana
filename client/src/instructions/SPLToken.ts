import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  AccountMeta,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  Signer,
  SystemProgram
} from '@solana/web3.js'
import { blob, struct, u8 } from 'buffer-layout'
import { publicKey, u64 } from '../util'
import { TokenInstruction } from './instruction'

interface InitMintData {
  instruction: number
  decimals: number
  mintAuthority: PublicKey
  option: number
  freezeAuthority: PublicKey | null
}

const InitMintDataLayout = struct<InitMintData>([
  u8('instruction'),
  u8('decimals'),
  publicKey('mintAuthority'),
  u8('option'),
  publicKey('freezeAuthority')
])

/**
 * Construct an InitializeMint instruction
 *
 * @param programId SPL Token program account
 * @param mint Token mint account
 * @param decimals Number of decimals in token account amounts
 * @param mintAuthority Minting authority
 * @param freezeAuthority Optional authority that can freeze token accounts
 */
export const initMintInstruction = (
  mint: PublicKey,
  decimals: number,
  mintAuthority: PublicKey,
  freezeAuthority: PublicKey | null
): TransactionInstruction => {
  const data = Buffer.alloc(InitMintDataLayout.span)
  InitMintDataLayout.encode(
    {
      instruction: TokenInstruction.InitMint,
      decimals,
      mintAuthority,
      option: freezeAuthority === null ? 0 : 1,
      freezeAuthority
    },
    data
  )

  let keys = [
    { pubkey: mint, isSigner: false, isWritable: true },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
  ]

  return new TransactionInstruction({
    keys,
    programId: TOKEN_PROGRAM_ID,
    data
  })
}

interface InitSPLTokenAccountData {
  instruction: number
}

const InitSPLTokenAccountDataLayout = struct<InitSPLTokenAccountData>([u8('instruction')])

export const initSPLTokenAccountInstruction = (
  mint: PublicKey,
  account: PublicKey,
  owner: PublicKey
): TransactionInstruction => {
  const data = Buffer.alloc(InitSPLTokenAccountDataLayout.span)
  InitSPLTokenAccountDataLayout.encode(
    {
      instruction: TokenInstruction.InitializeAccount
    },
    data
  )

  const keys = [
    { pubkey: account, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: owner, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
  ]

  return new TransactionInstruction({
    keys,
    programId: TOKEN_PROGRAM_ID,
    data
  })
}

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
export const createAssociatedTokenAccountInstruction = (
  programId: PublicKey,
  mint: PublicKey,
  associatedAccount: PublicKey,
  owner: PublicKey,
  payer: PublicKey
): TransactionInstruction => {
  const data = Buffer.alloc(0)

  let keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedAccount, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: false, isWritable: false },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
  ]

  return new TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data
  })
}

interface MintToData {
  instruction: number
  amount: bigint
}

const MintToDataLayout = struct<MintToData>([u8('instruction'), u64('amount')])

/**
 * Construct a MintTo instruction
 *
 * @param mint Public key of the mint
 * @param dest Public key of the account to mint to
 * @param authority The mint authority
 * @param multiSigners Signing accounts if `authority` is a multiSig
 * @param amount Amount to mint
 */
export const mintToInstruction = (
  mint: PublicKey,
  dest: PublicKey,
  authority: PublicKey,
  multiSigners: Array<Signer>,
  amount: number
): TransactionInstruction => {
  const data = Buffer.alloc(MintToDataLayout.span)
  MintToDataLayout.encode(
    {
      instruction: TokenInstruction.MintTo,
      amount: BigInt(amount)
    },
    data
  )

  let keys = [
    { pubkey: mint, isSigner: false, isWritable: true },
    { pubkey: dest, isSigner: false, isWritable: true }
  ]
  if (multiSigners.length === 0) {
    keys.push({
      pubkey: authority,
      isSigner: true,
      isWritable: false
    })
  } else {
    keys.push({ pubkey: authority, isSigner: false, isWritable: false })
    multiSigners.forEach(signer =>
      keys.push({
        pubkey: signer.publicKey,
        isSigner: true,
        isWritable: false
      })
    )
  }

  return new TransactionInstruction({
    keys,
    programId: TOKEN_PROGRAM_ID,
    data
  })
}

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
export const transferInstruction = (
  source: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  multiSigners: Array<Signer>,
  amount: number
): TransactionInstruction => {
  const dataLayout = struct([u8('instruction'), u64('amount')])

  const data = Buffer.alloc(dataLayout.span)
  dataLayout.encode(
    {
      instruction: TokenInstruction.Transfer, // Transfer instruction
      amount: BigInt(amount)
    },
    data
  )

  let keys = [
    { pubkey: source, isSigner: false, isWritable: true },
    { pubkey: destination, isSigner: false, isWritable: true }
  ]

  if (multiSigners.length === 0) {
    keys.push({
      pubkey: owner,
      isSigner: true,
      isWritable: false
    })
  } else {
    keys.push({ pubkey: owner, isSigner: false, isWritable: false })
    multiSigners.forEach(signer =>
      keys.push({
        pubkey: signer.publicKey,
        isSigner: true,
        isWritable: false
      })
    )
  }
  return new TransactionInstruction({
    keys,
    programId: TOKEN_PROGRAM_ID,
    data
  })
}

export interface SyncNativeInstructionData {
  instruction: TokenInstruction.SyncNative
}

export const syncNativeInstructionData = struct<SyncNativeInstructionData>([u8('instruction')])
/**
 * Construct a SyncNative instruction
 *
 * @param account   Native account to sync lamports from
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createSyncNativeInstruction(
  account: PublicKey,
  programId = TOKEN_PROGRAM_ID
): TransactionInstruction {
  const keys = [{ pubkey: account, isSigner: false, isWritable: true }]

  const data = Buffer.alloc(syncNativeInstructionData.span)
  syncNativeInstructionData.encode({ instruction: TokenInstruction.SyncNative }, data)

  return new TransactionInstruction({ keys, programId, data })
}

export interface CloseAccountInstructionData {
  instruction: TokenInstruction.CloseAccount
}

export const closeAccountInstructionData = struct<CloseAccountInstructionData>([u8('instruction')])

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
export function createCloseAccountInstruction(
  account: PublicKey,
  destination: PublicKey,
  authority: PublicKey,
  multiSigners: Signer[] = [],
  programId = TOKEN_PROGRAM_ID
): TransactionInstruction {
  const keys = addSigners(
    [
      { pubkey: account, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true }
    ],
    authority,
    multiSigners
  )

  const data = Buffer.alloc(closeAccountInstructionData.span)
  closeAccountInstructionData.encode({ instruction: TokenInstruction.CloseAccount }, data)

  return new TransactionInstruction({ keys, programId, data })
}

export function addSigners(
  keys: AccountMeta[],
  ownerOrAuthority: PublicKey,
  multiSigners: Signer[]
): AccountMeta[] {
  if (multiSigners.length) {
    keys.push({ pubkey: ownerOrAuthority, isSigner: false, isWritable: false })
    for (const signer of multiSigners) {
      keys.push({ pubkey: signer.publicKey, isSigner: true, isWritable: false })
    }
  } else {
    keys.push({ pubkey: ownerOrAuthority, isSigner: true, isWritable: false })
  }
  return keys
}
