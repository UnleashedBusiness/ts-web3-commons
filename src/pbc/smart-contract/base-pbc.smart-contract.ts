import {PBCContractMultiCall} from "./pbc-contract-multi-call.js";
import type {PartisiaBlockchainService} from "../pbc.service.js";
import type {ChainDefinition} from "../pbc.chains.js";
import {
    type PBCCallDefinition,
    type PBCCallDelegate,
    type PBCInstanceCallDefinition, type PBCMultiCallDelegate,
    ToMultiCall
} from "../pbc.types.js";
import type {ConnectedWalletInterface} from "../wallet-connection/connected-wallet.interface.js";
import {TransactionRunningHelperService} from "../../utils/transaction-running-helper.service.js";
import type { RpcContractBuilder } from '@partisiablockchain/abi-client';

export abstract class BasePBCSmartContract {
    protected constructor(
        protected readonly pbcClient: PartisiaBlockchainService,
        protected readonly connectedWallet: ConnectedWalletInterface,
        protected readonly transactionHelper: TransactionRunningHelperService,
    ) {
    }

    public callView<R>(chainDefinition: ChainDefinition, contractAddress: string, view: PBCCallDelegate<R>,  loadState: boolean, loadAvlTreeIndexes?: number[]): Promise<R> {
        return this.pbcClient.call(
            chainDefinition,
            contractAddress,
            view,
            loadState,
            loadAvlTreeIndexes
        );
    }

    public multiCall(chainDefinition: ChainDefinition, contractAddress: string, views: PBCMultiCallDelegate[], loadState: boolean, loadAvlTreeIndexes?: number[]): Promise<void> {
        return this.pbcClient.callMulti(
            chainDefinition,
            contractAddress,
            views,
            loadState,
            loadAvlTreeIndexes
        );
    }

    public buildMethodDefinition<R>(call: PBCCallDelegate<R>, loadState: boolean, loadAvlTreeIndexes: number[] = []): PBCCallDefinition<R> {
        return {
            buildMultiCall: (callback: (value: R) => Promise<any>) => [ToMultiCall(call, callback), loadAvlTreeIndexes],
            executeCall: (chain: ChainDefinition, contractAddress: string) => {
                return this.pbcClient.call(
                    chain,
                    contractAddress,
                    call,
                    loadState,
                    loadAvlTreeIndexes
                )
            }
        }
    }

    public async send(chainDefinition: ChainDefinition, contractAddress: string, methodName: string, methodCallBuilder: (builder: RpcContractBuilder) => Buffer, gasCost: number): Promise<string> {
        if (!this.connectedWallet.isConnected) {
            throw new Error("Wallet not connected!");
        }
        if (this.connectedWallet.chain?.id !== chainDefinition.id) {
            throw new Error(`Wallet is connected to different chain! Expected: ${chainDefinition.name}, Connected to: ${this.connectedWallet.chain?.name}`);
        }

        this.transactionHelper.start();

        try {
            const txId = await this.pbcClient.send(
                this.connectedWallet,
                contractAddress,
                methodName,
                methodCallBuilder,
                gasCost,
            );
            this.transactionHelper.success(txId);

            return txId;
        } catch (error: any) {
            this.transactionHelper.failed(error?.message);
            throw error;
        }
    }

    public abstract buildInstance(chain: ChainDefinition, contractAddress: string): BasePBCSmartContractInstance<this>;
}

export class BasePBCSmartContractInstance<C extends BasePBCSmartContract> {
    constructor(
        private readonly contract: C,
        private readonly chain: ChainDefinition,
        private readonly address: string,
    ) {
    }

    public callView<R>(view: PBCCallDelegate<R>, loadState: boolean, loadAvlTreeIndexes?: number[]): Promise<R> {
        return this.contract.callView(this.chain, this.address, view, loadState, loadAvlTreeIndexes);
    }

    public multiCall(views: PBCMultiCallDelegate[], loadState: boolean, loadAvlTreeIndexes?: number[]): Promise<void> {
        return this.contract.multiCall(
            this.chain,
            this.address,
            views,
            loadState,
            loadAvlTreeIndexes
        );
    }

    public startMultiCall(): PBCContractMultiCall<C> {
        return new PBCContractMultiCall(this);
    }

    public buildMethodDefinition<R>(call: PBCCallDelegate<R>, loadState: boolean, loadAvlTreeIndexes: number[] = []): PBCInstanceCallDefinition<R> {
        return {
            buildMultiCall: (callback: (value: R) => Promise<any>) => [ToMultiCall(call, callback), loadAvlTreeIndexes],
            executeCall: () => {
                return this.contract.buildMethodDefinition(
                    call,
                    loadState,
                    loadAvlTreeIndexes
                ).executeCall(this.chain, this.address)
            }
        }
    }

    public send(methodName: string, methodCallBuilder: (builder: RpcContractBuilder) => Buffer, gasCost: number): Promise<string> {
        return this.contract.send(
            this.chain,
            this.address,
            methodName,
            methodCallBuilder,
            gasCost,
        );
    }
}
