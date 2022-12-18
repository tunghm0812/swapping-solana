// @flow

import { sendAndConfirmTransaction as realSendAndConfirmTransaction } from '@solana/web3.js'
import {
  SystemProgram,
  Connection,
  Signer,
  Transaction,
  TransactionSignature,
  Keypair,
  PublicKey
} from '@solana/web3.js'

export function sendAndConfirmTransaction(
  title: string,
  connection: Connection,
  transaction: Transaction,
  ...signers: Array<Signer>
): Promise<TransactionSignature> {
  return realSendAndConfirmTransaction(connection, transaction, signers, {
    skipPreflight: false
  })
}

export async function initDerivedAccountWithSeed(
  connection: Connection,
  payer: Keypair,
  programId: PublicKey,
  seed: string,
  accountSize: number
): Promise<PublicKey> {
  const derivedPublicKey = await PublicKey.createWithSeed(payer.publicKey, seed, programId)

  // Check if the derived account has already been created
  const derivedAccount = await connection.getAccountInfo(derivedPublicKey)
  if (derivedAccount !== null) {
    // console.log(`The account ${derivedPublicKey.toBase58()} was created before.`)
    return derivedPublicKey
  }
  const lamports = await connection.getMinimumBalanceForRentExemption(accountSize)

  const transaction = new Transaction().add(
    SystemProgram.createAccountWithSeed({
      fromPubkey: payer.publicKey,
      basePubkey: payer.publicKey,
      seed,
      newAccountPubkey: derivedPublicKey,
      lamports,
      space: accountSize,
      programId
    })
  )

  const tx = await realSendAndConfirmTransaction(connection, transaction, [payer])
  // console.log(`The account ${derivedPublicKey.toBase58()} was created successfully.`)
  return derivedPublicKey
}
