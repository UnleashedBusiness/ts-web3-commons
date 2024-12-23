import {BigNumber} from 'bignumber.js';
import {type BlockNumberOrTag, type JsonRpcOptionalRequest, type TransactionCall} from 'web3';
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
import {Contract} from "web3-eth-contract";

export class Web3Contract<FunctionalAbi extends FunctionalAbiDefinition> {
    private readonly _contract: Contract<any>;

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
        this._contract = new Contract(this.abi);

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
                    callback?: (result: any) => Promise<any> | any,
                    onError?: (reason: any) => Promise<void> | void,
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
                        callback,
                        onError
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
            viewsConverted[viewName] = (args: any, batch?: BatchRequest, callback?: (result: any) => Promise<any> | any, onError?: (reason: any) => Promise<void> | void) =>
                (this._views as Record<string, any>)[viewName](config, contractAddress, args, batch, callback, onError);
        }
        return viewsConverted;
    }

    protected async callView<T extends FunctionalAbiMethodReturnType>(
        config: BlockchainDefinition,
        contractAddress: string,
        fetchMethod: AbiMethodFetchMethod<FunctionalAbi>,
        batch?: BatchRequest,
        callback?: (result: T) => Promise<any> | any,
        onError?: (reason: any) => Promise<void> | void,
    ): Promise<T | void> {
        const definitions = this._abiFunctionalExecutable;
        const call = fetchMethod(definitions);
        const method = this._contract.methods[call.definition.name](...call.args);

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
        if (typeof batch !== 'undefined') {
            batch.add(jsonRpcCall, async response => {
                return Promise.resolve(callback!(decodeMethodReturn(call.definition, response) as T));
            }, onError !== undefined ? async reason => Promise.resolve(onError!(reason)) : undefined);
        } else {
            let client = this.toolkit.web3Connection.getWeb3ReadOnly(config);
            return client.eth.call(jsonRpcCall.params![0] as TransactionCall, jsonRpcCall.params![1] as BlockNumberOrTag)
                .then(response => decodeMethodReturn(call.definition, response) as T)
                .catch((error: any) => console.log(error));
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
            getData: () => this.getRunMethodDataMulti((contract) => fetchMethod(contract, EmptyAddress)),
            execute: () => this.runMethodConnectedMulti(contractAddress, fetchMethod, validation, getValue, getGas),
            estimateGas: (config: BlockchainDefinition, from?: string) => this.runMethodGasEstimateMulti(config, contractAddress, fetchMethod, from, getValue)
        };
    }

    protected async getRunMethodDataMulti(
        fetchMethod: (contract: any) => Promise<PayableMethodObject | NonPayableMethodObject>,
    ): Promise<string> {
        return (await fetchMethod(this._contract)).encodeABI();
    }

    protected async runMethodConnectedMulti(
        contractAddress: string,
        fetchMethod: (contract: any, connectedAddress: string) => Promise<PayableMethodObject | NonPayableMethodObject>,
        validation?: () => Promise<void>,
        getValue?: () => Promise<BigNumber>,
        getGas?: () => Promise<BigNumber>,
    ): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                this.toolkit.transactionHelper.start();
                if (validation) await validation();

                const value = getValue ? await getValue() : 0;
                const method = await fetchMethod(this._contract, this.walletConnection.accounts[0]);

                const estimateGas =
                    getGas !== undefined
                        ? await getGas()
                        : await this.runMethodGasEstimateMulti(this.walletConnection.blockchain, contractAddress, fetchMethod, this.walletConnection.accounts[0], getValue);

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
        config: BlockchainDefinition,
        contractAddress: string,
        fetchMethod: (contract: any, connectedAddress: string) => Promise<PayableMethodObject | NonPayableMethodObject>,
        from?: string,
        getValue?: () => Promise<BigNumber>,
    ): Promise<BigNumber> {
        const value = getValue ? await getValue() : new BigNumber(0);
        const method = await fetchMethod(this._contract, from ?? EmptyAddress);

        const tx = {
            chain: SUPPORTED_WAGMI_CHAINS.filter((x) => x.id === config.networkId).pop(),
            account: (from ?? EmptyAddress) as `0x${string}`,
            to: contractAddress as `0x${string}`,
            data: method.encodeABI() as `0x${string}`,
            value: BigInt(value.toFixed()),
        };
        const estimate = await this.toolkit.web3Connection
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
    public execute: () => Promise<void> = async () => {};
    public getData: () => Promise<string> = async () => '';
    public estimateGas: (config: BlockchainDefinition, from?: string) => Promise<BigNumber> = async () => bn_wrap(0);
}
