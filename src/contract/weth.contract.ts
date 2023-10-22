import { BaseTokenAwareContract } from "./base/base-token-aware.contract";
import { Erc20TokenContract } from "./erc20-token.contract";
import { TransactionRunningHelperService } from "../utils/transaction-running-helper.service";
import { WETHAbi, WETHAbiFunctional } from "../abi/weth.abi";
import { ReadOnlyWeb3Connection } from "../connection/interface/read-only-web3-connection";
import BigNumber from "bignumber.js";

export class WethContract extends BaseTokenAwareContract<WETHAbiFunctional> {
  constructor(
    token: Erc20TokenContract,
    web3Connection: ReadOnlyWeb3Connection,
    transactionHelper: TransactionRunningHelperService,
  ) {
    super(token, web3Connection, transactionHelper);
  }

  protected getAbi(): typeof WETHAbi {
    return WETHAbi;
  }

  public async deposit(wethAddress: string, amountIn: BigNumber) {
    const amountInBN = new BigNumber(amountIn)
      .multipliedBy(10 ** 18)
      .decimalPlaces(0);

    return this.runMethodConnectedMulti(
      wethAddress,
      (contract, connectedAddress) => contract.methods.deposit(),
      async () => {},
      async () => amountInBN,
    );
  }
}
