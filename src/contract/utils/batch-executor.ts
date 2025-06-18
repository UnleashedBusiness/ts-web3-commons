import { Web3 } from 'web3';
import {BatchRequest} from "./batch-request.js";
import type {BlockchainDefinition} from "../../utils/chains.js";
import type {ReadOnlyWeb3Connection} from "../../connection/interface/read-only-web3-connection.js";

export class BatchExecutor {
  private readonly batch: BatchRequest;
  private readonly connection: Web3;
  private readonly builders: Promise<any>[] = [];

  private constructor(config: BlockchainDefinition, web3Connection: ReadOnlyWeb3Connection) {
    this.connection = web3Connection.getWeb3ReadOnly(config);
    this.batch = new BatchRequest(this.connection);
  }

  public add(...builders: ((batch: BatchRequest) => Promise<any>)[]): BatchExecutor {
    this.builders.push(...builders.map(value => value(this.batch)));
    return this;
  }

  public async execute(config: { timeout: number; } = { timeout: 10_000 }): Promise<void> {
    await Promise.all(this.builders);

    await this.batch.execute(config);
  }

  public static new(config: BlockchainDefinition, web3Connection: ReadOnlyWeb3Connection): BatchExecutor {
    return new BatchExecutor(config, web3Connection);
  }
}