import { BaseMultiChainContract } from "./base/base-multi-chain.contract";
import { UniswapPairAbi, UniswapPairAbiFunctional } from "../abi/uniswap-pair.abi";
import { BlockchainDefinition } from "../utils/chains";
import { Web3BatchRequest } from "web3-core";
import BigNumber from "bignumber.js";
import ContractToolkitService from "./utils/contract-toolkit.service";

export class UniswapPairContract extends BaseMultiChainContract<UniswapPairAbiFunctional> {
  constructor(toolkit: ContractToolkitService) {
    super(toolkit);
  }

  protected getAbi(): typeof UniswapPairAbi {
    return UniswapPairAbi;
  }

  //PROPERTIES
  public async getReserves(
    config: BlockchainDefinition,
    pairAddr: string,
    batch?: Web3BatchRequest,
    callback?: (output: {
      reserve0: BigNumber;
      reserve1: BigNumber;
      blockTimestampLast: number;
    }) => void,
  ) {
    return this.getViewMulti(
      config,
      pairAddr,
      (contract) => contract.methods.getReserves(),
      batch,
      callback,
    );
  }

  public async getToken0(
    config: BlockchainDefinition,
    pairAddr: string,
    batch?: Web3BatchRequest,
    callback?: (output: string) => void,
  ) {
    return this.getPropertyMulti(config, pairAddr, "token0", batch, callback);
  }

  public async getToken1(
    config: BlockchainDefinition,
    pairAddr: string,
    batch?: Web3BatchRequest,
    callback?: (output: string) => void,
  ) {
    return this.getPropertyMulti(config, pairAddr, "token1", batch, callback);
  }

  public weth(
    config: BlockchainDefinition,
    routerAddr: string,
    batch?: Web3BatchRequest,
    callback?: (output: string) => void,
  ) {
    return this.getPropertyMulti(config, routerAddr, "WETH", batch, callback);
  }
}
