import { Buffer } from 'buffer';
import { BaseClient, type ClientResponse } from './base-client.js';

export class AvlClient extends BaseClient {
    private readonly host: string;
    private readonly shards: string[];

    constructor(host: string, shards: string[]) {
        super();

        this.host = host;
        this.shards = shards;
    }

    public getContractState(address: string): Promise<ClientResponse<Buffer>> {
        return this.getRequest<Buffer>(this.contractStateQueryUrl(address) + '?stateOutput=binary');
    }

    public async getContractStateAvlValue(
        address: string,
        treeId: number,
        key: Buffer,
    ): Promise<ClientResponse<Buffer>> {
        const data: ClientResponse<{ data: string } | Buffer> = await this.getRequest<{ data: string }>(
            `${this.contractStateQueryUrl(address)}/avl/${treeId}/${key.toString('hex')}`,
        );

        if (data.code === 200 && data.data !== undefined) {
            data.data = Buffer.from((data.data as { data: string }).data, 'base64');
        }

        return data as ClientResponse<Buffer>;
    }

    public async getContractStateAvlSize(
        address: string,
        treeId: number,
    ): Promise<ClientResponse<number>> {
        const data: ClientResponse<{ size: number } | number> = await this.getRequest<{ size: number }>(
            `${this.contractStateQueryUrl(address)}/avl/${treeId}`,
        );

        if (data.code === 200 && data.data !== undefined) {
            data.data = (data.data as { size: number }).size;
        }

        return data as ClientResponse<number>;
    }

    public getContractStateAvlNextN(
        address: string,
        treeId: number,
        key: Buffer | undefined,
        n: number,
    ): Promise<ClientResponse<Array<Record<string, string>>>> {
        if (key === undefined) {
            return this.getRequest<Array<Record<string, string>>>(
                `${this.contractStateQueryUrl(address)}/avl/${treeId}/next?n=${n}`,
            );
        } else {
            return this.getRequest<Array<Record<string, string>>>(
                `${this.contractStateQueryUrl(address)}/avl/${treeId}/next/${key.toString('hex')}?n=${n}`,
            );
        }
    }

    private contractStateQueryUrl(address: string): string {
        return `${this.host}/shards/${this.shardForAddress(address)}/blockchain/contracts/${address}`;
    }

    private shardForAddress(address: string): string {
        const numOfShards = this.shards.length;
        const buffer = Buffer.from(address, 'hex');
        const shardIndex = Math.abs(buffer.readInt32BE(17)) % numOfShards;
        return this.shards[shardIndex];
    }
}
