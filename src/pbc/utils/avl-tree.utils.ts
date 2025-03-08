import type {TypeSpec} from "@partisiablockchain/abi-client/target/main/types/Abi.js";
import type {StructTypeSpec} from "@partisiablockchain/abi-client/target/main/types/StructTypeSpec.js";
import type {Buffer} from "buffer";
import type {ScValue} from "@partisiablockchain/abi-client";

export interface AvlItemReader {
    getKey<K>(): K;
    getValue<V>(): V;
}

export type AvlTreeBuilder = <R>(valueType: TypeSpec | StructTypeSpec, isNamedValue: boolean, view: (value: ScValue) => R) => {
    getByKey(key: Buffer): Promise<R>;
};
export type AvlTreeBuilderMap = Record<number, AvlTreeBuilder>;