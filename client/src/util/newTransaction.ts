import { Connection, PublicKey, Transaction } from '@solana/web3.js'

export const newTransaction = async (
  connection: Connection,
  feePayer: PublicKey
): Promise<Transaction> => {
  const transaction = new Transaction()
  const { blockhash } = await connection.getRecentBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = feePayer

  return transaction
}
