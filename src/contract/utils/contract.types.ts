import { AbiFunctionFragment } from 'web3';
import BigNumber from 'bignumber.js';

export type FunctionalAbiDefinition = { [key: string]: AbiFunctionFragment };

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
