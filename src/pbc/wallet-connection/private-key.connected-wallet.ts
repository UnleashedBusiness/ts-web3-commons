import {ec} from "elliptic";
import KeyPair = ec.KeyPair;
import type {ConnectedWalletInterface} from "./connected-wallet.interface.js";
import type {ShardedClient, ShardPutTransactionResponse} from "../client/sharded-client.js";
import type {Rpc, TransactionPayload} from "../dto/transaction-data.dto.js";
import {TransactionSerializer} from "../utils/transaction.serializer.js";
import {TransactionClient} from "../client/transaction-client.js";
import {BigEndianByteOutput} from "@secata-public/bitmanipulation-ts";
import {CryptoUtils} from "@partisiablockchain/zk-client";
import type {ChainDefinition} from "../pbc.chains.js";

export class PrivateKeyConnectedWallet implements ConnectedWalletInterface {
    private readonly transactionSerializer: TransactionSerializer = new TransactionSerializer();

    constructor(
        public readonly address: string,
        public readonly keyPair: KeyPair,
    ) {
    }

    async connect(_: ChainDefinition): Promise<void> {
        // ignored
    }

    async disconnect(): Promise<void> {
        // ignored
    }

    public async signAndSendTransaction(client: ShardedClient, payload: TransactionPayload<Rpc>, cost: string | number | undefined = 0): Promise<ShardPutTransactionResponse> {
        let accountData = await client.getAccountData(this.address);
        if (accountData == null) {
            throw new Error("Account data was null");
        }

        const serializedTx = this.transactionSerializer.serialize(
            {
                cost: String(cost),
                nonce: accountData.nonce,
                validTo: String(new Date().getTime() + TransactionClient.TRANSACTION_TTL),
            },
            payload
        );
        const hash = CryptoUtils.hashBuffers([
            serializedTx,
            BigEndianByteOutput.serialize((out) => out.writeString("Partisia Blockchain Testnet")),
        ]);
        const signature = this.keyPair.sign(hash);
        const signatureBuffer = CryptoUtils.signatureToBuffer(signature);

        const transactionPayload = Buffer.concat([signatureBuffer, serializedTx]);
        let txPointer = await client.putTransaction(transactionPayload);
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