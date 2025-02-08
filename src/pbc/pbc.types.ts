import type {ScValue} from "@partisiablockchain/abi-client";
import type {AvlTreeBuilderMap} from "./utils/avl-tree.utils.js";
import {NamedTypeSpec} from "@partisiablockchain/abi-client/target/main/types/Abi.js";
import type {ChainDefinition} from "./pbc.chains.js";

export type PBCCallDelegate<R> = (state: Record<string, ScValue>, trees: AvlTreeBuilderMap, namedTypes: Record<string, NamedTypeSpec>) => Promise<R>;
export type PBCMultiCallDelegate = (state: Record<string, ScValue>, trees: AvlTreeBuilderMap, namedTypes: Record<string, NamedTypeSpec>) => Promise<void>;

export function ToMultiCall(call: PBCCallDelegate<any>): PBCMultiCallDelegate {
    return async (state: Record<string, ScValue>, trees: AvlTreeBuilderMap, namedTypes: Record<string, NamedTypeSpec>) => {
        await call(state, trees, namedTypes);
    };
}

export interface PBCCallDefinition<R> {
    executeCall(chain: ChainDefinition, contractAddress: string): Promise<R>;
    buildMultiCall(): PBCMultiCallDelegate;
}

export interface PBCInstanceCallDefinition<R> {
    executeCall(): Promise<R>;
    buildMultiCall(): PBCMultiCallDelegate;
}
