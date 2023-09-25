import {NonPayableMethodObject, PayableMethodObject} from "web3-eth-contract"
import {BaseMultiChainContract} from "./base-multi-chain.contract";
import BigNumber from "bignumber.js";
import {WalletConnectionService} from "../../wallet/wallet-connection.service";
import {TransactionRunningHelperService} from "../../utils/transaction-running-helper.service";
import {BlockchainDefinition} from "../../utils/chains";
import {Web3BatchRequest} from "web3-core";

export abstract class BaseContract extends BaseMultiChainContract {
  protected constructor(
      walletConnection: WalletConnectionService,
      transactionHelper: TransactionRunningHelperService
  ) {
    super(walletConnection, transactionHelper);
  }

  protected abstract getAddress(config: BlockchainDefinition): Promise<string>;

  //CONNECTED PROPERTIES
  public async isLocalManager(config: BlockchainDefinition, wallet: string): Promise<boolean> {
    return this.isLocalManagerMulti(config, await this.getAddress(config), wallet);
  }

  protected async contractConnected(): Promise<any> {
    return this.contractConnectedMulti(await this.getAddress(this.walletConnection.blockchain));
  }

  protected async contractReadOnly(config: BlockchainDefinition): Promise<any> {
    return this.getReadonlyMultiChainContract(config, await this.getAddress(config));
  }

  protected async initForConnected() {
    return this.initForConnectedMulti(await this.getAddress(this.walletConnection.blockchain))
  }

  protected async init(config: BlockchainDefinition) {
    return this.initMultiChainContractReadonly(config, await this.getAddress(config));
  }

  protected async getProperty<T>(
      config: BlockchainDefinition,
      name: string,
      batch?: Web3BatchRequest,
      callback?: (result: T) => void
  ): Promise<T | void> {
    return this.getPropertyMulti(config, await this.getAddress(config), name, batch, callback);
  }

  protected async getView<T>(
      config: BlockchainDefinition,
      fetchMethod: (contract: any) => Promise<PayableMethodObject | NonPayableMethodObject>,
      batch?: Web3BatchRequest,
      callback?: (result: T) => void
  ): Promise<T | void> {
    return this.getViewMulti(config, await this.getAddress(config), fetchMethod, batch, callback);
  }

  protected async runMethodConnected(
      fetchMethod: (contract: any, connectedAddress: string) => Promise<PayableMethodObject | NonPayableMethodObject>,
      validation?: () => Promise<void>,
      getValue?: () => Promise<BigNumber>
  ): Promise<void> {
    await this.runMethodConnectedMulti(await this.getAddress(this.walletConnection.blockchain), fetchMethod, validation, getValue);
  }

  protected async runMethodGasEstimate(
      fetchMethod: (contract: any, connectedAddress: string) => Promise<PayableMethodObject | NonPayableMethodObject>,
      getValue?: () => Promise<BigNumber>
  ): Promise<BigNumber> {
    return this.runMethodGasEstimateMulti(await this.getAddress(this.walletConnection.blockchain), fetchMethod, getValue);
  }
}
