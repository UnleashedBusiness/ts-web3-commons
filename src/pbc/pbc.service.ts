import {StructTypeSpec} from "@partisiablockchain/abi-client/target/main/types/StructTypeSpec.js";
import {NamedTypeSpec, type TypeSpec} from "@partisiablockchain/abi-client/target/main/types/Abi.js";
import type {ChainDefinition} from "./pbc.chains.js";
import {AbiParser, FnRpcBuilder, type ScValue, StateReader} from "@partisiablockchain/abi-client";
import type {AvlTreeBuilderMap} from "./utils/avl-tree.utils.js";
import {ShardedClient} from "./client/sharded-client.js";
import type {DefaultContractSerialization} from "./dto/contract-data.dto.js";
import type {ConnectedWalletInterface} from "./wallet-connection/connected-wallet.interface.js";
import {TransactionClient} from "./client/transaction-client.js";
import type {FailureCause} from "./dto/transaction-data.dto.js";
import {AvlClient} from "./client/avl-client.js";
import type {PBCCallDelegate} from "./pbc.types.js";
import {Buffer} from "buffer";

export class PartisiaBlockchainService {
    constructor() {
    }

    public async call<R>(chainDefinition: ChainDefinition, contractAddress: string, view: PBCCallDelegate<R>, loadAvlTreeIndexes: number[] = []): Promise<R> {
        return this.fetchContractState(chainDefinition, contractAddress, loadAvlTreeIndexes).then(
            args => view(...args)
        );
    }

    public async callMulti(chainDefinition: ChainDefinition, contractAddress: string, views: ((state: Record<string, ScValue>, trees: AvlTreeBuilderMap, namedTypes: Record<string, NamedTypeSpec>) => Promise<void>)[], loadAvlTreeIndexes: number[] = []): Promise<void> {
        await this.fetchContractState(chainDefinition, contractAddress, loadAvlTreeIndexes).then(
            args => Promise.all(views.map(x => x(...args)))
        );
    }

    public async fetchAVLTreeValueByKey<R>(chainDefinition: ChainDefinition, contractAddress: string, treeId: number, key: Buffer, view: (valueReader: StateReader, namedTypes: Record<string, NamedTypeSpec>) => R): Promise<R | undefined> {
        const avlClient = new AvlClient(
            chainDefinition.rpcList[0],
            chainDefinition.shards,
        );
        const client = new ShardedClient(
            chainDefinition.rpcList[0],
            chainDefinition.shards,
        );

        let data = await client.getContractData<DefaultContractSerialization>(contractAddress, true, false);
        let state_abi = new AbiParser(Buffer.from(data!.abi, 'base64')).parseAbi();
        let isZk = typeof (data!.serializedContract as any)["attestations"] !== 'undefined';
        let contractState = (isZk ? (data!.serializedContract as any).openState : data!.serializedContract);
        let reader = new StateReader(Buffer.from(contractState, "base64"), state_abi.contract);

        let namedTypes: any = {};
        //@ts-ignore
        for (let type of reader.namedTypes) {
            namedTypes[type.name] = type;
        }
        let value = await avlClient.getContractStateAvlValue(contractAddress, treeId, key);

        return value !== undefined ? view(new StateReader(value, state_abi.contract), namedTypes) : value;
    }

    public async send(connectedWallet: ConnectedWalletInterface, contractAddress: string, methodName: string, methodCallBuilder: (builder: FnRpcBuilder) => Buffer, gasCost: number): Promise<string> {
        if (connectedWallet === undefined || connectedWallet.chain === undefined) {
            throw new Error("connected wallet must be provided for execution of transactions!");
        }

        const chainDefinition = connectedWallet.chain!;
        const client = new ShardedClient(
            chainDefinition.rpcList[0],
            chainDefinition.shards,
        );

        const transactionClient = new TransactionClient(client, connectedWallet);
        let data = await client.getContractData<DefaultContractSerialization>(contractAddress, false, false);

        let contract_abi = new AbiParser(Buffer.from(data!.abi, 'base64')).parseAbi();
        const methodCallDataBuilder = new FnRpcBuilder(methodName, contract_abi.contract);

        const transactionResult = await transactionClient.sendTransactionAndWait(
            contractAddress,
            methodCallBuilder(methodCallDataBuilder),
            gasCost,
        );

        // @ts-ignore
        const transaction = await client.getExecutedTransaction(transactionResult['shard'], transactionResult.transactionHash);
        let failureReason: FailureCause | undefined = undefined;
        if (transaction === undefined) {
            failureReason = {
                errorMessage: `Transaction ${transactionResult.transactionHash} was not found after execution!`,
                stackTrace: ""
            };
        } else if (!transaction.executionSucceeded) {
            failureReason = transaction.failureCause;
        }

        if (failureReason === undefined) {
            let event = transaction!.events.pop();
            while (event !== undefined && failureReason === undefined) {
                const eventTxn = await client.getExecutedTransaction(event['destinationShard'], event.identifier);
                if (eventTxn === undefined) {
                    failureReason = {
                        errorMessage: `Event ${event.identifier} was not found after execution!`,
                        stackTrace: ""
                    };
                } else if (!eventTxn.executionSucceeded) {
                    failureReason = eventTxn.failureCause;
                }

                event = eventTxn!.events.pop()
            }
        }

        if (failureReason !== undefined) {
            throw new Error(`Transaction failed! Hash ${transactionResult.transactionHash}, Reason ${failureReason!.errorMessage}, ${failureReason!.stackTrace}`);
        }

        return transactionResult.transactionHash;
    }

    private async fetchContractState(chainDefinition: ChainDefinition, contractAddress: string, loadAvlTreeIndexes: number[] = []): Promise<[Record<string, ScValue>, AvlTreeBuilderMap, any]> {
        const client = new ShardedClient(
            chainDefinition.rpcList[0],
            chainDefinition.shards,
        );

        let data = await client.getContractData<DefaultContractSerialization>(contractAddress, true, false);
        let state_abi = new AbiParser(Buffer.from(data!.abi, 'base64')).parseAbi();
        let isZk = typeof (data!.serializedContract as any)["attestations"] !== 'undefined';
        let contractState = (isZk ? (data!.serializedContract as any).openState : data!.serializedContract);
        let reader = new StateReader(Buffer.from(contractState, "base64"), state_abi.contract);
        let state = reader.readState();

        let namedTypes: any = {};
        //@ts-ignore
        for (let type of reader.namedTypes) {
            namedTypes[type.name] = type;
        }

        let loadedTrees: AvlTreeBuilderMap = {};
        for (let treeId of loadAvlTreeIndexes) {
            loadedTrees[treeId] = <R>(valueType: StructTypeSpec | TypeSpec, isNamedValue: boolean, view: (value: ScValue) => R) => {
                return {
                    getByKey: async (key: Buffer) => {
                        const value = await this.fetchAVLTreeValueByKey<R>(chainDefinition, contractAddress, treeId, key, (valueReader) => {
                            const value = isNamedValue ? valueReader.readStruct(valueType as StructTypeSpec) : valueReader.readGeneric(valueType as TypeSpec);

                            return view(value);
                        });

                        return value as R;
                    }
                }
            }
        }

        return [Object.fromEntries(state.fieldsMap) as Record<string, ScValue>, loadedTrees, namedTypes];
    }
}