import type {ConnectedWalletInterface} from "../wallet-connection/connected-wallet.interface.js";
import type {ShardedClient} from "./sharded-client.js";
import type {PutTransactionWasSuccessful, ShardId} from "../dto/transaction-data.dto.js";

/**
 * Error raised when a transaction failed to execute on the blockchain.
 */
export class TransactionFailedError extends Error {
  public readonly putTransaction: PutTransactionWasSuccessful;

  constructor(message: string, putTransaction: PutTransactionWasSuccessful) {
    super(message);
    this.name = this.constructor.name;
    this.putTransaction = putTransaction;
  }
}

/**
 * API for sending transactions to PBC.
 * The API uses a connected user wallet, to sign and send the transaction.
 * If the transaction was successful it calls a provided function to update the contract state in
 * the UI.
 */
export class TransactionClient {
  public static readonly TRANSACTION_TTL: number = 300_000;
  private static readonly DELAY_BETWEEN_RETRIES = 1_000;

  private static readonly MAX_TRIES = TransactionClient.TRANSACTION_TTL / this.DELAY_BETWEEN_RETRIES;
  private readonly userWallet: ConnectedWalletInterface;
  private readonly client: ShardedClient;

  constructor(client: ShardedClient, userWallet: ConnectedWalletInterface) {
    this.userWallet = userWallet;
    this.client = client;
  }

  public async sendTransactionAndWait(
    address: string,
    rpc: Buffer,
    gasCost: number
  ): Promise<PutTransactionWasSuccessful> {
    const putResponse = await this.userWallet.signAndSendTransaction(
      {
        rpc,
        address,
      },
      gasCost
    );

    if (!putResponse.putSuccessful) {
      throw new Error("Blockchain refused transaction. Do you have enough gas?");
    }

    await this.waitForTransaction(
      putResponse.shard,
      putResponse.transactionHash,
      putResponse as PutTransactionWasSuccessful
    );

    return putResponse as PutTransactionWasSuccessful;
  }

  private readonly delay = (millis: number): Promise<unknown> => {
    return new Promise((resolve) => setTimeout(resolve, millis));
  };

  private readonly waitForTransaction = async (
      shard: ShardId,
      identifier: string,
      originalTransaction: PutTransactionWasSuccessful,
      tryCount = 0
  ): Promise<void> => {
    let executedTransaction = await this.client.getExecutedTransaction(shard, identifier);
    
    if (executedTransaction.code !== 200 || !executedTransaction.data) {
      if (tryCount >= TransactionClient.MAX_TRIES) {
        throw new TransactionFailedError(
            'Transaction "' + identifier + '" not finalized at shard "' + shard + '"',
            originalTransaction
        );
      } else {
        await this.delay(TransactionClient.DELAY_BETWEEN_RETRIES);
        return await this.waitForTransaction(shard, identifier, originalTransaction, tryCount + 1);
      }
    } else if (!executedTransaction.data.executionSucceeded) {
      throw new TransactionFailedError(
          'Transaction "' + identifier + '" failed at shard "' + shard + '"',
          originalTransaction
      );
    } else {
      await Promise.all(
          executedTransaction.data.events.map((e) =>
              this.waitForTransaction(e.destinationShard, e.identifier, originalTransaction)
          )
      );
      return undefined;
    }
  };
}
