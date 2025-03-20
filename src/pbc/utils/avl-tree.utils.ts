import type {TypeSpec} from "@partisiablockchain/abi-client/target/main/types/Abi.js";
import type {StructTypeSpec} from "@partisiablockchain/abi-client/target/main/types/StructTypeSpec.js";
import {Buffer} from "buffer";
import {BN, ContractAbi, type ScValue, StateReader} from "@partisiablockchain/abi-client";
import type {ChainDefinition} from "../pbc.chains.js";
import {AvlClient} from "../client/avl-client.js";

export interface AvlTreeKey {
    toBuffer(): Buffer;
}

export class AvlTreeReader<K extends AvlTreeKey, V> {
    private readonly client: AvlClient;

    public constructor(
        chainDefinition: ChainDefinition,
        private readonly contractAddress: string,
        private readonly contractAbi: ContractAbi,
        private readonly treeId: number,
        private readonly isNamedValue: boolean,
        private readonly keyType: TypeSpec,
        private readonly valueType: TypeSpec | StructTypeSpec,
        private readonly keyConverter: (valueRaw: ScValue) => K,
        private readonly valueConverter: (valueRaw: ScValue) => V
    ) {
        this.client = new AvlClient(chainDefinition.rpcList[0], chainDefinition.shards);
    }

    public async get(key: K): Promise<V | undefined> {
        let valueBuffer = await this.client.getContractStateAvlValue(this.contractAddress, this.treeId, key.toBuffer());
        if (valueBuffer === undefined) return undefined;

        return this.convertBufferValueInternal(valueBuffer);
    }

    public async first(count: number): Promise<{key: K, value: V}[]> {
        let values = await this.client.getContractStateAvlNextN(this.contractAddress, this.treeId, undefined, count);

        return this.convertValueRecordArray(values ?? []);
    }

    public async next(from: K, count: number): Promise<{key: K, value: V}[]> {
        let values = await this.client.getContractStateAvlNextN(this.contractAddress, this.treeId, from.toBuffer(), count);

        return this.convertValueRecordArray(values ?? []);
    }

    public async all(): Promise<{key: K, value: V}[]> {
        let size = await this.client.getContractStateAvlSize(this.contractAddress, this.treeId);
        if (size === undefined) return [];

        let values = await this.client.getContractStateAvlNextN(this.contractAddress, this.treeId, undefined, size);

        return this.convertValueRecordArray(values ?? []);
    }

    private convertBase64ValueInternal(valueBase64: string): V | undefined {
        return this.convertBufferValueInternal(Buffer.from(valueBase64, "base64"));
    }

    private convertBufferValueInternal(valueBuffer: Buffer): V | undefined {
        let stateReader = new StateReader(valueBuffer, this.contractAbi);

        return this.convertStateReaderValueInternal(stateReader);
    }

    private convertStateReaderValueInternal(reader: StateReader): V | undefined {
        let valueRaw = this.isNamedValue ? reader.readStruct(this.valueType as StructTypeSpec) : reader.readGeneric(this.valueType as TypeSpec);

        return valueRaw !== undefined ? this.valueConverter(valueRaw) : undefined;
    }

    private convertKeyInternal(keyBase64: string): K {
        const keyRaw = new StateReader(Buffer.from(keyBase64, "base64"), this.contractAbi).readGeneric(this.keyType);

        return this.keyConverter(keyRaw);
    }

    private convertValueRecordArray(values: Record<string, string>[]): {key: K, value: V}[] {
        return (values ?? []).reduce((newList, currentValue) => {
            const key = this.convertKeyInternal(Object.keys(currentValue)[0]);
            const value = this.convertBase64ValueInternal(Object.values(currentValue)[0]);

            newList.push({key, value: value!});
            return newList;
        }, [] as {key: K, value: V}[]);
    }
}

export type AvlTreeReaderBuilder = <K extends AvlTreeKey, V>(
    isNamedValue: boolean,
    keyType: TypeSpec,
    valueType: TypeSpec | StructTypeSpec,
    keyConverter: (valueRaw: ScValue) => K,
    valueConverter: (valueRaw: ScValue) => V
) => AvlTreeReader<K, V>;

export class AvlTreeBNKey implements AvlTreeKey{
    constructor(
        public readonly value: BN,
        public readonly size: number
    ) {
    }

    toBuffer(): Buffer {
        return this.value.toBuffer("le", this.size);
    }
}