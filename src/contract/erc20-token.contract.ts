import {
  BaseMultiChainContract,
  FunctionalAbiExecutable,
  FunctionalAbiMethodDefinition,
  MethodRunnable,
  NumericResult,
} from './base/base-multi-chain.contract';
import BigNumber from 'bignumber.js';
import { Erc20Abi, Erc20AbiFunctional } from '../abi/erc20.abi';
import { TransactionRunningHelperService } from '../utils/transaction-running-helper.service';
import { BlockchainDefinition } from '../utils/chains';
import { Web3BatchRequest } from 'web3-core';
import { ReadOnlyWeb3Connection } from '../connection/interface/read-only-web3-connection';

type TokenContractDecimalsCacheIndex = { [contractAddress: string]: number };
type NetworkTokensContractDecimalsCacheIndex = { [networkId: number]: TokenContractDecimalsCacheIndex };

export class Erc20TokenContract<
  FunctionalAbi extends Erc20AbiFunctional = Erc20AbiFunctional,
> extends BaseMultiChainContract<FunctionalAbi> {
  private decimalsCache: NetworkTokensContractDecimalsCacheIndex = {};

  constructor(web3Connection: ReadOnlyWeb3Connection, transactionHelper: TransactionRunningHelperService) {
    super(web3Connection, transactionHelper);
  }

  protected getAbi(): any {
    return Erc20Abi;
  }

  //CUSTOM
  public async decimals(
    config: BlockchainDefinition,
    address: string,
    batch?: Web3BatchRequest,
    callback?: (result: number) => void,
  ): Promise<void | number> {
    if (this.decimalsCache[config.networkId] === undefined) {
      this.decimalsCache[config.networkId] = {};
    }

    if (this.decimalsCache[config.networkId][address] === undefined) {
      this.decimalsCache[config.networkId][address] = (await this.getPropertyMulti(config, address, (abi) =>
        abi.methods.decimals(),
      )) as number;
    }

    if (callback) {
      callback(this.decimalsCache[config.networkId][address]);
      return;
    } else return this.decimalsCache[config.networkId][address];
  }

  public async decimalsDirect(config: BlockchainDefinition, address: string): Promise<number> {
    return (await this.decimals(config, address)) as number;
  }

  public async symbol(
    config: BlockchainDefinition,
    address: string,
    batch?: any,
    callback?: (result: string) => void,
  ): Promise<void | string> {
    return this.getPropertyMulti(config, address, (properties) => properties.methods.symbol(), batch, callback);
  }

  public async name(
    config: BlockchainDefinition,
    address: string,
    batch?: any,
    callback?: (result: string) => void,
  ): Promise<void | string> {
    return this.getPropertyMulti(config, address, (abi) => abi.methods.name(), batch, callback);
  }

  public async balanceOf(
    config: BlockchainDefinition,
    contractAddr: string,
    address: string,
    batch?: any,
    callback?: (balance: BigNumber) => void,
  ): Promise<BigNumber | void> {
    return this.getConvertableTokenView(
      config,
      contractAddr,
      async (contract) => contract.methods.balanceOf(address),
      batch,
      callback,
    );
  }

  public totalSupply(
    config: BlockchainDefinition,
    contractAddr: string,
    batch?: any,
    callback?: (supply: BigNumber) => void,
  ) {
    return this.getConvertableTokenView(
      config,
      contractAddr,
      async (contract) => contract.methods.totalSupply(),
      batch,
      callback,
    );
  }

  public async allowanceForSpender(
    config: BlockchainDefinition,
    wallet: string,
    contractAddr: string,
    spender: string,
    batch?: any,
    callback?: (supply: BigNumber) => void,
  ) {
    return this.getConvertableTokenView(
      config,
      contractAddr,
      async (contract) => contract.methods.allowance(wallet, spender),
      batch,
      callback,
    );
  }

  //METHODS
  public async approveTransfer(contractAddr: string, from: string, amount: BigNumber): Promise<MethodRunnable> {
    const division = 10 ** (await this.decimalsDirect(this.walletConnection.blockchain, contractAddr));
    const amountWei = amount.multipliedBy(division);

    return this.buildMethodRunnableMulti(
      contractAddr,
      async (contract, _) => contract.methods.approve(from, amountWei.toString()),
      undefined,
      undefined,
      async () => new BigNumber(100000),
    );
  }

  public async transfer(contractAddr: string, to: string, amount: BigNumber): Promise<MethodRunnable> {
    const division = 10 ** (await this.decimalsDirect(this.walletConnection.blockchain, contractAddr));
    const amountWei = amount.multipliedBy(division);
    return this.buildMethodRunnableMulti(contractAddr, async (contract, _) =>
      contract.methods.transfer(to, amountWei.toString()),
    );
  }

  protected override async initForConnectedMulti(address: string): Promise<void> {
    await super.initForConnectedMulti(address);
    await this.decimals(this.walletConnection.blockchain, address);
  }

  protected override async initMultiChainContractReadonly(
    config: BlockchainDefinition,
    address: string,
  ): Promise<void> {
    await super.initMultiChainContractReadonly(config, address);
    await this.decimals(config, address);
  }

  protected async getConvertableTokenView(
    config: BlockchainDefinition,
    contractAddress: string,
    fetchMethod:
      | ((abi: FunctionalAbiExecutable<FunctionalAbi>) => Promise<FunctionalAbiMethodDefinition>)
      | ((abi: FunctionalAbiExecutable<FunctionalAbi>) => FunctionalAbiMethodDefinition),
    batch?: Web3BatchRequest,
    callback?: (result: BigNumber) => void,
  ): Promise<BigNumber | void> {
    if (typeof callback !== 'undefined') {
      await this.getViewMulti(config, contractAddress, fetchMethod, batch, async (result: NumericResult) => {
        const resultConverted = this.wrap(result).dividedBy(10 ** (await this.decimalsDirect(config, contractAddress)));
        callback(resultConverted);
      });
    } else {
      const amount = (await this.getViewMulti(config, contractAddress, fetchMethod)) as number;

      return this.wrap(amount).dividedBy(10 ** (await this.decimalsDirect(config, contractAddress)));
    }
  }
}
