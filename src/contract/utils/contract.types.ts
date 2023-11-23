import { AbiFunctionFragment, AbiParameter, MatchPrimitiveType } from 'web3';
import BigNumber from 'bignumber.js';
import { BlockchainDefinition } from "../../utils/chains";
import { MethodRunnable } from "../base/base-multi-chain.contract";
import { Web3BatchRequest } from "web3-core";

export type FunctionalAbiDefinition = {
  [key: string]: AbiFunctionFragment & { argumentSignature: { [name: string]: string }, returnSignature: { [name: string]: string } };
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

export type CallbackDef<T> = (result: T) => void | undefined

export type FunctionalAbiViews<FunctionalAbi extends FunctionalAbiDefinition> = {
  [K in keyof FunctionalAbi as FunctionalAbi[K] extends { stateMutability: 'view' } ? K : never]: (
    config: BlockchainDefinition,
    contractAddress: string,
    args: {[key in keyof FunctionalAbi[K]['argumentSignature']]: MatchPrimitiveType<FunctionalAbi[K]['argumentSignature'][key], unknown>},
    batch?: Web3BatchRequest,
    callback?: (result: MatchPrimitiveType<FunctionalAbi[K]['returnSignature'][0], unknown>) => void
  ) => Promise<MatchPrimitiveType<FunctionalAbi[K]['returnSignature'][0], unknown> | void>;
}

export type FunctionalAbiMethods<FunctionalAbi extends FunctionalAbiDefinition> = {
  [K in keyof FunctionalAbi as FunctionalAbi[K] extends { stateMutability: 'view' } ? never : K]: (
  contractAddress: string,
  args: {[key in keyof FunctionalAbi[K]['argumentSignature']]: MatchPrimitiveType<FunctionalAbi[K]['argumentSignature'][key], unknown>},
  validation?: () => Promise<void>,
  getValue?: () => Promise<BigNumber>,
  getGas?: () => Promise<BigNumber>,
) => MethodRunnable;
}