import { AccountInfo, PublicKey } from '@solana/web3.js'
import { blob, struct, u8 } from 'buffer-layout'
import { Parser, publicKey, u64 } from '../util'

export interface Swap {
  version: number
  bumpSeed: number
  owner: PublicKey
  tokenProgramId: PublicKey
  tokenAMint: PublicKey
  tokenAReserve: PublicKey
  tokenBMint: PublicKey
  tokenBReserve: PublicKey
  rateNumberator: bigint
  rateDenominator: bigint
  tokenABalance: bigint
  tokenBBalance: bigint
}

export const SwapLayout = struct<Swap>(
  [
    u8('version'),
    u8('bumpSeed'),
    publicKey('owner'),
    publicKey('tokenProgramId'),
    publicKey('tokenAMint'),
    publicKey('tokenAReserve'),
    publicKey('tokenBMint'),
    publicKey('tokenBReserve'),
    u64('rateNumberator'),
    u64('rateDenominator'),
    u64('tokenABalance'),
    u64('tokenBBalance')
  ],
  'swap'
)

export const SWAP_SIZE = SwapLayout.span

export const isSwap = (info: AccountInfo<Buffer>): boolean => {
  return info.data.length === SWAP_SIZE
}

export const parseLendingMarket: Parser<Swap> = (pubkey: PublicKey, info: AccountInfo<Buffer>) => {
  if (!isSwap(info)) return

  const buffer = Buffer.from(info.data)
  const swap = SwapLayout.decode(buffer)

  if (!swap.version) return

  return {
    pubkey,
    info,
    data: swap
  }
}
