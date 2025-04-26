import type {NamedTypeSpec, ScValue} from "@partisiablockchain/abi-client";
import type {ChainDefinition} from "./pbc.chains.js";
import type {AvlTreeReaderBuilder} from "./utils/avl-tree.utils.js";

export type PBCCallDelegate<R> = (state: Record<string, ScValue> | undefined, trees: Record<number, AvlTreeReaderBuilder>, namedTypes: Record<string, NamedTypeSpec>) => Promise<R>;
export type PBCMultiCallDelegate = (state: Record<string, ScValue> | undefined, trees: Record<number, AvlTreeReaderBuilder>, namedTypes: Record<string, NamedTypeSpec>) => Promise<void>;
export type PBCMultiCallDelegateWithTrees = [PBCMultiCallDelegate, number[]];

export function ToMultiCall<R>(call: PBCCallDelegate<R>, callback: (value: R) => Promise<any>): PBCMultiCallDelegate {
    return async (state: Record<string, ScValue> | undefined, trees: Record<number, AvlTreeReaderBuilder>, namedTypes: Record<string, NamedTypeSpec>) => {
        await call(state, trees, namedTypes)
            .then(value => callback(value));
    };
}

export interface PBCCallDefinition<R> {
    executeCall(chain: ChainDefinition, contractAddress: string): Promise<R>;
    buildMultiCall(callback: (value: R) => Promise<any>): PBCMultiCallDelegateWithTrees;
}

export interface PBCInstanceCallDefinition<R> {
    executeCall(): Promise<R>;
    buildMultiCall(callback: (value: R) => Promise<any>): PBCMultiCallDelegateWithTrees;
}
