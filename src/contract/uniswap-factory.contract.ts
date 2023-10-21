import { BaseMultiChainContract } from "./base/base-multi-chain.contract";
import { TransactionRunningHelperService } from "../utils/transaction-running-helper.service";
import { UniswapFactoryAbi } from "../abi/uniswap-factory.abi";
import { BlockchainDefinition } from "../utils/chains";
import { Web3BatchRequest } from "web3-core";
import { ReadOnlyWeb3Connection } from "../connection/interface/read-only-web3-connection";

export class UniswapFactoryContract extends BaseMultiChainContract<any> {
  constructor(
    web3Connection: ReadOnlyWeb3Connection,
    transactionHelper: TransactionRunningHelperService,
  ) {
    super(web3Connection, transactionHelper);
  }

  protected getAbi(): typeof UniswapFactoryAbi {
    return UniswapFactoryAbi;
  }

  //PROPERTIES
  public async getPair(
    config: BlockchainDefinition,
    factoryAddr: string,
    token0: string,
    token1: string,
    batch?: Web3BatchRequest,
    callback?: (output: string) => void,
  ) {
    return this.getViewMulti(
      config,
      factoryAddr,
      (contract) => contract.methods.getPair(token0, token1),
      batch,
      callback,
    );
  }
}
