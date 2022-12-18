import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction,
  Commitment,
  AccountInfo
} from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import * as instructions from './instructions'
import * as states from './state'
import * as token from './util/token'
import * as constants from './constants'

export interface ConfigAccounts {
  swapProgramID: PublicKey
}

export class Provider {
  network: string
  commitment: Commitment
  connection!: Connection
  swapProgramID!: PublicKey

  constructor(network: string, commitment: Commitment = 'confirmed') {
    this.network = network
    this.commitment = commitment
    // this.swapProgramID = accounts.swapProgramID
  }

  async connect(): Promise<Connection> {
    const connection = new Connection(this.network, this.commitment)
    const version = await connection.getVersion()
    this.connection = connection
    console.log('Connection to:', this.network)
    return connection
  }

  async createInitSwapTx(
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
  ): Promise<Transaction> {
    const transaction = await this.newTransaction(owner)

    transaction.add(
      instructions.initSwapInstruction(
        programId,
        owner,
        rateNumberator,
        rateDenominator,
        swapPub,
        swapAuthority,
        tokenAMint,
        tokenAReserve,
        tokenBMint,
        tokenBReserve
      )
    )
    return transaction
  }

  async createDepositTx(
    programId: PublicKey,
    owner: PublicKey,
    swapPubkey: PublicKey,
    swapInfo: states.Swap,
    moveAmount: number,
    wsolAmount: number
  ): Promise<Transaction> {
    if (!swapInfo || !swapInfo.version) {
      throw new Error('swap not found')
    }

    const transaction = await this.newTransaction(owner)
    const moveOwnerATA = await token.getSPLTokenAccount(this.connection, swapInfo.tokenAMint, owner)

    if (!moveOwnerATA) {
      throw new Error('MOVE owner ATA not found')
    }

    let wsolOwnerATA = await token.getSPLTokenAccount(this.connection, constants.NATIVE_MINT, owner)
    const wsolOwnerATAPub = await token.getAssociatedTokenAddress(
      constants.TOKEN_PROGRAM_ID,
      constants.NATIVE_MINT,
      owner
    )
    if (!wsolOwnerATA) {
      transaction.add(
        instructions.createAssociatedTokenAccountInstruction(
          constants.TOKEN_PROGRAM_ID,
          constants.NATIVE_MINT,
          wsolOwnerATAPub,
          owner,
          owner
        )
      )
    }
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: owner,
        toPubkey: wsolOwnerATAPub,
        lamports: wsolAmount
      })
    )
    transaction.add(instructions.createSyncNativeInstruction(wsolOwnerATAPub))
    transaction.add(
      instructions.depositInstruction(
        programId,
        owner,
        BigInt(moveAmount),
        BigInt(wsolAmount),
        swapPubkey,
        moveOwnerATA.pubkey,
        swapInfo.tokenAReserve,
        wsolOwnerATAPub,
        swapInfo.tokenBReserve
      )
    )

    return transaction
  }

  async createSwapTx(
    programId: PublicKey,
    owner: PublicKey,
    swapPubkey: PublicKey,
    swapAuthority: PublicKey,
    swapInfo: states.Swap,
    fromMint: PublicKey,
    toMint: PublicKey,
    amount: number
  ): Promise<Transaction> {
    if (!swapInfo || !swapInfo.version) {
      throw new Error('swap not found')
    }

    const transaction = await this.newTransaction(owner)

    if (fromMint != swapInfo.tokenAMint && fromMint != swapInfo.tokenBMint) {
      throw new Error('fromMint is invalid')
    }
    if (toMint != swapInfo.tokenAMint && toMint != swapInfo.tokenBMint) {
      throw new Error('toMint is invalid')
    }

    const moveOwnerATA = await token.getSPLTokenAccount(this.connection, swapInfo.tokenAMint, owner)
    const moveOwnerATAPub = await token.getAssociatedTokenAddress(
      constants.TOKEN_PROGRAM_ID,
      swapInfo.tokenAMint,
      owner
    )

    if (!moveOwnerATA) {
      transaction.add(
        instructions.createAssociatedTokenAccountInstruction(
          constants.TOKEN_PROGRAM_ID,
          swapInfo.tokenAMint,
          moveOwnerATAPub,
          owner,
          owner
        )
      )
    }

    let wsolOwnerATA = await token.getSPLTokenAccount(this.connection, constants.NATIVE_MINT, owner)
    const wsolOwnerATAPub = await token.getAssociatedTokenAddress(
      constants.TOKEN_PROGRAM_ID,
      constants.NATIVE_MINT,
      owner
    )
    if (!wsolOwnerATA) {
      transaction.add(
        instructions.createAssociatedTokenAccountInstruction(
          constants.TOKEN_PROGRAM_ID,
          constants.NATIVE_MINT,
          wsolOwnerATAPub,
          owner,
          owner
        )
      )
    }

    if (fromMint.toBase58() === constants.NATIVE_MINT.toBase58()) {
      // WSOL to token
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: owner,
          toPubkey: wsolOwnerATAPub,
          lamports: amount
        })
      )
      transaction.add(instructions.createSyncNativeInstruction(wsolOwnerATAPub))
    }
    const srcFromOwnerATA =
      fromMint.toBase58() === constants.NATIVE_MINT.toBase58() ? wsolOwnerATAPub : moveOwnerATAPub
    const dstFromReservePDA =
      fromMint.toBase58() === constants.NATIVE_MINT.toBase58()
        ? swapInfo.tokenBReserve
        : swapInfo.tokenAReserve
    const srcToReservePDA =
      fromMint.toBase58() === constants.NATIVE_MINT.toBase58()
        ? swapInfo.tokenAReserve
        : swapInfo.tokenBReserve
    const dstToOwnerATA =
      fromMint.toBase58() === constants.NATIVE_MINT.toBase58() ? moveOwnerATAPub : wsolOwnerATAPub
    transaction.add(
      instructions.swapInstruction(
        programId,
        owner,
        BigInt(amount),
        swapPubkey,
        swapAuthority,
        srcFromOwnerATA,
        dstFromReservePDA,
        srcToReservePDA,
        dstToOwnerATA
      )
    )

    transaction.add(instructions.createCloseAccountInstruction(wsolOwnerATAPub, owner, owner))

    return transaction
  }

  async newTransaction(feePayer: PublicKey): Promise<Transaction> {
    const transaction = new Transaction()
    const { blockhash } = await this.connection.getRecentBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = feePayer

    return transaction
  }
}
