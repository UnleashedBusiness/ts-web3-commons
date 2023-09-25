import {BaseTokenAwareContract} from "./base/base-token-aware.contract";
import {Erc20TokenContract} from "./erc20-token.contract";
import {WalletConnectionService} from "../wallet/wallet-connection.service";
import {TransactionRunningHelperService} from "../utils/transaction-running-helper.service";
import {WETHAbi} from "../abi/weth.abi";
import {BigNumber} from "bignumber.js";

export class WethContract extends BaseTokenAwareContract {
  constructor(token: Erc20TokenContract, walletConnection: WalletConnectionService, transactionHelper: TransactionRunningHelperService) {
    super(token, walletConnection, transactionHelper);
  }

  protected getAbi(): any {
    return WETHAbi;
  }

  public async deposit(wethAddress: string, amountIn: BigNumber) {
    const amountInBN = new BigNumber(amountIn).multipliedBy(10 ** 18).decimalPlaces(0);

    return this.runMethodConnectedMulti(wethAddress,
      (contract, connectedAddress) => contract.methods.deposit(),
      async () => {
      },
      async () => amountInBN
    );
  }
}
