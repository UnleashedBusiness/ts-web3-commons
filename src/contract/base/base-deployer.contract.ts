import BigNumber from "bignumber.js";
import {WalletConnectionService} from "../../wallet/wallet-connection.service";
import {BaseTokenAwareContract} from "./base-token-aware.contract";
import {ContractAbi} from "web3-types";
import {Erc20TokenContract} from "../erc20-token.contract";
import {TransactionRunningHelperService} from "../../utils/transaction-running-helper.service";
import {BlockchainDefinition, EmptyAddress} from "../../utils/chains";
import {Web3BatchRequest} from "web3-core";

export abstract class BaseDeployerContract<Abi extends ContractAbi> extends BaseTokenAwareContract<Abi> {
  protected constructor(
      tokenService: Erc20TokenContract,
      walletConnection: WalletConnectionService,
      transactionHelper: TransactionRunningHelperService
  ) {
    super(tokenService, walletConnection, transactionHelper);
  }

  public async isUpgradeable(
      config: BlockchainDefinition,
      contractAddress: string,
      address: string,
      batch?: Web3BatchRequest,
      callback?: (result: boolean) => void
  ) {
    // @ts-ignore
    return this.getViewMulti(config, contractAddress, async contract => contract.methods.isUpgradeable(address), batch, callback);
  }

  public async deployTaxForAddress(
      config: BlockchainDefinition,
      contractAddress: string,
      address: string,
      group: string,
      type: number,
      batch?: Web3BatchRequest,
      callback?: (result: BigNumber) => void
  ) {
    return this.getViewWithDivision(config, contractAddress,
        // @ts-ignore
        contract => contract.methods.deployTaxForAddress(address, group, type),
        EmptyAddress, batch, callback);
  }
}
