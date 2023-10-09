import { BaseTokenAwareContract } from "./base/base-token-aware.contract";
import { Erc20TokenContract } from "./erc20-token.contract";
import { TransactionRunningHelperService } from "../utils/transaction-running-helper.service";
import { UniswapRouterAbi } from "../abi/uniswap-router.abi";
import { BlockchainDefinition } from "../utils/chains";
import { BigNumber } from "bignumber.js";
import { MethodRunnable } from "./base/base-multi-chain.contract";
import { Web3BatchRequest } from "web3-core";
import { ReadOnlyWeb3Connection } from "../connection/interface/read-only-web3-connection";

export class UniswapRouterContract extends BaseTokenAwareContract {
  constructor(
    token: Erc20TokenContract,
    web3Connection: ReadOnlyWeb3Connection,
    transactionHelper: TransactionRunningHelperService,
  ) {
    super(token, web3Connection, transactionHelper);
  }

  protected getAbi(): any {
    return UniswapRouterAbi;
  }

  //PROPERTIES
  public async getAmountsOut(
    config: BlockchainDefinition,
    routerAddr: string,
    path: string[],
    amountIn: string,
    batch?: Web3BatchRequest,
    callback?: (output: BigNumber) => void,
  ) {
    const amountInDivision = await this.tokenDivision(config, path[0]);
    const amountInBN = new BigNumber(amountIn)
      .multipliedBy(amountInDivision)
      .decimalPlaces(0);

    const division = await this.tokenDivision(config, path[path.length - 1]);
    const localResult = (await this.getViewMulti<number[]>(
      config,
      routerAddr,
      (contract) => contract.methods.getAmountsOut(amountInBN.toString(), path),
      batch,
      callback !== undefined
        ? (result: number[]) => {
            if (callback)
              callback(this.wrap(result[path.length - 1]).dividedBy(division));
          }
        : undefined,
    )) as number[];
    if (callback) return;
    else
      return this.wrap(localResult[path.length - 1] as number).dividedBy(
        division,
      );
  }

  public async getAmountsIn(
    config: BlockchainDefinition,
    routerAddr: string,
    path: string[],
    amountOut: string,
    batch?: Web3BatchRequest,
    callback?: (output: BigNumber) => void,
  ) {
    const amountOutDivision = await this.tokenDivision(
      config,
      path[path.length - 1],
    );
    const amountOutBN = new BigNumber(amountOut)
      .multipliedBy(amountOutDivision)
      .decimalPlaces(0);

    const division = await this.tokenDivision(config, path[0]);
    const localResult = (await this.getViewMulti<number[]>(
      config,
      routerAddr,
      (contract) => contract.methods.getAmountsIn(amountOutBN.toString(), path),
      batch,
      (result: number[]) => {
        if (callback) callback(this.wrap(result[0]).dividedBy(division));
      },
    )) as number[];
    if (callback) return;
    else return this.wrap(localResult[0] as number).dividedBy(division);
  }

  public factory(
    config: BlockchainDefinition,
    routerAddr: string,
    batch?: Web3BatchRequest,
    callback?: (output: string) => void,
  ) {
    return this.getPropertyMulti(
      config,
      routerAddr,
      "factory",
      batch,
      callback,
    );
  }

  public weth(
    config: BlockchainDefinition,
    routerAddr: string,
    batch?: Web3BatchRequest,
    callback?: (output: string) => void,
  ) {
    return this.getPropertyMulti(config, routerAddr, "WETH", batch, callback);
  }

  public async swapExactETHForTokens(
    routerAddr: string,
    amountIn: string,
    minAmountOut: string,
    path: string[],
  ) {
    const amountInBN = new BigNumber(amountIn)
      .multipliedBy(10 ** 18)
      .decimalPlaces(0);
    const amountOutDivision = await this.tokenDivision(
      this.walletConnection.blockchain,
      path[path.length - 1],
    );
    const amountOutBN = new BigNumber(minAmountOut)
      .multipliedBy(amountOutDivision)
      .decimalPlaces(0);

    return this.runMethodConnectedMulti(
      routerAddr,
      (contract, connectedAddress) =>
        contract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
          amountOutBN.toString(),
          path,
          connectedAddress,
          Math.round(new Date().valueOf() / 1000) + 60,
        ),
      async () => {},
      async () => amountInBN,
    );
  }

  public async swapExactTokensForTokens(
    routerAddr: string,
    amountIn: string,
    minAmountOut: string,
    path: string[],
  ) {
    const amountInDivision = await this.tokenDivision(
      this.walletConnection.blockchain,
      path[0],
    );
    const amountInBN = new BigNumber(amountIn)
      .multipliedBy(amountInDivision)
      .decimalPlaces(0);
    const amountOutDivision = await this.tokenDivision(
      this.walletConnection.blockchain,
      path[path.length - 1],
    );
    const amountOutBN = new BigNumber(minAmountOut)
      .multipliedBy(amountOutDivision)
      .decimalPlaces(0);

    return this.runMethodConnectedMulti(
      routerAddr,
      (contract, connectedAddress) =>
        contract.methods.swapExactTokensForTokensSupportingFeeOnTransferTokens(
          amountInBN.toString(),
          amountOutBN.toString(),
          path,
          connectedAddress,
          Math.round(new Date().valueOf() / 1000) + 60,
        ),
    );
  }

  public async addLiquidityETH(
    routerAddr: string,
    tokenAddress: string,
    amountIn: BigNumber,
    amountWETHIn: BigNumber,
    amountInMin: BigNumber,
    amountInWETHMin: BigNumber,
  ): Promise<MethodRunnable> {
    const amountInDivision = await this.tokenDivision(
      this.walletConnection.blockchain,
      tokenAddress,
    );
    amountIn = amountIn.multipliedBy(amountInDivision).decimalPlaces(0);
    amountInMin = amountInMin.multipliedBy(amountInDivision).decimalPlaces(0);

    amountWETHIn = amountWETHIn.multipliedBy(10 ** 18).decimalPlaces(0);
    amountInWETHMin = amountInWETHMin.multipliedBy(10 ** 18).decimalPlaces(0);

    return this.buildMethodRunnableMulti(
      routerAddr,
      (contract, connectedAddress) =>
        contract.methods.addLiquidityETH(
          tokenAddress,
          amountIn.toString(),
          amountInMin.toString(),
          amountInWETHMin.toString(),
          connectedAddress,
          Math.round(new Date().valueOf() / 1000) + 300,
        ),
      async () => {},
      async () => amountWETHIn,
    );
  }

  public async removeLiquidityETH(
    routerAddr: string,
    tokenAddress: string,
    liquidityToken: string,
    liquidityAmount: BigNumber,
    amountInMin: BigNumber,
    amountInWETHMin: BigNumber,
  ): Promise<MethodRunnable> {
    const liquidityDivision = await this.tokenDivision(
      this.walletConnection.blockchain,
      liquidityToken,
    );
    const amountInDivision = await this.tokenDivision(
      this.walletConnection.blockchain,
      tokenAddress,
    );
    liquidityAmount = liquidityAmount
      .multipliedBy(liquidityDivision)
      .decimalPlaces(0);
    amountInMin = amountInMin.multipliedBy(amountInDivision).decimalPlaces(0);
    amountInWETHMin = amountInWETHMin.multipliedBy(10 ** 18).decimalPlaces(0);

    return this.buildMethodRunnableMulti(
      routerAddr,
      (contract, connectedAddress) =>
        contract.methods.removeLiquidityETH(
          tokenAddress,
          liquidityAmount.toString(),
          amountInMin.toString(),
          amountInWETHMin.toString(),
          connectedAddress,
          1200,
        ),
    );
  }

  public async swapExactTokensForETH(
    routerAddr: string,
    amountIn: string,
    minAmountOut: string,
    path: string[],
  ) {
    const amountInDivision = await this.tokenDivision(
      this.walletConnection.blockchain,
      path[path.length - 1],
    );
    const amountInBN = new BigNumber(amountIn)
      .multipliedBy(amountInDivision)
      .decimalPlaces(0);
    const amountOutBN = new BigNumber(minAmountOut)
      .multipliedBy(10 ** 18)
      .decimalPlaces(0);

    return this.runMethodConnectedMulti(
      routerAddr,
      (contract, connectedAddress) =>
        contract.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
          amountInBN.toString(),
          amountOutBN.toString(),
          path,
          connectedAddress,
          Math.round(new Date().valueOf() / 1000) + 60,
        ),
    );
  }
}
