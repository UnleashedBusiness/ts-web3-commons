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

export class PartisiaBlockchainService {
    constructor(
        private readonly connectedWallet: ConnectedWalletInterface | undefined,
    ) {
    }

    public async call<R>(chainDefinition: ChainDefinition, abi_content: string, contractAddress: string, view: (state: Record<string, ScValue>, trees: AvlTreeBuilderMap, namedTypes: Record<string, NamedTypeSpec>) => R, loadAvlTreeIndexes: number[] = []): Promise<R> {
        const client = new ShardedClient(
            chainDefinition.rpcList[0],
            chainDefinition.shards,
        );

        let data = await client.getContractData<DefaultContractSerialization>(contractAddress, true);
        let state_abi = new AbiParser(Buffer.from(abi_content, 'base64')).parseAbi();
        let isZk = typeof (data!.serializedContract as any)["attestations"] !== 'undefined';
        let contractState = (isZk ? (data!.serializedContract as any).openState.openState : data!.serializedContract.state).data;
        let reader = new StateReader(Buffer.from(contractState, "base64"), state_abi.contract);
        let state = reader.readState();

        let namedTypes: any = {};
        //@ts-ignore
        for (let type of reader.namedTypes) {
            namedTypes[type.name] = type;
        }
        //@ts-ignore
        //console.log(reader.namedTypes.filter(x => x.name === "Attested").pop());

        let loadedTrees: AvlTreeBuilderMap = {};
        let treesIndexed = (isZk ? (data!.serializedContract as any).openState : data!.serializedContract).avlTrees;

        for (let index of loadAvlTreeIndexes) {
            let serializedTree = treesIndexed[index].value.avlTree;
            // @ts-ignore
            loadedTrees[index] = (keySpec: TypeSpec, valueType: TypeSpec | StructTypeSpec, isNamedValue: boolean) => {
                let deserializedTree: { key: ScValue, value: ScValue }[] = [];
                for (let kvPair of serializedTree) {
                    const key = new StateReader(Buffer.from(kvPair.key.data.data, "base64"), state_abi.contract).readGeneric(keySpec);
                    const valueReader = new StateReader(Buffer.from(kvPair.value.data, "base64"), state_abi.contract);

                    deserializedTree.push({key, value: isNamedValue ? valueReader.readStruct(valueType as StructTypeSpec) : valueReader.readGeneric(valueType as TypeSpec)});
                }
                return deserializedTree;
            };
        }

        return view(Object.fromEntries(state.fieldsMap) as Record<string, ScValue>, loadedTrees, namedTypes);
    }

    public async fetchAVLTreeValueByKey<R>(chainDefinition: ChainDefinition, abi_content: string, contractAddress: string, treeId: number, key: Buffer, view: (value: Buffer, namedTypes: Record<string, NamedTypeSpec>) => R): Promise<R | undefined> {
        const avlClient = new AvlClient(
            chainDefinition.rpcList[0],
            chainDefinition.shards,
        );
        const client = new ShardedClient(
            chainDefinition.rpcList[0],
            chainDefinition.shards,
        );

        let data = await client.getContractData<DefaultContractSerialization>(contractAddress, true);
        let state_abi = new AbiParser(Buffer.from(abi_content, 'base64')).parseAbi();
        let isZk = typeof (data!.serializedContract as any)["attestations"] !== 'undefined';
        let contractState = (isZk ? (data!.serializedContract as any).openState.openState : data!.serializedContract.state).data;
        let reader = new StateReader(Buffer.from(contractState, "base64"), state_abi.contract);

        let namedTypes: any = {};
        //@ts-ignore
        for (let type of reader.namedTypes) {
            namedTypes[type.name] = type;
        }
        let value = await avlClient.getContractStateAvlValue(contractAddress, treeId, key);

        return value !== undefined ? view(value, namedTypes) : value;
    }

    public async send(chainDefinition: ChainDefinition, abi_content: string, contractAddress: string, methodName: string, methodCallBuilder: (builder: FnRpcBuilder) => Buffer, gasCost: number): Promise<string> {
        if (this.connectedWallet === undefined) {
            throw new Error("connected wallet must be provided for execution of transactions!");
        }

        const client = new ShardedClient(
            chainDefinition.rpcList[0],
            chainDefinition.shards,
        );

        const transactionClient = new TransactionClient(
            client,
            this.connectedWallet,
            () => {
            },
        );

        let contract_abi = new AbiParser(Buffer.from(abi_content, 'base64')).parseAbi();
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
}