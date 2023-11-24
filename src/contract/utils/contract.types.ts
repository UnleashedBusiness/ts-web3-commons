import { AbiFunctionFragment, AbiParameter, MatchPrimitiveType } from 'web3';
import BigNumber from 'bignumber.js';
import { BlockchainDefinition } from '../../utils/chains';
import { MethodRunnable } from '../web3-contract';
import { Web3BatchRequest } from 'web3-core';

export type AbiDefinition = AbiFunctionFragment[];

export type FunctionalAbiDefinition = {
  [key: string]: AbiFunctionFragment & {
    argumentSignature: { [name: string]: string };
    returnSignature: { [name: string]: string };
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
) => Promise<FunctionalAbiMethodDefinition> | FunctionalAbiMethodDefinition;

export type AbiPropertyFetchMethod<FunctionalAbi extends FunctionalAbiDefinition> =
  | AbiMethodFetchMethod<FunctionalAbi>
  | string;

export type FunctionalAbiViews<FunctionalAbi extends FunctionalAbiDefinition> = {
  [K in keyof FunctionalAbi as FunctionalAbi[K] extends {
    stateMutability: 'view';
  }
    ? K
    : never]: <R extends FunctionalAbiMethodReturnType>(
    config: BlockchainDefinition,
    contractAddress: string,
    args: {
      [key in keyof FunctionalAbi[K]['argumentSignature']]: MatchPrimitiveType<
        FunctionalAbi[K]['argumentSignature'][key],
        unknown
      >;
    },
    batch?: Web3BatchRequest,
  ) => Promise<R>;
};

export type FunctionalAbiInstanceViews<FunctionalAbi extends FunctionalAbiDefinition> = {
  [K in keyof FunctionalAbi as FunctionalAbi[K] extends {
    stateMutability: 'view';
  }
    ? K
    : never]: <R extends FunctionalAbiMethodReturnType>(
    args: {
      [key in keyof FunctionalAbi[K]['argumentSignature']]: MatchPrimitiveType<
        FunctionalAbi[K]['argumentSignature'][key],
        unknown
      >;
    },
    batch?: Web3BatchRequest,
  ) => Promise<R>;
};

export type FunctionalAbiMethods<FunctionalAbi extends FunctionalAbiDefinition> = {
  [K in keyof FunctionalAbi as FunctionalAbi[K] extends { stateMutability: 'view' } ? never : K]: (
    contractAddress: string,
    args: {
      [key in keyof FunctionalAbi[K]['argumentSignature']]: MatchPrimitiveType<
        FunctionalAbi[K]['argumentSignature'][key],
        unknown
      >;
    },
    validation?: () => Promise<void>,
    getValue?: () => Promise<BigNumber>,
    getGas?: () => Promise<BigNumber>,
  ) => MethodRunnable;
};

export type FunctionalAbiMethodReturnType = string | boolean | NumericResult | Record<string, any>;
