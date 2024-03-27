import {BigNumber} from 'bignumber.js';
import {type JsonRpcOptionalRequest} from 'web3';
import {BlockchainDefinition, EmptyAddress} from '../utils/chains.js';
import {decodeMethodReturn, type NonPayableMethodObject, type PayableMethodObject} from 'web3-eth-contract';
import {v4 as uuidv4} from 'uuid';
import {type WalletWeb3Connection} from '../connection/interface/wallet-web3-connection.js';
import WalletConnectionRequiredError from './error/wallet-connection-required.error.js';
import {SUPPORTED_WAGMI_CHAINS} from '../connection/web3-connection.const.js';
import {ContractToolkitService} from './utils/contract-toolkit.service.js';
import {
    type AbiMethodFetchMethod,
    type FunctionalAbiDefinition,
    type FunctionalAbiExecutable,
    type FunctionalAbiInstanceViews,
    type FunctionalAbiMethodReturnType,
    type FunctionalAbiMethods,
    type FunctionalAbiViews,
} from './utils/contract.types.js';
import {bn_wrap} from "../utils/big-number.utils.js";
import type {BatchRequest} from "./utils/batch-request.js";

export class Web3Contract<FunctionalAbi extends FunctionalAbiDefinition> {
    private _contractConnected: Map<string, any> = new Map();
    private _contractReadOnly: Map<number, any> = new Map();

    private readonly _abiFunctional: FunctionalAbi;
    private readonly _abiFunctionalExecutable: FunctionalAbiExecutable<FunctionalAbi>;
    private readonly _views: FunctionalAbiViews<FunctionalAbi>;
    private readonly _methods: FunctionalAbiMethods<FunctionalAbi>;

    protected get walletConnection(): WalletWeb3Connection {
        if (!('connectWallet' in this.toolkit.web3Connection)) {
            throw new WalletConnectionRequiredError(
                'Requested operation requires wallet connection and you are using a read only connection!',
            );
        }

        return this.toolkit.web3Connection as WalletWeb3Connection;
    }

    public constructor(
        protected readonly toolkit: ContractToolkitService,
        protected readonly abi: any,
    ) {
        const localAbiFunctional: any = {};
        const localViews: any = {};
        const localMethods: any = {};

        const existing = [];
        for (const abiElement of this.abi) {
            if (abiElement.type !== 'function') continue;
            localAbiFunctional[abiElement.name as string] = abiElement;

            const alreadyAvailable = existing.filter(x => x === (abiElement.name as string)).length;
            const suffix = alreadyAvailable > 0
                ? `_${alreadyAvailable}`
                : '';

            if (abiElement.stateMutability !== 'view' && abiElement.stateMutability !== 'pure') {
                localMethods[abiElement.name + suffix] = (
                    contractAddress: string,
                    args: any,
                    validation?: () => Promise<void>,
                    getValue?: () => Promise<BigNumber>,
                    getGas?: () => Promise<BigNumber>,
                ) =>
                    this.buildMethodRunnableMulti(
                        contractAddress,
                        (abi) => {
                            const argsLocal = [];
                            for (const inputKey in abiElement.inputs) {
                                const input = abiElement.inputs[inputKey];
                                argsLocal.push(args[input.name !== '' ? input.name : inputKey]);
                            }
                            return abi.methods[abiElement.name](...argsLocal.map((x) => (x instanceof BigNumber ? x.toString() : x)));
                        },
                        validation,
                        getValue,
                        getGas,
                    );
            } else {
                localViews[abiElement.name + suffix] = (
                    config: BlockchainDefinition,
                    contractAddress: string,
                    args: any,
                    batch?: BatchRequest,
                    callback?: (result: any) => Promise<any> | any
                ) =>
                    this.callView(
                        config,
                        contractAddress,
                        (abi) => {
                            const argsLocal = [];
                            for (const inputKey in abiElement.inputs) {
                                const input = abiElement.inputs[inputKey];
                                argsLocal.push(args[input.name !== '' ? input.name : inputKey]);
                            }
                            return abi.methods[abiElement.name](...argsLocal.map((x) => (x instanceof BigNumber ? x.toFixed() : x)));
                        },
                        batch,
                        callback
                    );
            }

            existing.push(abiElement.name);
        }

        this._abiFunctional = localAbiFunctional;
        this._abiFunctionalExecutable = this.getContractFunctionAbiDefinition();
        this._views = localViews;
        this._methods = localMethods;
    }

    public get views(): FunctionalAbiViews<FunctionalAbi> {
        return this._views;
    }

    public get methods(): FunctionalAbiMethods<FunctionalAbi> {
        return this._methods;
    }

    public readOnlyInstance(
        config: BlockchainDefinition,
        contractAddress: string,
    ): FunctionalAbiInstanceViews<FunctionalAbi> {
        const viewsConverted: any = {};
        const views = Object.keys(this.views) as any[];
        for (const viewName of views) {
            viewsConverted[viewName] = (args: any, batch?: BatchRequest, callback?: (result: any) => Promise<any> | any) =>
                (this._views as Record<string, any>)[viewName](config, contractAddress, args, batch, callback);
        }
        return viewsConverted;
    }

    protected initMultiChainContractReadonly(config: BlockchainDefinition, address: string): void {
        if (!this._contractReadOnly.has(config.networkId)) {
            this._contractReadOnly.set(config.networkId, new Map<string, any>());
        }
        if (!this._contractReadOnly.get(config.networkId)!.has(address)) {
            this._contractReadOnly
                .get(config.networkId)!
                .set(address, new (this.toolkit.web3Connection.getWeb3ReadOnly(config).eth.Contract)(this.abi, address));
        }
    }

    protected getReadonlyMultiChainContract(config: BlockchainDefinition, contractAddress: string): any {
        if (!this._contractReadOnly.get(config.networkId)?.has(contractAddress)) {
            this.initMultiChainContractReadonly(config, contractAddress);
        }

        return this._contractReadOnly.get(config.networkId)!.get(contractAddress);
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
            this._contractConnected.set(address, new this.walletConnection.web3.eth.Contract(this.abi, address));
        }
    }

    protected async callView<T extends FunctionalAbiMethodReturnType>(
        config: BlockchainDefinition,
        contractAddress: string,
        fetchMethod: AbiMethodFetchMethod<FunctionalAbi>,
        batch?: BatchRequest,
        callback?: (result: T) => Promise<any> | any
    ): Promise<T | void> {
        const contract = this.getReadonlyMultiChainContract(config, contractAddress);
        const definitions = this._abiFunctionalExecutable;
        const call = fetchMethod(definitions);
        const method = contract.methods[call.definition.name](...call.args);

        if (typeof batch !== 'undefined') {
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

            batch.add(jsonRpcCall, async response => {
                return Promise.resolve(callback!(decodeMethodReturn(call.definition, response) as T));
            });
        } else {
            return method.call().then((x: any) => x as T);
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
                this.toolkit.transactionHelper.start();
                if (validation) await validation();

                const value = getValue ? await getValue() : 0;
                const method = await fetchMethod(contract, this.walletConnection.accounts[0]);

                const estimateGas =
                    getGas !== undefined
                        ? await getGas()
                        : await this.runMethodGasEstimateMulti(contractAddress, fetchMethod, getValue);

                const tx = {
                    chain: SUPPORTED_WAGMI_CHAINS.filter((x) => x.id === this.walletConnection.blockchain.networkId).pop(),
                    account: this.walletConnection.accounts[0],
                    to: contractAddress as `0x${string}`,
                    data: method.encodeABI() as `0x${string}`,
                    gas: BigInt(estimateGas.multipliedBy(this.toolkit.generalConfig.estimateGasMultiplier).decimalPlaces(0).toFixed()),
                    value: BigInt(value.toFixed()),
                };

                let transactionHash: `0x${string}`;
                if (this.walletConnection.isLocalAccountConnected()) {
                    const prepared = await this.walletConnection.walletClient.prepareTransactionRequest(tx);
                    const signature = await this.walletConnection.walletClient.signTransaction({
                        ...prepared,
                        account: prepared.account!,
                        chain: prepared.chain!
                    });
                    transactionHash = await this.walletConnection.walletClient.sendRawTransaction({
                        serializedTransaction: signature
                    });
                } else {
                    // @ts-ignore
                    transactionHash = await this.walletConnection.walletClient.sendTransaction(tx);
                }

                let blocks = 0;
                let result: any = undefined;
                while (blocks <= this.toolkit.generalConfig.blockMintingTolerance && result === undefined) {
                    try {
                        result = await this.walletConnection
                            .getReadOnlyClient(this.walletConnection.blockchain)
                            .waitForTransactionReceipt({
                                hash: transactionHash,
                                timeout: this.toolkit.generalConfig.executionReceiptTimeout,
                                confirmations: this.toolkit.generalConfig.executionConfirmation,
                            });
                    } catch (e) {
                        blocks += 1;
                        if (blocks > this.toolkit.generalConfig.blockMintingTolerance) throw e;

                        // Poor mans sleep... Fix with proper promise someday
                        if (this.toolkit.generalConfig.blockMintingToleranceIntervalMilliseconds > 0)
                            await new Promise((resolve1) =>
                                setTimeout(resolve1, this.toolkit.generalConfig.blockMintingToleranceIntervalMilliseconds),
                            );
                    }
                }

                if (result?.status === 'success') {
                    this.toolkit.transactionHelper.success(result!.transactionHash.toString());
                    await this.walletConnection.reloadBalanceCache();
                    resolve();
                } else {
                    const reason = JSON.stringify(result?.logs);
                    this.toolkit.transactionHelper.failed(reason);
                    await this.walletConnection.reloadBalanceCache();
                    reject(reason);
                }
            } catch (e: any) {
                console.log(e);

                let errorMessage: string;
                if (typeof e.data?.message !== 'undefined') {
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
                    } catch (ex) {
                    }
                } else {
                    errorMessage = e;
                }
                this.toolkit.transactionHelper.failed(errorMessage);
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
        const contract = await this.getReadonlyMultiChainContract(this.walletConnection.blockchain, contractAddress);
        if (typeof contract === 'undefined') return new BigNumber(0);

        const value = getValue ? await getValue() : new BigNumber(0);
        const method = await fetchMethod(contract, this.walletConnection.accounts[0]);

        const tx = {
            chain: SUPPORTED_WAGMI_CHAINS.filter((x) => x.id === this.walletConnection.blockchain.networkId).pop(),
            account: this.walletConnection.accounts[0],
            to: contractAddress as `0x${string}`,
            data: method.encodeABI() as `0x${string}`,
            value: BigInt(value.toFixed()),
        };
        const estimate = await this.walletConnection
            .getReadOnlyClient(this.walletConnection.blockchain)
            .estimateGas(tx);

        return bn_wrap(estimate);
    }

    private getContractFunctionAbiDefinition(): FunctionalAbiExecutable<FunctionalAbi> {
        let definition = {
            methods: {} as any,
        };
        for (const abiMethodKey of Object.keys(this._abiFunctional)) {
            const abiMethod = this._abiFunctional[abiMethodKey];
            definition.methods[abiMethodKey] = (...args: any[]) => {
                return {
                    definition: abiMethod,
                    args: args,
                };
            };
        }
        return definition as FunctionalAbiExecutable<FunctionalAbi>;
    }
}

export class MethodRunnable {
    public target: string = '';
    public execute: () => Promise<void> = async () => {
    };
    public getData: () => Promise<string> = async () => '';
}
