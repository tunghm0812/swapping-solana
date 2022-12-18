import { AccountInfo, PublicKey } from '@solana/web3.js'
import BigNumber from 'bignumber.js'
import { blob, Layout, u8 } from 'buffer-layout'
import { toBigIntLE, toBufferLE } from 'bigint-buffer'
import { WAD } from '../constants'

export type Parser<T> = (
  pubkey: PublicKey,
  info: AccountInfo<Buffer>
) =>
  | {
      pubkey: PublicKey
      info: AccountInfo<Buffer>
      data: T
    }
  | undefined

/** @internal */
export interface EncodeDecode<T> {
  decode: (buffer: Buffer, offset?: number) => T
  encode: (src: T, buffer: Buffer, offset?: number) => number
}

/** @internal */
export const encodeDecode = <T>(layout: Layout<T>): EncodeDecode<T> => {
  const decode = layout.decode.bind(layout)
  const encode = layout.encode.bind(layout)
  return { decode, encode }
}

/** @internal */
export const bool = (property = 'bool'): Layout<boolean> => {
  const layout = u8(property)
  const { encode, decode } = encodeDecode(layout)

  const boolLayout = (layout as Layout<unknown>) as Layout<boolean>

  boolLayout.decode = (buffer: Buffer, offset: number) => {
    const src = decode(buffer, offset)
    return !!src
  }

  boolLayout.encode = (bool: boolean, buffer: Buffer, offset: number) => {
    const src = Number(bool)
    return encode(src, buffer, offset)
  }

  return boolLayout
}

/** @internal */
export const publicKey = (property = 'publicKey'): Layout<PublicKey> => {
  const layout = blob(32, property)
  const { encode, decode } = encodeDecode(layout)

  const publicKeyLayout = (layout as Layout<unknown>) as Layout<PublicKey>

  publicKeyLayout.decode = (buffer: Buffer, offset: number) => {
    const src = decode(buffer, offset)
    return new PublicKey(src)
  }

  publicKeyLayout.encode = (publicKey: PublicKey, buffer: Buffer, offset: number) => {
    const src = publicKey.toBuffer()
    return encode(src, buffer, offset)
  }

  return publicKeyLayout
}

/** @internal */
export const bigInt = (length: number) => (property = 'bigInt'): Layout<bigint> => {
  const layout = blob(length, property)
  const { encode, decode } = encodeDecode(layout)

  const bigIntLayout = (layout as Layout<unknown>) as Layout<bigint>

  bigIntLayout.decode = (buffer: Buffer, offset: number) => {
    const src = decode(buffer, offset)
    return toBigIntLE(src)
  }

  bigIntLayout.encode = (bigInt: bigint, buffer: Buffer, offset: number) => {
    const src = toBufferLE(bigInt, length)
    return encode(src, buffer, offset)
  }

  return bigIntLayout
}

/** @internal */
export const u64 = bigInt(8)

/** @internal */
export const u128 = bigInt(16)

/** @internal */
export const u192 = bigInt(24)

/** @internal */
export const decimal = (
  property = 'decimal',
  size: 'u192' | 'u128' = 'u192'
): Layout<BigNumber> => {
  const layout = size === 'u192' ? u192(property) : u128(property)
  const { encode, decode } = encodeDecode(layout)

  const decimalLayout = (layout as Layout<unknown>) as Layout<BigNumber>

  decimalLayout.decode = (buffer: Buffer, offset: number) => {
    const src = decode(buffer, offset).toString()
    return new BigNumber(src).div(WAD)
  }

  decimalLayout.encode = (decimal: BigNumber, buffer: Buffer, offset: number) => {
    const src = BigInt(
      decimal
        .times(WAD)
        .integerValue()
        .toString()
    )
    return encode(src, buffer, offset)
  }

  return decimalLayout
}

/** @internal */
export const string = (length: number) => (property = 'string'): Layout<string> => {
  const layout = blob(length, property)
  const { encode, decode } = encodeDecode(layout)

  const stringLayout = (layout as Layout<unknown>) as Layout<string>

  stringLayout.decode = (buffer: Buffer, offset: number) => {
    const src = decode(buffer, offset)
    return src.toString('utf-8')
  }

  stringLayout.encode = (string: string, buffer: Buffer, offset: number) => {
    const src = Buffer.from(string, 'utf-8')
    return encode(src, buffer, offset)
  }

  return stringLayout
}

export const string2 = (property = 'string'): Layout<string> => {
  const layout = blob(4, property)
  const { encode, decode } = encodeDecode(layout)

  const stringLayout = (layout as Layout<unknown>) as Layout<string>

  stringLayout.decode = (buffer: Buffer, offset: number) => {
    const length = buffer.readUInt32LE(offset)
    const src = buffer.slice(offset + 4, offset + 4 + length)
    return src.toString('utf-8')
  }

  stringLayout.encode = (string: string, buffer: Buffer, offset: number) => {
    const data = Buffer.from(string, 'utf-8')
    const length = Buffer.alloc(4)
    length.writeUInt32LE(data.byteLength, 0)
    const src = Buffer.concat([length, data])
    return encode(src, buffer, offset)
  }

  stringLayout.getSpan = (buffer: Buffer, offset: number) => {
    const length = buffer.readUInt32LE(offset)
    return 4 + length
  }

  return stringLayout
}

export const optional = <T>(layout: Layout<T>, property = 'optional'): Layout<T | null> => {
  const _layout = blob(layout.span + 1, property)
  const { encode, decode } = encodeDecode(_layout)
  const optionalLayout = (_layout as Layout<unknown>) as Layout<T | null>

  optionalLayout.decode = (buffer: Buffer, offset: number) => {
    const isOptional = buffer.readUInt8(offset)
    if (isOptional) {
      return layout.decode(buffer, offset + 1)
    }
    return null
  }

  optionalLayout.encode = (value: T | null, buffer: Buffer, offset: number) => {
    let src = Buffer.alloc(1)
    if (value) {
      const data = Buffer.alloc(layout.span + 1)
      data.writeUInt8(1, 0)
      return layout.encode(value, data, 1)
    }
    return encode(src, buffer, offset)
  }

  optionalLayout.getSpan = (buffer: Buffer, offset: number) => {
    const isOptional = buffer.readUInt8(offset)
    if (isOptional) {
      return layout.span + 1
    }
    return 1
  }

  return optionalLayout
}
