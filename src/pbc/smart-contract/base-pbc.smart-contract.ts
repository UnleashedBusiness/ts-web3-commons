import {FnRpcBuilder, type ScValue} from "@partisiablockchain/abi-client";
import {NamedTypeSpec} from "@partisiablockchain/abi-client/target/main/types/Abi.js";
import {PBCContractMultiCall} from "./pbc-contract-multi-call.js";
import type {PartisiaBlockchainService} from "../pbc.service.js";
import type {ChainDefinition} from "../pbc.chains.js";
import type {AvlTreeBuilderMap} from "../utils/avl-tree.utils.js";
import {
    type PBCCallDefinition,
    type PBCCallDelegate,
    type PBCInstanceCallDefinition, type PBCMultiCallDelegate,
    ToMultiCall
} from "../pbc.types.js";
import type {ConnectedWalletInterface} from "../wallet-connection/connected-wallet.interface.js";

export abstract class BasePBCSmartContract {
    protected constructor(
        protected readonly pbcClient: PartisiaBlockchainService,
        protected readonly connectedWallet: ConnectedWalletInterface
    ) {
    }

    public callView<R>(chainDefinition: ChainDefinition, contractAddress: string, view: PBCCallDelegate<R>, loadAvlTreeIndexes?: number[]): Promise<R> {
        return this.pbcClient.call(
            chainDefinition,
            contractAddress,
            view,
            loadAvlTreeIndexes
        );
    }

    public multiCall(chainDefinition: ChainDefinition, contractAddress: string, views: PBCMultiCallDelegate[], loadAvlTreeIndexes?: number[]): Promise<void> {
        return this.pbcClient.callMulti(
            chainDefinition,
            contractAddress,
            views,
            loadAvlTreeIndexes
        );
    }

    public buildMethodDefinition<R>(call: PBCCallDelegate<R>, loadAvlTreeIndexes: number[] = []): PBCCallDefinition<R> {
        return {
            buildMultiCall: (callback: (value: R) => Promise<any>) => [ToMultiCall(call, callback), loadAvlTreeIndexes],
            executeCall: (chain: ChainDefinition, contractAddress: string) => {
                return this.pbcClient.call(
                    chain,
                    contractAddress,
                    call,
                    loadAvlTreeIndexes
                )
            }
        }
    }

    public send(chainDefinition: ChainDefinition, contractAddress: string, methodName: string, methodCallBuilder: (builder: FnRpcBuilder) => Buffer, gasCost: number): Promise<string> {
        if (!this.connectedWallet.isConnected) {
            throw new Error("Wallet not connected!");
        }
        if (this.connectedWallet.chain?.id !== chainDefinition.id) {
            throw new Error(`Wallet is connected to different chain! Expected: ${chainDefinition.name}, Connected to: ${this.connectedWallet.chain?.name}`);
        }

        return this.pbcClient.send(
            this.connectedWallet,
            contractAddress,
            methodName,
            methodCallBuilder,
            gasCost,
        );
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

    public callView<R>(view: (state: Record<string, ScValue>, trees: AvlTreeBuilderMap, namedTypes: Record<string, NamedTypeSpec>) => Promise<R>, loadAvlTreeIndexes?: number[]): Promise<R> {
        return this.contract.callView(this.chain, this.address, view, loadAvlTreeIndexes);
    }

    public multiCall(views: ((state: Record<string, ScValue>, trees: AvlTreeBuilderMap, namedTypes: Record<string, NamedTypeSpec>) => Promise<void>)[], loadAvlTreeIndexes?: number[]): Promise<void> {
        return this.contract.multiCall(
            this.chain,
            this.address,
            views,
            loadAvlTreeIndexes
        );
    }

    public startMultiCall(): PBCContractMultiCall<C> {
        return new PBCContractMultiCall(this);
    }

    public buildMethodDefinition<R>(call: PBCCallDelegate<R>, loadAvlTreeIndexes: number[] = []): PBCInstanceCallDefinition<R> {
        return {
            buildMultiCall: (callback: (value: R) => Promise<any>) => [ToMultiCall(call, callback), loadAvlTreeIndexes],
            executeCall: () => {
                return this.contract.buildMethodDefinition(
                    call,
                    loadAvlTreeIndexes
                ).executeCall(this.chain, this.address)
            }
        }
    }

    public send(methodName: string, methodCallBuilder: (builder: FnRpcBuilder) => Buffer, gasCost: number): Promise<string> {
        return this.contract.send(
            this.chain,
            this.address,
            methodName,
            methodCallBuilder,
            gasCost,
        );
    }
}
