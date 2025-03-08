import {Buffer} from "buffer";
import {BaseClient} from "./base-client.js";

export class AvlClient extends BaseClient {
    private readonly host: string;
    private readonly shards: string[];

    constructor(host: string, shards: string[]) {
        super();

        this.host = host;
        this.shards = shards;
    }

    public getContractState(address: string): Promise<Buffer | undefined> {
        return this.getRequest<Buffer>(this.contractStateQueryUrl(address) + "?stateOutput=binary");
    }

    public async getContractStateAvlValue(
        address: string,
        treeId: number,
        key: Buffer
    ): Promise<Buffer | undefined> {
        console.log(`getContractStateAvlValue: ${this.contractStateQueryUrl(address)}/avl/${treeId}/${key.toString("hex")}`);
        const data = await this.getRequest<{ data: string }>(
            `${this.contractStateQueryUrl(address)}/avl/${treeId}/${key.toString("hex")}`
        );
        return data === undefined ? undefined : Buffer.from(data.data, "base64");
    }

    public getContractStateAvlNextN(
        address: string,
        treeId: number,
        key: Buffer | undefined,
        n: number
    ): Promise<Array<Record<string, string>> | undefined> {
        if (key === undefined) {
            return this.getRequest<Array<Record<string, string>>>(
                `${this.contractStateQueryUrl(address)}/avl/${treeId}/next?n=${n}`
            );
        } else {
            return this.getRequest<Array<Record<string, string>>>(
                `${this.contractStateQueryUrl(address)}/avl/${treeId}/next/${key.toString("hex")}?n=${n}`
            );
        }
    }

    private contractStateQueryUrl(address: string): string {
        return `${this.host}/shards/${this.shardForAddress(address)}/blockchain/contracts/${address}`;
    }

    private shardForAddress(address: string): string {
        const numOfShards = this.shards.length;
        const buffer = Buffer.from(address, "hex");
        const shardIndex = Math.abs(buffer.readInt32BE(17)) % numOfShards;
        return this.shards[shardIndex];
    }
}
