import BigNumber from "bignumber.js";
import Web3 from "web3";
import {Web3BatchRequest} from "web3-core";
import {WalletConnectionService} from "../../wallet/wallet-connection.service";
import {TransactionRunningHelperService} from "../../utils/transaction-running-helper.service";
import {BlockchainDefinition, blockchainIndex, EmptyAddress} from "../../utils/chains";
import {Contract, NonPayableMethodObject, PayableMethodObject} from "web3-eth-contract";
import {ContractAbi, TransactionReceipt} from "web3-types";

export abstract class BaseMultiChainContract<Abi extends ContractAbi> {
    private _contractConnected: Map<string, Contract<Abi>> = new Map();
    private _contractReadOnly: Map<number, Map<string, Contract<Abi>>> = new Map();

    protected constructor(
        protected readonly walletConnection: WalletConnectionService,
        protected readonly transactionHelper: TransactionRunningHelperService) {
    }

    protected abstract getAbi(): Abi;

    public transferOwnership(contractAddress: string, newOwner: string): MethodRunnable {
        // @ts-ignore
        return this.buildMethodRunnableMulti(contractAddress, async (contract) => contract.methods.transferOwnership(newOwner));
    }

    public async owner(
        config: BlockchainDefinition,
        contractAddress: string,
        batch?: Web3BatchRequest,
        callback?: (result: string) => void
    ) {
        return this.getViewMulti(config, contractAddress, async contract => contract.methods.owner(), batch, callback);
    }

    public async getRoleUserCount(
        config: BlockchainDefinition,
        contractAddress: string,
        role: string,
        batch?: Web3BatchRequest,
        callback?: (result: number) => void
    ): Promise<number | void> {
        const roleConverted = Web3.utils.sha3(role);
        // @ts-ignore
        return this.getViewMulti(config, contractAddress, async contract => contract.methods.getRoleMemberCount(roleConverted), batch, callback);
    }

    public async getRoleMemberAtPosition(
        config: BlockchainDefinition,
        contractAddress: string,
        role: string,
        index: number,
        batch?: Web3BatchRequest,
        callback?: (result: string) => void
    ): Promise<string | void> {
        const roleConverted = Web3.utils.sha3(role);
        // @ts-ignore
        return this.getViewMulti(config, contractAddress, async contract => contract.methods.getRoleMember(roleConverted, index), batch, callback);
    }

    public isLocalManagerMulti(
        config: BlockchainDefinition,
        contractAddress: string,
        wallet: string
    ): Promise<boolean> {
        return this.hasRole(config, contractAddress, 'LOCAL_MANAGER_ROLE', wallet) as Promise<boolean>;
    }

    public async hasRole(
        config: BlockchainDefinition,
        contractAddress: string,
        role: string,
        wallet: string,
        batch?: Web3BatchRequest,
        callback?: (result: boolean) => void
    ): Promise<boolean | void> {
        const roleConverted = Web3.utils.sha3(role);
        // @ts-ignore
        return this.getViewMulti(config, contractAddress, async contract => contract.methods.hasRole(roleConverted, wallet), batch, callback);
    }

    protected async initMultiChainContractReadonly(config: BlockchainDefinition, address: string): Promise<void> {
        if (!this._contractReadOnly.has(config.networkId)) {
            this._contractReadOnly.set(config.networkId, new Map<string, Contract<Abi>>());
        }
        if (!this._contractReadOnly.get(config.networkId)!.has(address)) {
            this._contractReadOnly.get(config.networkId)!.set(
                address,
                //@ts-ignore Abi stuff
                new (this.walletConnection.getWeb3ReadOnly(config)).eth.Contract(this.getAbi(), address)
            );
        }
    }

    protected async getReadonlyMultiChainContract(config: BlockchainDefinition, contractAddress: string): Promise<Contract<Abi>> {
        if (!this._contractReadOnly.get(config.networkId)?.has(contractAddress)) {
            await this.initMultiChainContractReadonly(config, contractAddress);
        }

        return this._contractReadOnly.get(config.networkId)!.get(contractAddress);
    }

    protected async getPropertyMulti<T>(
        config: BlockchainDefinition,
        contractAddress: string,
        propertyName: string,
        batch?: Web3BatchRequest,
        callback?: (result: T) => void
    ): Promise<T | void> {
        const contract = await this.getReadonlyMultiChainContract(config, contractAddress);
        const method = contract.methods[propertyName]()

        if (typeof batch !== "undefined" && typeof callback !== "undefined") {
            //@ts-ignore request is there it just does not see it in types :/
            batch.add(method.call.request())
                .then(response => callback(response as T))
                .catch(errorContext => console.log(errorContext))
        } else
            return method.call();
    }

    protected async getViewMulti<T>(
        config: BlockchainDefinition,
        contractAddress: string,
        fetchMethod: (contract: Contract<Abi>) => Promise<PayableMethodObject | NonPayableMethodObject>,
        batch?: Web3BatchRequest,
        callback?: (result: T) => void
    ): Promise<T | void> {
        const contract = await this.getReadonlyMultiChainContract(config, contractAddress);
        const method = await fetchMethod(contract);

        if (typeof batch !== "undefined" && typeof callback !== "undefined")
            //@ts-ignore request is there it just does not see it in types :/
            batch.add(method.call.request())
                .then(response => callback(response as T))
                .catch(errorContext => console.log(errorContext));
        else if (typeof callback !== "undefined")
            callback(await method.call());
        else {
            return method.call();
        }
    }


    protected async contractConnectedMulti(address: string): Promise<Contract<Abi>> {
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
        fetchMethod: (contract: Contract<Abi>, connectedAddress: string) => Promise<PayableMethodObject | NonPayableMethodObject>,
        validation?: () => Promise<void>,
        getValue?: () => Promise<BigNumber>,
        getGas?: () => Promise<BigNumber>
    ): MethodRunnable {
        return {
            target: contractAddress,
            getData: () => this.getRunMethodDataMulti(contractAddress, contract => fetchMethod(contract, EmptyAddress)),
            execute: () => this.runMethodConnectedMulti(contractAddress, fetchMethod, validation, getValue, getGas)
        };
    }

    protected async getRunMethodDataMulti(
        contractAddress: string,
        fetchMethod: (contract: Contract<Abi>) => Promise<PayableMethodObject | NonPayableMethodObject>
    ): Promise<string> {
        const contract = await this.contractConnectedMulti(contractAddress);
        return (await fetchMethod(contract)).encodeABI();
    }

    protected async runMethodConnectedMulti(
        contractAddress: string,
        fetchMethod: (contract: Contract<Abi>, connectedAddress: string) => Promise<PayableMethodObject | NonPayableMethodObject>,
        validation?: () => Promise<void>,
        getValue?: () => Promise<BigNumber>,
        getGas?: () => Promise<BigNumber>
    ): Promise<void> {
        const contract = await this.contractConnectedMulti(contractAddress);
        if (typeof contract === "undefined") {
            throw new Error("Failed to initialize contract for: " + contractAddress);
        }

        return new Promise(async (resolve, reject) => {
            try {
                this.transactionHelper.start();
                if (validation)
                    await validation();

                const value = getValue ? await getValue() : 0;

                const method = await fetchMethod(contract, this.walletConnection.accounts[0]);
                const gasPrice = (await this.walletConnection.web3.eth.getGasPrice());

                const estimateGas = getGas !== undefined
                    ? await getGas()
                    : await this.runMethodGasEstimateMulti(contractAddress, fetchMethod, getValue);

                const tx = {
                    from: this.walletConnection.accounts[0],
                    to: contractAddress,
                    data: method.encodeABI(),
                    gas: estimateGas.multipliedBy(1.15).toString(),
                    value: value.toString(),
                    gasPrice: this.walletConnection.blockchain.networkId === blockchainIndex.MATIC.networkId
                        ? gasPrice
                        : undefined,
                };

                this.walletConnection.web3.eth.sendTransaction(tx)
                    .on('receipt', (result: TransactionReceipt) => {
                        if (result.status) {
                            this.transactionHelper.success(result.transactionHash.toString());
                            this.walletConnection.reloadBalanceCache();
                            resolve();
                        } else {
                            const reason = JSON.stringify(result.logs);
                            this.transactionHelper.failed(reason);
                            this.walletConnection.reloadBalanceCache();
                            reject(reason);
                        }
                    })
                    .on('error', (reason: Error) => {
                        this.transactionHelper.failed(reason.message);
                        this.walletConnection.reloadBalanceCache();
                        reject(reason);
                    });
            } catch (e) {
                console.log(e);
                let errorMessage = (e as any).message
                    .replace('[ethjs-query] while formatting outputs from RPC \'', '')
                    .replace("\"", '"')
                    .replace('Internal JSON-RPC error.', '');
                errorMessage = errorMessage.substring(0, errorMessage.length - 1);
                try {
                    const decoded = JSON.parse(errorMessage);
                    errorMessage = decoded.value.data.message;
                } catch (ex) {
                }
                this.transactionHelper.failed(errorMessage);
                await this.walletConnection.reloadBalanceCache();
                reject(errorMessage);
            }
        });
    }

    protected async runMethodGasEstimateMulti(
        contractAddress: string,
        fetchMethod: (contract: Contract<Abi>, connectedAddress: string) => Promise<PayableMethodObject | NonPayableMethodObject>,
        getValue?: () => Promise<BigNumber>
    ): Promise<BigNumber> {
        const contract = await this.contractConnectedMulti(contractAddress);
        if (typeof contract === "undefined")
            return new BigNumber(0);

        const value = getValue ? await getValue() : new BigNumber(0);
        const method = await fetchMethod(contract, this.walletConnection.accounts[0]);
        const gasPrice = (await this.walletConnection.web3.eth.getGasPrice());

        return new BigNumber(Number(await method.estimateGas({
            from: this.walletConnection.accounts[0],
            gasPrice: this.walletConnection.blockchain.networkId === blockchainIndex.MATIC.networkId ? gasPrice : undefined,
            value: value.toString()
        })));
    }

    protected wrap(num: number | string): BigNumber {
        return new BigNumber(num);
    }
}

export class MethodRunnable {
    public target: string = '';
    public execute: () => Promise<void> = async () => {
    };
    public getData: () => Promise<string> = async () => '';
}
