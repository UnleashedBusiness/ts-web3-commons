import BigNumber from 'bignumber.js';
import { BaseMultiChainContract } from './base-multi-chain.contract';
import { Erc20TokenContract } from '../erc20-token.contract';
import { TransactionRunningHelperService } from '../../utils/transaction-running-helper.service';
import { BlockchainDefinition, EmptyAddress } from '../../utils/chains';
import { Web3BatchRequest } from 'web3-core';
import { ReadOnlyWeb3Connection } from '../../connection/interface/read-only-web3-connection';
import { ContractAbi } from 'web3';
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
    return token === EmptyAddress ? 10 ** 18 : 10 ** ((await this.token.decimals(config, token)) as number);
  }

  protected async tokenDivisionConnected(token: string): Promise<number> {
    return token === EmptyAddress
      ? 10 ** 18
      : 10 ** ((await this.token.decimals(this.walletConnection.blockchain, token)) as number);
  }

  protected async tokenToWeiConnected(token: string, tokens: BigNumber): Promise<BigNumber> {
    return tokens.multipliedBy(await this.tokenDivisionConnected(token)).decimalPlaces(0, 3);
  }

  protected async getViewWithDivision(
    config: BlockchainDefinition,
    contractAddress: string,
    fetchMethod: (contract: any) => any,
    divisionToken: string,
    batch?: Web3BatchRequest,
    callback?: (result: BigNumber) => void,
  ): Promise<BigNumber | void> {
    const division = await this.tokenDivision(config, divisionToken);
    const localResult = await this.getViewMulti<number>(
      config,
      contractAddress,
      fetchMethod,
      batch,
      (result: number) => {
        if (callback) callback(this.wrap(result).dividedBy(division));
      },
    );
    if (callback) return;
    else return this.wrap(localResult as number).dividedBy(division);
  }
}
