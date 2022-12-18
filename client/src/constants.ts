import { PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'

export const WAD = new BigNumber('1e+18')
export const SUPPLY_FRACTION_BASE = 10000000000
export const U64_MAX = BigInt('18446744073709551615')
export const DEFAULT_TICKS_PER_SECOND = 160
export const DEFAULT_TICKS_PER_SLOT = 64
export const SECONDS_PER_DAY = 24 * 60 * 60
export const SLOTS_PER_YEAR =
  (DEFAULT_TICKS_PER_SECOND * SECONDS_PER_DAY * 365) / DEFAULT_TICKS_PER_SLOT

export const TEST_NET_RPC = 'https://api.testnet.solana.com'
export const TEST_NET_SWAP_PROGRAM_ID = new PublicKey(
  'FtemqETZDWoEH7NM94HX8BYDEQmBcvJkKrRYZYXxQhhi'
)

export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
)
export const BPF_LOADER_UPGRADEABLE_ID = new PublicKey(
  'BPFLoaderUpgradeab1e11111111111111111111111'
)
export const NATIVE_MINT = new PublicKey('So11111111111111111111111111111111111111112')
