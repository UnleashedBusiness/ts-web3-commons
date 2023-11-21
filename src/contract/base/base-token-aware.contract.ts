import BigNumber from 'bignumber.js';
import {
  BaseMultiChainContract,
} from './base-multi-chain.contract';
import { Erc20TokenContract } from '../erc20-token.contract';
import { BlockchainDefinition, DefaultEVMNativeTokenDecimals, EmptyAddress } from '../../utils/chains';
import { Web3BatchRequest } from 'web3-core';
import ContractToolkitService from '../utils/contract-toolkit.service';
import { AbiMethodFetchMethod, FunctionalAbiDefinition, NumericResult } from "../utils/contract.types";

export abstract class BaseTokenAwareContract<
  FunctionalAbi extends FunctionalAbiDefinition,
> extends BaseMultiChainContract<FunctionalAbi> {
  protected constructor(
    protected readonly token: Erc20TokenContract,
    toolkit: ContractToolkitService,
  ) {
    super(toolkit);
  }

  protected async tokenDivision(config: BlockchainDefinition, token: string): Promise<number> {
    return token === EmptyAddress
      ? DefaultEVMNativeTokenDecimals
      : 10 ** (await this.token.decimalsDirect(config, token));
  }

  protected async tokenToWeiConnected(
    config: BlockchainDefinition,
    token: string,
    tokens: BigNumber,
  ): Promise<BigNumber> {
    return tokens.multipliedBy(await this.tokenDivision(config, token)).decimalPlaces(0, 3);
  }

  protected async getViewWithDivision(
    config: BlockchainDefinition,
    contractAddress: string,
    fetchMethod: AbiMethodFetchMethod<FunctionalAbi>,
    divisionToken: string,
    batch?: Web3BatchRequest,
    callback?: (result: BigNumber) => void,
  ): Promise<BigNumber | void> {
    const division = await this.tokenDivision(config, divisionToken);

    if (typeof callback !== 'undefined') {
      await this.getViewMulti(config, contractAddress, fetchMethod, batch, async (result: NumericResult) => {
        const resultConverted = this.wrap(result).dividedBy(division);
        callback(resultConverted);
      });
    } else {
      const amount = (await this.getViewMulti(config, contractAddress, fetchMethod)) as NumericResult;

      return this.wrap(amount).dividedBy(division);
    }
  }
}
