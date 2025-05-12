import type {ChainDefinition} from "./pbc.chains.js";
import {AbiParser, RpcBuilder, type ScValue, StateReader, NamedTypeSpec} from "@partisiablockchain/abi-client";
import {ShardedClient} from "./client/sharded-client.js";
import type {DefaultContractSerialization} from "./dto/contract-data.dto.js";
import type {ConnectedWalletInterface} from "./wallet-connection/connected-wallet.interface.js";
import {TransactionClient} from "./client/transaction-client.js";
import type {FailureCause} from "./dto/transaction-data.dto.js";
import type {PBCCallDelegate} from "./pbc.types.js";
import {Buffer} from "buffer";
import {AvlTreeReader, type AvlTreeReaderBuilder} from "./utils/avl-tree.utils.js";

export class PartisiaBlockchainService {
    constructor() {
    }

    public async call<R>(chainDefinition: ChainDefinition, contractAddress: string, view: PBCCallDelegate<R>, loadState: boolean, loadAvlTreeIndexes: number[] = []): Promise<R> {
        return this.fetchContractState(chainDefinition, contractAddress, loadState, loadAvlTreeIndexes).then(
            args => view(...args)
        );
    }

    public async callMulti(chainDefinition: ChainDefinition, contractAddress: string, views: ((state: Record<string, ScValue> | undefined, trees: Record<number, AvlTreeReaderBuilder>, namedTypes: Record<string, NamedTypeSpec & {typeIndex: number}>) => Promise<void>)[], loadState:boolean, loadAvlTreeIndexes: number[] = []): Promise<void> {
        await this.fetchContractState(chainDefinition, contractAddress, loadState, loadAvlTreeIndexes).then(
            args => Promise.all(views.map(x => x(...args)))
        );
    }

    public async send(connectedWallet: ConnectedWalletInterface, contractAddress: string, methodName: string, methodCallBuilder: (builder: RpcBuilder) => Buffer, gasCost: number): Promise<string> {
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
        const methodCallDataBuilder = new RpcBuilder(contract_abi.contract(), methodName);

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

    private async fetchContractState(chainDefinition: ChainDefinition, contractAddress: string, loadState: boolean, loadAvlTreeIndexes: number[] = []): Promise<[Record<string, ScValue> | undefined, Record<number, AvlTreeReaderBuilder>, Record<string, NamedTypeSpec & {typeIndex: number}>]> {
        const client = new ShardedClient(
            chainDefinition.rpcList[0],
            chainDefinition.shards,
        );

        let data = await client.getContractData<string>(contractAddress, false, false);
        let state_abi = new AbiParser(Buffer.from(data!.abi, 'base64')).parseAbi();

        let state = undefined;
        let namedTypes: Record<string, NamedTypeSpec & {typeIndex: number}> = {};
        if (loadState) {
            if (data!.type === "SYSTEM") {
                let stateData = await client.getContractData<string>(contractAddress, true, false);
                let reader = StateReader.create(Buffer.from(stateData!.serializedContract, "base64"), state_abi.contract());
                state = reader.readState();
            } else {
                const stateString = await client.getContractStateTraverse(contractAddress);
                let reader = StateReader.create(Buffer.from(stateString!.data, "base64"), state_abi.contract());
                state = reader.readState();
            }
        }

        for (let [typeIndex, type] of state_abi.contract().namedTypes.entries()) {
            namedTypes[type.name] = {typeIndex, ...type};
        }

        let loadedTrees: Record<number, AvlTreeReaderBuilder> = {};
        for (let treeId of loadAvlTreeIndexes) {
            loadedTrees[treeId] = (isNamedValue, keyType, valueType, keyConverter, valueConverter) => {
                return new AvlTreeReader(
                    chainDefinition, contractAddress, state_abi.contract(), treeId, isNamedValue, keyType, valueType, keyConverter, valueConverter
                );
            }
        }

        return [state !== undefined ? Object.fromEntries(state.fieldsMap) as Record<string, ScValue> : undefined, loadedTrees, namedTypes];
    }
}