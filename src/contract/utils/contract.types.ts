import {type AbiFunctionFragment} from 'web3';
import {BigNumber} from 'bignumber.js';
import {BlockchainDefinition} from '../../utils/chains.js';
import {MethodRunnable} from '../web3-contract.js';
import type {BatchRequest} from "./batch-request.js";

export type AbiDefinition = AbiFunctionFragment[];

export type ArgumentSignature = { [name: string]: any | ArgumentSignature };

export type FunctionalAbiDefinition = {
    [key: string]: {
        name: string,
        stateMutability: string,
        argumentSignature: ArgumentSignature;
        returnSignature: ArgumentSignature;
    };
};

export type FunctionalAbiMethodDefinition = {
    args: any[];
    definition: AbiFunctionFragment;
};

export type FunctionalAbiExecutableFun = (...args: any[]) => FunctionalAbiMethodDefinition;

export type FunctionalAbiExecutable<T extends FunctionalAbiDefinition> = {
    methods: { [key in keyof T]: FunctionalAbiExecutableFun };
};

export type NumericResult = bigint | number | string | BigNumber;

export type AbiMethodFetchMethod<FunctionalAbi extends FunctionalAbiDefinition> = (
    abi: FunctionalAbiExecutable<FunctionalAbi>,
) => FunctionalAbiMethodDefinition;

export type AbiPropertyFetchMethod<FunctionalAbi extends FunctionalAbiDefinition> =
    | AbiMethodFetchMethod<FunctionalAbi>
    | string;

export type FunctionalAbiViews<FunctionalAbi extends FunctionalAbiDefinition> = {
    [K in keyof FunctionalAbi as FunctionalAbi[K] extends {
        stateMutability: 'view';
    } | { stateMutability: 'pure' }
        ? K
        : never]: <R extends FunctionalAbiMethodReturnType>(
        config: BlockchainDefinition,
        contractAddress: string,
        args: {
            [key in keyof FunctionalAbi[K]['argumentSignature']]: FunctionalAbi[K]['argumentSignature'][key];
        },
        batch?: BatchRequest,
        callback?: (response: R) => Promise<any> | any,
        onError?: (reason: any) => Promise<void> | void,
    ) => Promise<R | void>;
};

export type FunctionalAbiInstanceViews<FunctionalAbi extends FunctionalAbiDefinition> = {
    [K in keyof FunctionalAbi as FunctionalAbi[K] extends | {
        stateMutability: 'view';
    }
        | { stateMutability: 'pure' }
        ? K
        : never]: <R extends FunctionalAbiMethodReturnType>(
        args: {
            [key in keyof FunctionalAbi[K]['argumentSignature']]: FunctionalAbi[K]['argumentSignature'][key];
        },
        batch?: BatchRequest,
        callback?: (response: R) => Promise<any> | any,
        onError?: (reason: any) => Promise<void> | void,
    ) => Promise<R | void>;
};

export type FunctionalAbiMethods<FunctionalAbi extends FunctionalAbiDefinition> = {
    [K in keyof FunctionalAbi as FunctionalAbi[K] extends { stateMutability: 'view' } | { stateMutability: 'pure' }
        ? never
        : K]: (
        contractAddress: string,
        args: {
            [key in keyof FunctionalAbi[K]['argumentSignature']]: FunctionalAbi[K]['argumentSignature'][key];
        },
        validation?: () => Promise<void>,
        getValue?: () => Promise<BigNumber>,
        getGas?: () => Promise<BigNumber>,
    ) => MethodRunnable;
};

export type FunctionalAbiMethodReturnType = string | boolean | NumericResult | Record<string, any>;
