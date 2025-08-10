import type {TypeSpec} from "@partisiablockchain/abi-client";
import type {StructTypeSpec} from "@partisiablockchain/abi-client";
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
        let valueBufferResponse = await this.client.getContractStateAvlValue(this.contractAddress, this.treeId, key.toBuffer());
        if (valueBufferResponse.code === 404) return undefined;

        if (valueBufferResponse.code !== 200 || !valueBufferResponse.data) {
            throw new Error(`Could not fetch item from ${this.contractAddress} tree ${this.treeId} with key ${key.toBuffer().toString("hex")}! Code: ${valueBufferResponse.code}, Data: ${valueBufferResponse.data}`);
        }

        return this.convertBufferValueInternal(valueBufferResponse.data);
    }

    public async first(count: number): Promise<{key: K, value: V}[]> {
        let valuesResponse = await this.client.getContractStateAvlNextN(this.contractAddress, this.treeId, undefined, count);
        if (valuesResponse.code === 404) return [];

        if (valuesResponse.code !== 200 || !valuesResponse.data) {
            throw new Error(`Could not fetch first ${count} items from ${this.contractAddress} tree ${this.treeId}! Code: ${valuesResponse.code}, Data: ${valuesResponse.data}`);
        }

        return this.convertValueRecordArray(valuesResponse.data);
    }

    public async next(from: K, count: number): Promise<{key: K, value: V}[]> {
        let values = await this.client.getContractStateAvlNextN(this.contractAddress, this.treeId, from.toBuffer(), count);
        if (values.code === 404) return [];

        if (values.code !== 200 || !values.data) {
            throw new Error(`Could not fetch next ${count} items after ${from.toBuffer().toString("hex")} from ${this.contractAddress} tree ${this.treeId}! Code: ${values.code}, Data: ${values.data}`);
        }

        return this.convertValueRecordArray(values.data);
    }

    public async all(): Promise<{key: K, value: V}[]> {
        let size = await this.client.getContractStateAvlSize(this.contractAddress, this.treeId);
        if (size.code === 404) return [];

        if (size.code !== 200 || !size.data) {
            throw new Error(`Could not fetch size for ${this.contractAddress} tree ${this.treeId}! Code: ${size.code}, Data: ${size.data}`);
        }

        let values = await this.client.getContractStateAvlNextN(this.contractAddress, this.treeId, undefined, size.data);
        if (values.code === 404) return [];

        if (values.code !== 200 || !values.data) {
            throw new Error(`Could not fetch all items from ${this.contractAddress} tree ${this.treeId}! Code: ${values.code}, Data: ${values.data}`);
        }

        return this.convertValueRecordArray(values.data);
    }

    private convertBase64ValueInternal(valueBase64: string): V | undefined {
        return this.convertBufferValueInternal(Buffer.from(valueBase64, "base64"));
    }

    private convertBufferValueInternal(valueBuffer: Buffer): V | undefined {
        let stateReader = StateReader.create(valueBuffer, this.contractAbi);

        return this.convertStateReaderValueInternal(stateReader);
    }

    private convertStateReaderValueInternal(reader: StateReader): V | undefined {
        let valueRaw = this.isNamedValue ? reader.readStruct(this.valueType as StructTypeSpec) : reader.readGeneric(this.valueType as TypeSpec);

        return valueRaw !== undefined ? this.valueConverter(valueRaw) : undefined;
    }

    private convertKeyInternal(keyBase64: string): K {
        const keyRaw = StateReader.create(Buffer.from(keyBase64, "base64"), this.contractAbi).readGeneric(this.keyType);

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