import {BN} from "@partisiablockchain/abi-client";

interface SignOptions {
    pers?: any;
    persEnc?: string | undefined;
    canonical?: boolean | undefined;
    k?: BN | undefined;
}

export interface KeyPairSigner {
    sign(msg: Buffer): Signature;
    sign(msg: BNInput, enc: string, options?: SignOptions): Signature;
    getPublic(): BasePoint;
    getPublic(compact: boolean, enc: "array"): number[];
    derive(pub: BasePoint): BN;
}

export interface Signature {
    r: BN;
    s: BN;
    recoveryParam: number | null;

    toDER(): number[];
    toDER(enc: "hex"): string;
}

export interface PrecomputedValues {
    doubles: any; // ?
    naf: any; // ?
    beta: any; // ?
}

export interface base {
    p: BN;
    type: string;
    red: any; // ?
    zero: BN;
    one: BN;
    two: BN;
    n: BN;
    g: BasePoint;
    redN: BN;

    validate(point: BasePoint): boolean;
    decodePoint(bytes: Buffer | string, enc?: "hex"): BasePoint;
}

export interface BasePoint {
    curve: base;
    type: string;
    precomputed: PrecomputedValues | null;

    encode(enc: "hex", compact: boolean): string;
    encode(enc: "array" | undefined, compact: boolean): number[];
    encodeCompressed(enc: "hex"): string;
    encodeCompressed(enc?: "array"): number[];
    validate(): boolean;
    precompute(power: number): BasePoint;
    dblp(k: number): BasePoint;
    inspect(): string;
    isInfinity(): boolean;
    add(p: BasePoint): BasePoint;
    mul(k: BN): BasePoint;
    dbl(): BasePoint;
    getX(): BN;
    getY(): BN;
    eq(p: BasePoint): boolean;
    neg(): BasePoint;
}

export interface Elliptic {
    genKeyPair(): KeyPairSigner;
    keyFromPublic(
        pub: Uint8Array | Buffer | string | number[] | { x: string; y: string },
        enc?: string,
    ): KeyPairSigner;
    keyFromPrivate(
        priv: Uint8Array | Buffer | string | number[],
        enc?: string,
    ): KeyPairSigner;
}


export type BNInput = string | BN | number | Buffer | Uint8Array | readonly number[];
