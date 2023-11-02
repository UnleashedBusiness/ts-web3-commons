import BigNumber from 'bignumber.js';
import Web3, { AbiFunctionFragment, Contract, JsonRpcOptionalRequest } from 'web3';
import { Web3BatchRequest } from 'web3-core';
import { TransactionRunningHelperService } from '../../utils/transaction-running-helper.service';
import { BlockchainDefinition, EmptyAddress } from '../../utils/chains';
import { decodeMethodReturn, NonPayableMethodObject, PayableMethodObject } from 'web3-eth-contract';
import { v4 as uuidv4 } from 'uuid';
import { ReadOnlyWeb3Connection } from '../../connection/interface/read-only-web3-connection';
import { WalletWeb3Connection } from '../../connection/interface/wallet-web3-connection';
import WalletConnectionRequiredError from '../error/wallet-connection-required.error';
import { SUPPORTED_WAGMI_CHAINS } from '../../connection/web3-connection.const';

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

export abstract class BaseMultiChainContract<FunctionalAbi extends FunctionalAbiDefinition> {
  private _contractConnected: Map<string, any> = new Map();
  private _contractReadOnly: Map<number, any> = new Map();

  protected get walletConnection(): WalletWeb3Connection {
    if (!('connectWallet' in this.web3Connection)) {
      throw new WalletConnectionRequiredError(
        'Requested operation requires wallet connection and you are using a read only connection!',
      );
    }

    return this.web3Connection as WalletWeb3Connection;
  }

  protected constructor(
    protected readonly web3Connection: ReadOnlyWeb3Connection,
    protected readonly transactionHelper: TransactionRunningHelperService,
  ) {}

  protected abstract getAbi(): any;

  public transferOwnership(contractAddress: string, newOwner: string): MethodRunnable {
    // @ts-ignore
    return this.buildMethodRunnableMulti(contractAddress, async (contract) =>
      contract.methods.transferOwnership(newOwner),
    );
  }

  public async owner(
    config: BlockchainDefinition,
    contractAddress: string,
    batch?: Web3BatchRequest,
    callback?: (result: string) => void,
  ) {
    return this.getViewMulti(config, contractAddress, async (contract) => contract.methods.owner(), batch, callback);
  }

  public async getRoleUserCount(
    config: BlockchainDefinition,
    contractAddress: string,
    role: string,
    batch?: Web3BatchRequest,
    callback?: (result: number) => void,
  ): Promise<number | void> {
    const roleConverted = Web3.utils.sha3(role);
    return this.getViewMulti(
      config,
      contractAddress,
      async (contract) => contract.methods.getRoleMemberCount(roleConverted),
      batch,
      callback,
    );
  }

  public async getRoleMemberAtPosition(
    config: BlockchainDefinition,
    contractAddress: string,
    role: string,
    index: number,
    batch?: Web3BatchRequest,
    callback?: (result: string) => void,
  ): Promise<string | void> {
    const roleConverted = Web3.utils.sha3(role);
    return this.getViewMulti(
      config,
      contractAddress,
      async (contract) => contract.methods.getRoleMember(roleConverted, index),
      batch,
      callback,
    );
  }

  public isLocalManagerMulti(config: BlockchainDefinition, contractAddress: string, wallet: string): Promise<boolean> {
    return this.hasRole(config, contractAddress, 'LOCAL_MANAGER_ROLE', wallet) as Promise<boolean>;
  }

  public async hasRole(
    config: BlockchainDefinition,
    contractAddress: string,
    role: string,
    wallet: string,
    batch?: Web3BatchRequest,
    callback?: (result: boolean) => void,
  ): Promise<boolean | void> {
    const roleConverted = Web3.utils.sha3(role);
    return this.getViewMulti(
      config,
      contractAddress,
      async (abi) => abi.methods.hasRole(roleConverted, wallet),
      batch,
      callback,
    );
  }

  protected async initMultiChainContractReadonly(config: BlockchainDefinition, address: string): Promise<void> {
    if (!this._contractReadOnly.has(config.networkId)) {
      this._contractReadOnly.set(config.networkId, new Map<string, any>());
    }
    if (!this._contractReadOnly.get(config.networkId)!.has(address)) {
      this._contractReadOnly
        .get(config.networkId)!
        .set(address, new (this.web3Connection.getWeb3ReadOnly(config).eth.Contract)(this.getAbi(), address));
    }
  }

  protected async getReadonlyMultiChainContract(config: BlockchainDefinition, contractAddress: string): Promise<any> {
    if (!this._contractReadOnly.get(config.networkId)?.has(contractAddress)) {
      await this.initMultiChainContractReadonly(config, contractAddress);
    }

    return this._contractReadOnly.get(config.networkId)!.get(contractAddress);
  }

  //${AbiFragment['name']} AbiFragment extends AbiFunctionFragment ? `asd` : never
  protected async getPropertyMulti<T>(
    config: BlockchainDefinition,
    contractAddress: string,
    fetchProperty:
      | ((abi: FunctionalAbiExecutable<FunctionalAbi>) => Promise<FunctionalAbiMethodDefinition>)
      | ((abi: FunctionalAbiExecutable<FunctionalAbi>) => FunctionalAbiMethodDefinition)
      | string,
    batch?: Web3BatchRequest,
    callback?: (result: T) => void,
  ): Promise<T | void> {
    const contract = await this.getReadonlyMultiChainContract(config, contractAddress);
    const definitions = this.getContractFunctionAbiDefinition(contract);
    const definition =
      typeof fetchProperty === 'string' ? definitions.methods[fetchProperty]() : await fetchProperty(definitions);
    const method = contract.methods[definition.definition.name]();

    if (typeof batch !== 'undefined' && typeof callback !== 'undefined') {
      const jsonRpcCall: JsonRpcOptionalRequest = {
        jsonrpc: '2.0',
        id: uuidv4(),
        method: 'eth_call',
        params: [
          {
            to: contractAddress,
            data: method.encodeABI(),
          },
          'latest',
        ],
      };
      batch
        .add<string>(jsonRpcCall)
        .then((response) => {
          const transformed = decodeMethodReturn(definition.definition, response);
          callback(transformed as T);
        })
        .catch((errorContext) => console.log(errorContext));
    } else return method.call();
  }

  protected async getViewMulti<T>(
    config: BlockchainDefinition,
    contractAddress: string,
    fetchMethod:
      | ((abi: FunctionalAbiExecutable<FunctionalAbi>) => Promise<FunctionalAbiMethodDefinition>)
      | ((abi: FunctionalAbiExecutable<FunctionalAbi>) => FunctionalAbiMethodDefinition),
    batch?: Web3BatchRequest,
    callback?: (result: T) => void,
  ): Promise<T | void> {
    const contract = await this.getReadonlyMultiChainContract(config, contractAddress);
    const definitions = this.getContractFunctionAbiDefinition(contract);
    const call = await fetchMethod(definitions);
    const method = contract.methods[call.definition.name](...call.args);

    if (typeof batch !== 'undefined' && typeof callback !== 'undefined') {
      const jsonRpcCall: JsonRpcOptionalRequest = {
        jsonrpc: '2.0',
        id: uuidv4(),
        method: 'eth_call',
        params: [
          {
            to: contractAddress,
            data: method.encodeABI(),
          },
          'latest',
        ],
      };
      batch
        .add<string>(jsonRpcCall)
        .then((response) => {
          const transformed = decodeMethodReturn(call.definition, response);
          callback(transformed as T);
        })
        .catch((errorContext) => console.log(errorContext));
    } else if (typeof callback !== 'undefined') callback(await method.call());
    else {
      return method.call();
    }
  }

  protected async contractConnectedMulti(address: string): Promise<any> {
    await this.initForConnectedMulti(address);
    return this._contractConnected.get(address);
  }

  protected async initForConnectedMulti(address: string) {
    if (!this.walletConnection.walletConnected()) {
      this._contractConnected.delete(address);
      return;
    } else if (!this._contractConnected.has(address)) {
      // @ts-ignore It is the same but tsc does not see it :/
      this._contractConnected.set(address, new this.walletConnection.web3.eth.Contract(this.getAbi(), address));
    }
  }

  protected buildMethodRunnableMulti(
    contractAddress: string,
    fetchMethod: (contract: any, connectedAddress: string) => Promise<PayableMethodObject | NonPayableMethodObject>,
    validation?: () => Promise<void>,
    getValue?: () => Promise<BigNumber>,
    getGas?: () => Promise<BigNumber>,
  ): MethodRunnable {
    return {
      target: contractAddress,
      getData: () => this.getRunMethodDataMulti(contractAddress, (contract) => fetchMethod(contract, EmptyAddress)),
      execute: () => this.runMethodConnectedMulti(contractAddress, fetchMethod, validation, getValue, getGas),
    };
  }

  protected async getRunMethodDataMulti(
    contractAddress: string,
    fetchMethod: (contract: any) => Promise<PayableMethodObject | NonPayableMethodObject>,
  ): Promise<string> {
    const contract = await this.contractConnectedMulti(contractAddress);
    return (await fetchMethod(contract)).encodeABI();
  }

  protected async runMethodConnectedMulti(
    contractAddress: string,
    fetchMethod: (contract: any, connectedAddress: string) => Promise<PayableMethodObject | NonPayableMethodObject>,
    validation?: () => Promise<void>,
    getValue?: () => Promise<BigNumber>,
    getGas?: () => Promise<BigNumber>,
  ): Promise<void> {
    const contract = await this.contractConnectedMulti(contractAddress);
    if (typeof contract === 'undefined') {
      throw new Error('Failed to initialize contract for: ' + contractAddress);
    }

    return new Promise(async (resolve, reject) => {
      try {
        this.transactionHelper.start();
        if (validation) await validation();

        const value = getValue ? await getValue() : 0;

        const method = await fetchMethod(contract, this.walletConnection.accounts[0]);
        //const gasPrice = (await this.walletConnection.web3.eth.getGasPrice());

        const estimateGas =
          getGas !== undefined
            ? await getGas()
            : await this.runMethodGasEstimateMulti(contractAddress, fetchMethod, getValue);

        const tx = {
          chain: SUPPORTED_WAGMI_CHAINS.filter((x) => x.id === this.walletConnection.blockchain.networkId).pop(),
          account: this.walletConnection.accounts[0],
          to: contractAddress,
          data: method.encodeABI(),
          gas: estimateGas.multipliedBy(1.15).decimalPlaces(0).toString(),
          value: value.toString(),
          //gasPrice: this.walletConnection.blockchain.networkId === blockchainIndex.MATIC.networkId
          //    ? gasPrice
          //    : undefined,
        };

        // @ts-ignore
        const transactionHash = await this.walletConnection.walletClient.sendTransaction(tx);
        const result = await this.walletConnection
          .getReadOnlyClient(this.walletConnection.blockchain)
          .waitForTransactionReceipt({ hash: transactionHash });
        if (result.status === 'success') {
          this.transactionHelper.success(result.transactionHash.toString());
          await this.walletConnection.reloadBalanceCache();
          resolve();
        } else {
          const reason = JSON.stringify(result.logs);
          this.transactionHelper.failed(reason);
          await this.walletConnection.reloadBalanceCache();
          reject(reason);
        }
      } catch (e) {
        console.log(e);

        let errorMessage: string;
        if (typeof e.data.message !== "undefined") {
          errorMessage = e.data.message;
        } else if (typeof e.message !== 'undefined') {
          errorMessage = (e as any).message
            .replace("[ethjs-query] while formatting outputs from RPC '", '')
            .replace('"', '"')
            .replace('Internal JSON-RPC error.', '');
          errorMessage = errorMessage.substring(0, errorMessage.length - 1);
          try {
            const decoded = JSON.parse(errorMessage);
            errorMessage = decoded.value.data.message;
          } catch (ex) {}
        } else {}
        this.transactionHelper.failed(errorMessage);
        await this.walletConnection.reloadBalanceCache();
        reject(errorMessage);
      }
    });
  }

  protected async runMethodGasEstimateMulti(
    contractAddress: string,
    fetchMethod: (contract: any, connectedAddress: string) => Promise<PayableMethodObject | NonPayableMethodObject>,
    getValue?: () => Promise<BigNumber>,
  ): Promise<BigNumber> {
    const contract = await this.contractConnectedMulti(contractAddress);
    if (typeof contract === 'undefined') return new BigNumber(0);

    const value = getValue ? await getValue() : new BigNumber(0);
    const method = await fetchMethod(contract, this.walletConnection.accounts[0]);
    //const gasPrice = (await this.walletConnection.web3.eth.getGasPrice());

    return new BigNumber(
      Number(
        await method.estimateGas({
          from: this.walletConnection.accounts[0],
          // gasPrice: this.walletConnection.blockchain.networkId === blockchainIndex.MATIC.networkId
          //   ? gasPrice.toString() :
          //   undefined,
          value: value.toString(),
        }),
      ),
    );
  }

  protected wrap(num: NumericResult): BigNumber {
    if (typeof num === "bigint") {
      return new BigNumber(num.toString());
    }

    return new BigNumber(num);
  }

  private getContractFunctionAbiDefinition(contract: Contract<any>): FunctionalAbiExecutable<FunctionalAbi> {
    let definition = {
      methods: [],
    };
    // @ts-ignore
    for (const abiMethod of contract._overloadedMethodAbis.values()) {
      definition.methods[abiMethod[0].name] = (...args: any[]) => {
        return {
          definition: abiMethod[0],
          args: args,
        };
      };
    }
    return definition as FunctionalAbiExecutable<FunctionalAbi>;
  }
}

export class MethodRunnable {
  public target: string = '';
  public execute: () => Promise<void> = async () => {};
  public getData: () => Promise<string> = async () => '';
}
