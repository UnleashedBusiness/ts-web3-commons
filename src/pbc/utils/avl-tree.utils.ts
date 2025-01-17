import type {NamedTypeSpec, TypeSpec} from "@partisiablockchain/abi-client/target/main/types/Abi.js";
import {ScValue} from "@partisiablockchain/abi-client";

export interface AvlItemReader {
    getKey<K>(): K;
    getValue<V>(): V;
}

export type AvlTreeBuilder = (keySpec: TypeSpec, valueType: TypeSpec | NamedTypeSpec, isNamedValue: boolean) => {key: ScValue, value: ScValue}[];
export type AvlTreeBuilderMap = Record<number, AvlTreeBuilder>;