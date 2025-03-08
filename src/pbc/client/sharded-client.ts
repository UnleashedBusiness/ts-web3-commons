import type {
    PutTransactionWasUnsuccessful,
    ShardId,
    PutTransactionWasSuccessful,
    ExecutedTransactionDto, TransactionPointer
} from "../dto/transaction-data.dto.js";
import {HttpClient} from "./http-client.js";
import type {AccountData} from "../dto/account-data.dto.js";
import type {ContractCore, ContractData} from "../dto/contract-data.dto.js";
import {BaseClient} from "./base-client.js";

export interface ShardSuccessfulTransactionResponse extends PutTransactionWasSuccessful {
    shard: ShardId;
}

export type ShardPutTransactionResponse =
    | ShardSuccessfulTransactionResponse
    | PutTransactionWasUnsuccessful;

/**
 * Web client that can handle the sending requests to the correct shard of PBC.
 */
export class ShardedClient extends BaseClient {
    private readonly masterClient: HttpClient;
    private readonly shardClients: { [key: string]: HttpClient };
    private readonly shards: string[];
    private readonly baseUrl: string;

    constructor(baseUrl: string, shards: string[]) {
        super();

        this.baseUrl = baseUrl;
        this.shards = shards;
        this.masterClient = new HttpClient(baseUrl);
        this.shardClients = {};
        for (const shard of shards) {
            this.shardClients[shard] = new HttpClient(baseUrl + "/shards/" + shard);
        }
    }

    public getClient(shardId: ShardId): HttpClient {
        if (shardId == null || this.shards.length === 0) {
            return this.masterClient;
        } else {
            return this.shardClients[shardId];
        }
    }

    public shardForAddress(address: string): string | null {
        if (this.shards.length === 0) {
            return null;
        } else {
            const buffer = Buffer.from(address, "hex");
            const shardIndex = Math.abs(buffer.readInt32BE(17)) % this.shards.length;
            return this.shards[shardIndex];
        }
    }

    public getAccountData(address: string): Promise<AccountData | undefined> {
        return this.clientForAddress(address).getAccountData(address);
    }

    public getContractData<T>(
        address: string,
        withState: boolean,
        withTrees: boolean
    ): Promise<ContractData<T> | undefined>;
    public getContractData<T>(
        address: string,
        withState: boolean,
        withTrees: boolean = false
    ): Promise<ContractData<T> | ContractCore | undefined> {
        const requireState = withState === undefined || withState;

        return this.clientForAddress(address).getContractData(address, requireState, withTrees);
    }

    public getExecutedTransaction(
        shard: ShardId,
        identifier: string,
        requireFinal?: boolean
    ): Promise<ExecutedTransactionDto | undefined> {
        return this.getClient(shard).getExecutedTransaction(identifier, requireFinal);
    }

    public putTransaction(transaction: Buffer): Promise<TransactionPointer | undefined> {
        const byteJson = { payload: transaction.toString("base64") };
        return this.putRequest(this.baseUrl + "/chain/transactions", byteJson);
    }

    private clientForAddress(address: string) {
        return this.getClient(this.shardForAddress(address));
    }
}