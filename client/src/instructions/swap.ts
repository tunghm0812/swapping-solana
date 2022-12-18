import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  Signer,
  SystemProgram
} from '@solana/web3.js'
import { blob, struct, u8 } from 'buffer-layout'
import { publicKey, u64 } from '../util'
import { SwapInstruction } from './instruction'

interface InitSwapData {
  instruction: number
  owner: PublicKey
  rateNumberator: bigint
  rateDenominator: bigint
}

interface DepositData {
  instruction: number
  moveAmount: bigint
  wsolAmount: bigint
}

interface SwapData {
  instruction: number
  amount: bigint
}

export const InitSwapDataLayout = struct<InitSwapData>([
  u8('instruction'),
  publicKey('owner'),
  u64('rateNumberator'),
  u64('rateDenominator')
])

export const initSwapInstruction = (
  programId: PublicKey,
  owner: PublicKey,
  rateNumberator: bigint,
  rateDenominator: bigint,
  swapPub: PublicKey,
  swapAuthority: PublicKey,
  tokenAMint: PublicKey,
  tokenAReserve: PublicKey,
  tokenBMint: PublicKey,
  tokenBReserve: PublicKey
): TransactionInstruction => {
  const data = Buffer.alloc(InitSwapDataLayout.span)
  InitSwapDataLayout.encode(
    {
      instruction: SwapInstruction.InitSwap,
      owner,
      rateNumberator,
      rateDenominator
    },
    data
  )
  ///   0. `[writable]` Swap account - uninitialized.
  ///   1. `[]` Rent sysvar.
  ///   2. `[]` Token program id.
  ///   3. `[]` Derived swap authority.

  ///   4. `[]` token a mint.
  ///   5. `[writable]` token a reserve.
  ///   6. `[]` token b mint.
  ///   7. `[writable]` token b reserve.
  let keys = [
    { pubkey: swapPub, isSigner: false, isWritable: true },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: swapAuthority, isSigner: false, isWritable: false },
    { pubkey: tokenAMint, isSigner: false, isWritable: false },
    { pubkey: tokenAReserve, isSigner: false, isWritable: true },
    { pubkey: tokenBMint, isSigner: false, isWritable: false },
    { pubkey: tokenBReserve, isSigner: false, isWritable: true }
  ]

  return new TransactionInstruction({
    keys,
    programId,
    data
  })
}

export const DepositDataLayout = struct<DepositData>([
  u8('instruction'),
  u64('moveAmount'),
  u64('wsolAmount')
])

export const depositInstruction = (
  programId: PublicKey,
  owner: PublicKey,
  moveAmount: bigint,
  wsolAmount: bigint,
  swapPub: PublicKey,
  moveOwnerATA: PublicKey,
  moveReservePDA: PublicKey,
  wsolOwnerATA: PublicKey,
  wsolReservePDA: PublicKey
): TransactionInstruction => {
  const data = Buffer.alloc(DepositDataLayout.span)
  DepositDataLayout.encode(
    {
      instruction: SwapInstruction.Deposit,
      moveAmount,
      wsolAmount
    },
    data
  )
  ///   0. `[writable]` swap account.
  ///   1. `[]` Token program id.
  ///   2. `[signer]` User transfer authority.
  ///   3. `[writable]` src token a account (user_account).
  ///   4. `[writable]` dest token a reserve.
  ///   5. `[writable]` src token b account (user_account).
  ///   6. `[writable]` dest token b reserve.
  let keys = [
    { pubkey: swapPub, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: owner, isSigner: true, isWritable: false },
    { pubkey: moveOwnerATA, isSigner: false, isWritable: true },
    { pubkey: moveReservePDA, isSigner: false, isWritable: true },
    { pubkey: wsolOwnerATA, isSigner: false, isWritable: true },
    { pubkey: wsolReservePDA, isSigner: false, isWritable: true }
  ]

  return new TransactionInstruction({
    keys,
    programId,
    data
  })
}

export const SwapDataLayout = struct<SwapData>([u8('instruction'), u64('amount')])

export const swapInstruction = (
  programId: PublicKey,
  owner: PublicKey,
  amount: bigint,
  swapPub: PublicKey,
  swapAuthority: PublicKey,

  srcFromOwnerATA: PublicKey,
  dstFromReservePDA: PublicKey,
  srcToReservePDA: PublicKey,
  dstToOwnerATA: PublicKey
): TransactionInstruction => {
  const data = Buffer.alloc(SwapDataLayout.span)
  SwapDataLayout.encode(
    {
      instruction: SwapInstruction.Swap,
      amount
    },
    data
  )
  ///   0. `[writable]` swap account.
  ///   1. `[]` Token program id.
  ///   2. `[signer]` User transfer authority.
  ///   3. `[]` Swap authority.
  ///   4. `[writable]` src token `from` account (user_account).
  ///   5. `[writable]` dest token `from` reserve.
  ///   6. `[writable]` src token `to` reserve.
  ///   7. `[writable]` dest token `to` account (user_account).
  let keys = [
    { pubkey: swapPub, isSigner: false, isWritable: true },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: owner, isSigner: true, isWritable: false },
    { pubkey: swapAuthority, isSigner: false, isWritable: false },
    { pubkey: srcFromOwnerATA, isSigner: false, isWritable: true },
    { pubkey: dstFromReservePDA, isSigner: false, isWritable: true },
    { pubkey: srcToReservePDA, isSigner: false, isWritable: true },
    { pubkey: dstToOwnerATA, isSigner: false, isWritable: true }
  ]

  return new TransactionInstruction({
    keys,
    programId,
    data
  })
}
