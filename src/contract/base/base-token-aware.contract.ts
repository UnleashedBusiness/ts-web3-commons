import BigNumber from 'bignumber.js';
import {
  BaseMultiChainContract,
  FunctionalAbiExecutable,
  FunctionalAbiMethodDefinition, NumericResult
} from "./base-multi-chain.contract";
import { Erc20TokenContract } from '../erc20-token.contract';
import { TransactionRunningHelperService } from '../../utils/transaction-running-helper.service';
import { BlockchainDefinition, DefaultEVMNativeTokenDecimals, EmptyAddress } from "../../utils/chains";
import { Web3BatchRequest } from 'web3-core';
import { ReadOnlyWeb3Connection } from '../../connection/interface/read-only-web3-connection';
import { AbiFunctionFragment } from 'web3/lib/types';

export abstract class BaseTokenAwareContract<
  FunctionalAbi extends {
    [key: string]: AbiFunctionFragment;
  },
> extends BaseMultiChainContract<FunctionalAbi> {
  protected constructor(
    protected readonly token: Erc20TokenContract,
    web3Connection: ReadOnlyWeb3Connection,
    transactionHelper: TransactionRunningHelperService,
  ) {
    super(web3Connection, transactionHelper);
  }

  protected async tokenDivision(config: BlockchainDefinition, token: string): Promise<number> {
    return token === EmptyAddress
      ? DefaultEVMNativeTokenDecimals
      : 10 ** await this.token.decimalsDirect(config, token);
  }

  protected async tokenToWeiConnected(config: BlockchainDefinition, token: string, tokens: BigNumber): Promise<BigNumber> {
    return tokens.multipliedBy(await this.tokenDivision(config, token)).decimalPlaces(0, 3);
  }

  protected async getViewWithDivision(
    config: BlockchainDefinition,
    contractAddress: string,
    fetchMethod:
      | ((abi: FunctionalAbiExecutable<FunctionalAbi>) => Promise<FunctionalAbiMethodDefinition>)
      | ((abi: FunctionalAbiExecutable<FunctionalAbi>) => FunctionalAbiMethodDefinition),
    divisionToken: string,
    batch?: Web3BatchRequest,
    callback?: (result: BigNumber) => void,
  ): Promise<BigNumber | void> {
    const division = await this.tokenDivision(config, divisionToken);

    if (typeof callback !== "undefined") {
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
