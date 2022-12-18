// const client = require('../dist/lending-token-client.umd')
// const { LendingProvider, DEV_NET_RPC } = require('../dist/lib/lending-token-client')
const client = require('../dist/swap-client.umd')
const provider = new client.Provider(client.TEST_NET_RPC)
// const BigNumber = require('bignumber.js')
var arguments = process.argv;
const tokenFrom = arguments[2]
const tokenTo = arguments[3]
const amount = parseInt(arguments[4])

const {
  PublicKey,
  Connection,
  Transaction,
  sendAndConfirmTransaction,
  sendRawTransaction,
  Keypair, SYSVAR_RENT_PUBKEY, TransactionInstruction
} = require('@solana/web3.js')

const { accounts } = require('./accounts')
const owner = Keypair.fromSecretKey(new Uint8Array(accounts[0]))
const solanaScanTxid = 'https://explorer.solana.com/tx/{txid}?cluster=testnet'
async function main() {
  await provider.connect()

  // Use to create MOVE token
  // const moveMint = await loadMoveToken()

  // swap init at txid: UTA2kddGTQr7NazL72XBxV5RwRFWC8Cxxf5N4jrRQnSNZEd3qhdwJPSpnpbVGikvvZDDEgD5dJy7U7x2hdJdZ9A
  const swap = await loadSwap()
  console.log("Swap program id:", client.TEST_NET_SWAP_PROGRAM_ID.toBase58())

  // use to mint MOVE tokens
  // await mintTo(swap.data.tokenAMint, owner, 100000000)

  /**
   * deposit txis success: 2rfXdPpq6h8BHffEiHTYkPjCUJrh9ptJatSr9kxyZJL1g1f2uz1ciU62AtnNko3KiyuK1HZurCPyzkB4nkT1tv1Y
   */
  // await deposit(swap, 10000000000, 1000000000)

  if ((tokenFrom === 'move' && tokenTo === 'sol') || (tokenFrom === 'sol' && tokenTo === 'move')) {
    console.log("================================================================")
    console.log("Swap Info:")
    console.log("+ MOVE balance:", swap.data.tokenABalance)
    console.log("+ SOL balance:", swap.data.tokenBBalance)
    console.log(`+ Price: ${swap.data.rateNumberator / swap.data.rateDenominator}  MOVE/SOL (same decimals)`)
    console.log("================================================================")

    let moveAccount0 = await client.getSPLTokenAccount(provider.connection, swap.data.tokenAMint, owner.publicKey)
    let solBalance0 = await provider.connection.getBalance(owner.publicKey);
    console.log("Your balance before swap:")
    console.log("+ MOVE balance:", moveAccount0.amount)
    console.log("+ SOL balance:", solBalance0)
    console.log("================================================================")
    
    console.log(`Swap ${amount} ${tokenFrom} to ${tokenTo}.`)

    const fromMint = (tokenFrom === 'move') ? swap.data.tokenAMint : swap.data.tokenBMint
    const toMint =  (tokenFrom === 'move') ? swap.data.tokenBMint : swap.data.tokenAMint
    await swapToken(swap, fromMint, toMint, amount)

    console.log("================================================================")

    const moveAccount1 = await client.getSPLTokenAccount(provider.connection, swap.data.tokenAMint, owner.publicKey)
    const solBalance1 = await provider.connection.getBalance(owner.publicKey);
    console.log("Your balance changed after swap (tx fee = 5000 lamports):")
    console.log("+ MOVE balance changed:", moveAccount1.amount - moveAccount0.amount)
    console.log("+ SOL balance changed:", solBalance1 - solBalance0)
  } else {
    console.log('input invalid')
  }
}

async function loadMoveToken() {
  const MOVE_SYMBOL = "MOVE"
  const decimals = 9
  const moveMint = await client.getOrCreateSPLMint(
    provider.connection,
    owner,
    MOVE_SYMBOL,
    decimals
  )
  return moveMint
}

async function loadSwap() {
  const swapSeed = 'MOVE_WSOL'
  const swapPDA = await client.initDerivedAccountWithSeed(
    provider.connection,
    owner,
    client.TEST_NET_SWAP_PROGRAM_ID,
    swapSeed,
    client.SWAP_SIZE
  )

  let swapAccount = await provider.connection.getAccountInfo(swapPDA)
  const swapData = client.parseLendingMarket(swapPDA, swapAccount)

  if (swapData && swapData.data && swapData.data.version !== 0) {
    const [authority] = await PublicKey.findProgramAddress([swapPDA.toBuffer()], client.TEST_NET_SWAP_PROGRAM_ID)
    swapData.authority = authority
    return swapData
  }

  const moveReserveSeed = 'MOVE_RESERVE'
  const moveReservePDA = await client.initDerivedAccountWithSeed(
    provider.connection,
    owner,
    client.TOKEN_PROGRAM_ID,
    moveReserveSeed,
    client.SPL_ACCOUNT_SIZE
  )

  const wsolReserveSeed = 'WSOL_RESERVE'
  const wsolReservePDA = await client.initDerivedAccountWithSeed(
    provider.connection,
    owner,
    client.TOKEN_PROGRAM_ID,
    wsolReserveSeed,
    client.SPL_ACCOUNT_SIZE
  )
  const [authority] = await PublicKey.findProgramAddress([swapPDA.toBuffer()], client.TEST_NET_SWAP_PROGRAM_ID)
  const moveMint = await loadMoveToken()
  const rateNumberator = BigInt(10)
  const rateDenominator = BigInt(1)

  const tx = await provider.createInitSwapTx(
    client.TEST_NET_SWAP_PROGRAM_ID,
    owner.publicKey,
    rateNumberator,
    rateDenominator,
    swapPDA,
    authority,
    moveMint,
    moveReservePDA,
    client.NATIVE_MINT,
    wsolReservePDA
  )
  const txid = await sendAndConfirmTransaction(
    provider.connection,
    tx,
    [owner],
    { commitment: 'confirmed' }
  )
  loadSwap()
}

async function swapToken(swap, fromMint, toMint, amount) {
  const tx = await provider.createSwapTx(
    client.TEST_NET_SWAP_PROGRAM_ID,
    owner.publicKey,
    swap.pubkey,
    swap.authority,
    swap.data,
    fromMint,
    toMint,
    amount
  )

  const txid = await sendAndConfirmTransaction(
    provider.connection,
    tx,
    [owner],
    { commitment: 'confirmed' }
  )
  console.log('Detail:', solanaScanTxid.replace('{txid}', txid))
}

async function deposit(swap, moveAmount, wsolAmount) {
  const tx = await provider.createDepositTx(
    client.TEST_NET_SWAP_PROGRAM_ID,
    owner.publicKey,
    swap.pubkey,
    swap.data,
    moveAmount,
    wsolAmount
  )

  const txid = await sendAndConfirmTransaction(
    provider.connection,
    tx,
    [owner],
    { commitment: 'confirmed' }
  )
  console.log(txid)
}

async function mintTo(mint, owner, amount) {
  const ata = await client.getOrCreateSPLTokenAccount(provider.connection, mint, owner)
  const instruction = await client.mintToInstruction(
    mint,
    ata,
    owner.publicKey,
    [],
    amount
  )
  const txid = await sendAndConfirmTransaction(
    provider.connection,
    new Transaction().add(instruction),
    [owner],
    { commitment: 'confirmed' }
  )
  console.log('mintTo txid', txid)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
});