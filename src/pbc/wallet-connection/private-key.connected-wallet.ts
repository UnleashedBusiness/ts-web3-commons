import type {ConnectedWalletInterface} from "./connected-wallet.interface.js";
import {ShardedClient, type ShardPutTransactionResponse} from "../client/sharded-client.js";
import type {Rpc, TransactionPayload} from "../dto/transaction-data.dto.js";
import {TransactionSerializer} from "../utils/transaction.serializer.js";
import {TransactionClient} from "../client/transaction-client.js";
import {BigEndianByteOutput} from "@secata-public/bitmanipulation-ts";
import {CryptoUtils} from "@partisiablockchain/zk-client";
import type {ChainDefinition} from "../pbc.chains.js";
import type {KeyPairSigner} from "./elliptic/interfaces.js";


export class PrivateKeyConnectedWallet implements ConnectedWalletInterface {
    private readonly transactionSerializer: TransactionSerializer = new TransactionSerializer();
    private _shardedClient?: ShardedClient;

    constructor(
        public readonly address: string,
        public readonly keyPair: KeyPairSigner,
        public readonly chain: ChainDefinition,
    ) {
    }

    get isConnected(): boolean {
        return this._shardedClient !== undefined;
    }

    async connect(): Promise<void> {
        this._shardedClient = new ShardedClient(this.chain.rpcList[0], this.chain.shards);
    }

    async disconnect(): Promise<void> {
        this._shardedClient = undefined;
    }

    public async signAndSendTransaction(payload: TransactionPayload<Rpc>, cost: string | number | undefined = 0): Promise<ShardPutTransactionResponse> {
        let accountData = await this._shardedClient!.getAccountData(this.address);
        if (accountData == null) {
            throw new Error("Account data was null");
        }

        const serializedTx = this.transactionSerializer.serialize(
            {
                cost: String(cost),
                nonce: accountData.nonce,
                validTo: String(new Date().getTime() + TransactionClient.TRANSACTION_TTL),
            },
            {
                contract: payload.address
            },
            payload.rpc
        );
        const hash = CryptoUtils.hashBuffers([
            serializedTx,
            BigEndianByteOutput.serialize((out) => out.writeString("Partisia Blockchain Testnet")),
        ]);
        const signature = this.keyPair.sign(hash);
        const signatureBuffer = CryptoUtils.signatureToBuffer(signature);

        const transactionPayload = Buffer.concat([signatureBuffer, serializedTx]);
        let txPointer = await this._shardedClient!.putTransaction(transactionPayload);
        if (txPointer != null) {
            return {
                putSuccessful: true,
                shard: txPointer.destinationShardId,
                transactionHash: txPointer.identifier,
            };
        } else {
            return {putSuccessful: false};
        }
    }
}