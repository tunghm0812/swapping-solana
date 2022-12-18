import { AccountInfo, PublicKey } from '@solana/web3.js'
import { blob, struct, u8, u32 } from 'buffer-layout'
import { Parser, publicKey, bool, u64 } from '../util'

enum States {
  'Uninitialized',
  'Initialized',
  'Frozen'
}

export interface MintInfo {
  mintAuthorityOption: number
  mintAuthority: null | PublicKey
  supply: bigint
  decimals: number
  isInitialized: boolean
  freezeAuthorityOption: number
  freezeAuthority: null | PublicKey
}

export const MintInfoLayout = struct<MintInfo>(
  [
    u32('mintAuthorityOption'),
    publicKey('mintAuthority'),
    u64('supply'),
    u8('decimals'),
    u8('isInitialized'),
    u32('freezeAuthorityOption'),
    publicKey('freezeAuthority')
  ],
  'mintInfo'
)

export const MINT_INFO_SIZE = MintInfoLayout.span

export const isMintInfo = (info: AccountInfo<Buffer>): boolean => {
  return info.data.length === MINT_INFO_SIZE
}

export const parseMintInfo: Parser<MintInfo> = (pubkey: PublicKey, info: AccountInfo<Buffer>) => {
  if (!isMintInfo(info)) return

  const buffer = Buffer.from(info.data)
  const mintInfo = MintInfoLayout.decode(buffer)

  if (!mintInfo.isInitialized) return

  return {
    pubkey,
    info,
    data: mintInfo
  }
}

export interface SPLAccount {
  pubkey: PublicKey
  mint: PublicKey
  owner: PublicKey
  amount: bigint
  delegateOption: number
  delegate: null | PublicKey
  state: States
  isNativeOption: number
  isNative: null | boolean
  delegatedAmount: bigint
  closeAuthorityOption: number
  closeAuthority: null | PublicKey
}

export const SPLAccountLayout = struct<SPLAccount>(
  [
    publicKey('mint'),
    publicKey('owner'),
    u64('amount'),
    u32('delegateOption'),
    publicKey('delegate'),
    u8('state'),
    u32('isNativeOption'),
    u64('isNative'),
    u64('delegatedAmount'),
    u32('closeAuthorityOption'),
    publicKey('closeAuthority')
  ],
  'SPLAccount'
)

export const SPL_ACCOUNT_SIZE = SPLAccountLayout.span

export const isSPLAccount = (info: AccountInfo<Buffer>): boolean => {
  return info.data.length === SPL_ACCOUNT_SIZE
}

export const parseSPLAccount: Parser<SPLAccount> = (
  pubkey: PublicKey,
  info: AccountInfo<Buffer>
) => {
  if (!isSPLAccount(info)) return

  const buffer = Buffer.from(info.data)
  const SPLAccount = SPLAccountLayout.decode(buffer)
  SPLAccount.pubkey = pubkey

  if (SPLAccount.state === States.Uninitialized) return

  return {
    pubkey,
    info,
    data: SPLAccount
  }
}
