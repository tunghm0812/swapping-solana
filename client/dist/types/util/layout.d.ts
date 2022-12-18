/// <reference types="node" />
import { AccountInfo, PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { Layout } from 'buffer-layout';
export declare type Parser<T> = (pubkey: PublicKey, info: AccountInfo<Buffer>) => {
    pubkey: PublicKey;
    info: AccountInfo<Buffer>;
    data: T;
} | undefined;
/** @internal */
export interface EncodeDecode<T> {
    decode: (buffer: Buffer, offset?: number) => T;
    encode: (src: T, buffer: Buffer, offset?: number) => number;
}
/** @internal */
export declare const encodeDecode: <T>(layout: Layout<T>) => EncodeDecode<T>;
/** @internal */
export declare const bool: (property?: string) => Layout<boolean>;
/** @internal */
export declare const publicKey: (property?: string) => Layout<PublicKey>;
/** @internal */
export declare const bigInt: (length: number) => (property?: string) => Layout<bigint>;
/** @internal */
export declare const u64: (property?: string) => Layout<bigint>;
/** @internal */
export declare const u128: (property?: string) => Layout<bigint>;
/** @internal */
export declare const u192: (property?: string) => Layout<bigint>;
/** @internal */
export declare const decimal: (property?: string, size?: 'u192' | 'u128') => Layout<BigNumber>;
/** @internal */
export declare const string: (length: number) => (property?: string) => Layout<string>;
export declare const string2: (property?: string) => Layout<string>;
export declare const optional: <T>(layout: Layout<T>, property?: string) => Layout<T | null>;
