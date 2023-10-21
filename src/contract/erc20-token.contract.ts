import { BaseMultiChainContract, MethodRunnable } from './base/base-multi-chain.contract';
import BigNumber from 'bignumber.js';
import { Erc20Abi, Erc20AbiFunctional } from '../abi/erc20.abi';
import { TransactionRunningHelperService } from '../utils/transaction-running-helper.service';
import { BlockchainDefinition } from '../utils/chains';
import { Web3BatchRequest } from 'web3-core';
import { ReadOnlyWeb3Connection } from '../connection/interface/read-only-web3-connection';

export class Erc20TokenContract extends BaseMultiChainContract<Erc20AbiFunctional> {
  private decimalsCache: Map<number, Map<string, number>> = new Map();

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
  ) {
    if (!this.decimalsCache.has(config.networkId)) this.decimalsCache.set(config.networkId, new Map<string, number>());
    if (!this.decimalsCache.get(config.networkId)?.has(address))
      this.decimalsCache.get(config.networkId)?.set(
        address,
        (await this.getPropertyMulti(config, address, async (abi) => abi.methods.decimals())) as number,
      );
    if (callback) {
      callback(this.decimalsCache.get(config.networkId)?.get(address) as number);
      return;
    } else return this.decimalsCache.get(config.networkId)?.get(address) as number;
  }

  public async symbol(config: BlockchainDefinition, address: string, batch?: any, callback?: (result: string) => void) {
    return this.getPropertyMulti(config, address, (properties) => properties.methods.symbol(), batch, callback);
  }

  public async name(config: BlockchainDefinition, address: string, batch?: any, callback?: (result: string) => void) {
    return this.getPropertyMulti(config, address, (abi) => abi.methods.name(), batch, callback);
  }

  public decimalsSync(config: BlockchainDefinition, address: string): number {
    if (!this.decimalsCache.has(config.networkId)) this.decimalsCache.set(config.networkId, new Map<string, number>());
    if (!this.decimalsCache.get(config.networkId)?.has(address)) return 0;
    return this.decimalsCache.get(config.networkId)?.get(address) as number;
  }

  public async balanceOf(
    config: BlockchainDefinition,
    contractAddr: string,
    address: string,
    batch?: any,
    callback?: (balance: BigNumber) => void,
  ) {
    if (typeof callback !== 'undefined') {
      return this.getViewMulti(
        config,
        contractAddr,
        // @ts-ignore
        async (contract) => contract.methods.balanceOf(address),
        batch,
        (result: number) =>
          callback ? callback(this.wrap(result).dividedBy(10 ** this.decimalsSync(config, contractAddr))) : undefined,
      );
    } else {
      const amount = (await this.getViewMulti(
        config,
        contractAddr,
        // @ts-ignore
        async (contract) => contract.methods.balanceOf(address),
      )) as number;
      return this.wrap(amount).dividedBy(10 ** this.decimalsSync(config, contractAddr));
    }
  }

  public totalSupply(
    config: BlockchainDefinition,
    contractAddr: string,
    batch?: any,
    callback?: (supply: BigNumber) => void,
  ) {
    return this.getViewMulti(
      config,
      contractAddr,
      // @ts-ignore
      async (contract) => contract.methods.totalSupply(),
      batch,
      (result: number) => {
        callback ? callback(this.wrap(result).dividedBy(10 ** this.decimalsSync(config, contractAddr))) : undefined;
      },
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
    if (typeof callback !== 'undefined') {
      return this.getViewMulti(
        config,
        contractAddr,
        // @ts-ignore
        async (contract) => contract.methods.allowance(wallet, spender),
        batch,
        (result: number) =>
          callback ? callback(this.wrap(result).dividedBy(10 ** this.decimalsSync(config, contractAddr))) : undefined,
      );
    } else {
      const amount = (await this.getViewMulti(
        config,
        contractAddr,
        // @ts-ignore
        async (contract) => contract.methods.allowance(wallet, spender),
      )) as number;
      return this.wrap(amount).dividedBy(10 ** this.decimalsSync(config, contractAddr));
    }
  }

  //METHODS
  async approveTransfer(contractAddr: string, from: string, amount: BigNumber): Promise<MethodRunnable> {
    const division = 10 ** ((await this.decimals(this.walletConnection.blockchain, contractAddr)) as number);
    const amountWei = amount.multipliedBy(division);
    return this.buildMethodRunnableMulti(
      contractAddr,
      // @ts-ignore
      async (contract, _) => contract.methods.approve(from, amountWei.toString()),
      undefined,
      undefined,
      async () => new BigNumber(100000),
    );
  }

  async transfer(contractAddr: string, to: string, amount: BigNumber): Promise<void> {
    const division = 10 ** this.decimalsSync(this.walletConnection.blockchain, contractAddr);
    const amountWei = amount.multipliedBy(division);
    // @ts-ignore
    await this.runMethodConnectedMulti(contractAddr, async (contract, _) =>
      contract.methods.transfer(to, amountWei.toString()),
    );
  }

  async transferRunnable(contractAddr: string, to: string, amount: BigNumber) {
    const division = 10 ** this.decimalsSync(this.walletConnection.blockchain, contractAddr);
    const amountWei = amount.multipliedBy(division);
    // @ts-ignore
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
}
