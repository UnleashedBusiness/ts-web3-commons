import type {ShardedClient, ShardPutTransactionResponse} from "../client/sharded-client.js";
import type {Rpc, TransactionPayload} from "../dto/transaction-data.dto.js";

/**
 * Unified interface for connected MPC wallets.
 *
 * These wallets are capable of reporting their address and can sign and send
 * a transaction.
 */
export interface ConnectedWalletInterface {
  /**
   * The address that transactions will be sent from.
   */
  readonly address: string;
  /**
   * Method to sign and send a transaction to the blockchain.
   */
  readonly signAndSendTransaction: (
    client: ShardedClient,
    payload: TransactionPayload<Rpc>,
    cost?: string | number
  ) => Promise<ShardPutTransactionResponse>;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
