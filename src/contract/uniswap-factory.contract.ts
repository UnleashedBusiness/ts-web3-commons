import { BaseMultiChainContract } from "./base/base-multi-chain.contract";
import { UniswapFactoryAbi, UniswapFactoryAbiFunctional } from "../abi/uniswap-factory.abi";
import { BlockchainDefinition } from "../utils/chains";
import { Web3BatchRequest } from "web3-core";
import ContractToolkitService from "./utils/contract-toolkit.service";

export class UniswapFactoryContract extends BaseMultiChainContract<UniswapFactoryAbiFunctional> {
  constructor(toolkit: ContractToolkitService) {
    super(toolkit);
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
