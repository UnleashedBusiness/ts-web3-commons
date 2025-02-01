import type {ConnectedWalletInterface} from "./connected-wallet.interface.js";
import type {ShardedClient, ShardPutTransactionResponse} from "../client/sharded-client.js";
import type {Rpc, TransactionPayload} from "../dto/transaction-data.dto.js";
import {TransactionSerializer} from "../utils/transaction.serializer.js";
import PartisiaSdk from "partisia-blockchain-applications-sdk";
import type {ISdkConnection} from "partisia-blockchain-applications-sdk/lib/sdk.js";
import {EmptyPBCAddress} from "../pbc.chains.js";
import {PermissionTypes} from "partisia-blockchain-applications-sdk/lib/sdk-listeners.js";
import {TransactionClient} from "../client/transaction-client.js";


export class MpcWalletConnectedWallet implements ConnectedWalletInterface {
    private readonly transactionSerializer: TransactionSerializer = new TransactionSerializer();
    // @ts-ignore
    private partisiaSdk?: PartisiaSdk;
    private connection?: ISdkConnection;

    constructor() {
    }

    get address(): string {
        return this.connection?.account.address ?? EmptyPBCAddress
    }

    public async connect(): Promise<void> {
        // @ts-ignore
        this.partisiaSdk = new PartisiaSdk();
        this.partisiaSdk!.connect({
            permissions: [PermissionTypes.SIGN],
            dappName: "",
            chainId: ""
        })

        this.connection = this.partisiaSdk.connection;
        if (this.connection === null) {
            this.connection = undefined;
        }
    }

    public async disconnect(): Promise<void> {
        this.connection = undefined;
    }

    public async signAndSendTransaction(client: ShardedClient, payload: TransactionPayload<Rpc>, cost: string | number | undefined = 0): Promise<ShardPutTransactionResponse> {
        return client.getAccountData(this.address).then(async (accountData) => {
            if (accountData == null) {
                throw new Error("Account data was null");
            }
            // Account data was fetched, build and serialize the transaction
            // data.
            const serializedTx = this.transactionSerializer.serialize(
                {
                    cost: String(cost),
                    nonce: accountData.nonce,
                    validTo: String(new Date().getTime() + TransactionClient.TRANSACTION_TTL),
                },
                payload
            );
            // Ask the MPC wallet to sign and send the transaction.
            try {
                const value_1 = await this.partisiaSdk!
                    .signMessage({
                        payload: serializedTx.toString("hex"),
                        payloadType: "hex",
                        dontBroadcast: false,
                    });
                return {
                    putSuccessful: true,
                    shard: client.shardForAddress(this.address),
                    transactionHash: value_1.trxHash,
                };
            } catch {
                return ({
                    putSuccessful: false,
                });
            }
        });

    }
}