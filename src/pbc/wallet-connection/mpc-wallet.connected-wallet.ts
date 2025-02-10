import type {ConnectedWalletInterface} from "./connected-wallet.interface.js";
import type {ShardedClient, ShardPutTransactionResponse} from "../client/sharded-client.js";
import type {Rpc, TransactionPayload} from "../dto/transaction-data.dto.js";
import {TransactionSerializer} from "../utils/transaction.serializer.js";
import {type ChainDefinition, EmptyPBCAddress, PBCChain} from "../pbc.chains.js";
import {TransactionClient} from "../client/transaction-client.js";
import {type ISdkConnection, PartisiaSdk} from "./mpc-wallet/sdk.js";
import {PermissionTypes} from "./mpc-wallet/sdk-listeners.js";
import {Buffer} from "buffer";

export interface MPCWalletAutoConnectParameters {
    connection?: ISdkConnection,
    seed?: Buffer
}

export class MpcWalletConnectedWallet implements ConnectedWalletInterface {

    private readonly transactionSerializer: TransactionSerializer = new TransactionSerializer();
    // @ts-ignore
    private partisiaSdk?: PartisiaSdk;
    private connection?: ISdkConnection;

    private readonly _autoConnectParameters: Record<number, MPCWalletAutoConnectParameters>;

    get autoConnectParameters(): Record<number, MPCWalletAutoConnectParameters> {
        return this._autoConnectParameters;
    }

    constructor(
        private readonly dappName: string,
        _autoConnectParameters: Record<number, MPCWalletAutoConnectParameters>
    ) {
        this._autoConnectParameters = _autoConnectParameters;
    }

    get address(): string {
        return this.connection?.account.address ?? EmptyPBCAddress
    }

    public async connect(chain: ChainDefinition): Promise<void> {
        // @ts-ignore
        this.partisiaSdk = new PartisiaSdk(this._autoConnectParameters[chain.id]);
        if (!this.partisiaSdk.isConnected) {
            await this.partisiaSdk!.connect({
                permissions: [PermissionTypes.SIGN],
                dappName: this.dappName,
                chainId: chain.id === PBCChain.TESTNET.id ? "Partisia Blockchain Testnet" : "Partisia Blockchain"
            })
        }

        this.connection = this.partisiaSdk.connection;
        if (this.connection === null) {
            this.connection = undefined;
        } else {
            this._autoConnectParameters[chain.id] = {seed: Buffer.from(this.partisiaSdk.seed, "hex"), connection: this.connection}
        }
    }

    public async disconnect(): Promise<void> {
        this.connection = undefined;
    }

    public async signAndSendTransaction(client: ShardedClient, payload: TransactionPayload<Rpc>, cost: string | number | undefined = 0): Promise<ShardPutTransactionResponse> {
        return client.getAccountData(this.address).then(async (accountData: any) => {
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
