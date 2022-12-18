import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  sendAndConfirmTransaction
} from '@solana/web3.js'
import { MintInfo, parseMintInfo, parseSPLAccount, SPLAccount, MINT_INFO_SIZE } from '../state'
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '../constants'
import {
  initMintInstruction,
  initSPLTokenAccountInstruction,
  createAssociatedTokenAccountInstruction
} from '../instructions'

import { initDerivedAccountWithSeed } from './send-and-confirm-transaction'

export const getAssociatedTokenAddress = async (
  programId: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
  allowOwnerOffCurve: boolean = false
): Promise<PublicKey> => {
  if (!allowOwnerOffCurve && !PublicKey.isOnCurve(owner.toBuffer())) {
    throw new Error(`Owner cannot sign: ${owner.toString()}`)
  }

  const results = await PublicKey.findProgramAddress(
    [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  return results[0]
}

export const createSPLTokenAccount = async (
  connection: Connection,
  mint: PublicKey,
  owner: Keypair
): Promise<PublicKey> => {
  const associatedTokenAddress = await getAssociatedTokenAddress(
    TOKEN_PROGRAM_ID,
    mint,
    owner.publicKey
  )
  console.log('associatedTokenAddress', associatedTokenAddress.toBase58())

  const transaction = new Transaction()
  transaction.add(
    createAssociatedTokenAccountInstruction(
      TOKEN_PROGRAM_ID,
      mint,
      associatedTokenAddress,
      owner.publicKey,
      owner.publicKey
    )
  )

  const txid = await sendAndConfirmTransaction(connection, transaction, [owner])
  console.log('createSPLTokenAccount txid', txid)
  return associatedTokenAddress
}

export const getOrCreateSPLTokenAccount = async (
  connection: Connection,
  mint: PublicKey,
  owner: Keypair
): Promise<PublicKey> => {
  const associatedTokenAddress = await getAssociatedTokenAddress(
    TOKEN_PROGRAM_ID,
    mint,
    owner.publicKey
  )

  const account = await connection.getAccountInfo(associatedTokenAddress)
  if (account) {
    const result = parseSPLAccount(associatedTokenAddress, account)
    if (result && result.data && result.data.state !== 0) {
      return associatedTokenAddress
    }
  }

  return createSPLTokenAccount(connection, mint, owner)
}

export const getSPLTokenAccount = async (
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey
): Promise<SPLAccount | null> => {
  const associatedTokenAddress = await getAssociatedTokenAddress(TOKEN_PROGRAM_ID, mint, owner)

  const account = await connection.getAccountInfo(associatedTokenAddress)
  if (account) {
    const result = parseSPLAccount(associatedTokenAddress, account)
    if (result && result.data && result.data.state !== 0) {
      return result.data
    }
  }
  return null
}

export const getOrCreateSPLMint = async (
  connection: Connection,
  owner: Keypair,
  symbol: string,
  decimals: number
): Promise<PublicKey | null> => {
  const mintPubKey = await initDerivedAccountWithSeed(
    connection,
    owner,
    TOKEN_PROGRAM_ID,
    symbol,
    MINT_INFO_SIZE
  )

  const mintInfoAccount = await connection.getAccountInfo(mintPubKey)
  if (mintInfoAccount) {
    const mintInfoData = parseMintInfo(mintPubKey, mintInfoAccount)
    if (mintInfoData) {
      return mintPubKey
    }
  }

  const instruction = await initMintInstruction(
    mintPubKey,
    decimals,
    owner.publicKey,
    owner.publicKey
  )
  const txid = await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [owner],
    { commitment: 'confirmed' }
  )

  return mintPubKey
}
