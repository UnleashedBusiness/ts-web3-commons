import { BaseTokenAwareContract } from './base/base-token-aware.contract';
import { Erc20TokenContract } from './erc20-token.contract';
import { WETHAbi, WETHAbiFunctional } from '../abi/weth.abi';
import BigNumber from 'bignumber.js';
import { ContractToolkitService } from './utils/contract-toolkit.service';

export class WethContract extends BaseTokenAwareContract<WETHAbiFunctional> {
  constructor(token: Erc20TokenContract, toolkit: ContractToolkitService) {
    super(token, toolkit);
  }

  protected getAbi(): typeof WETHAbi {
    return WETHAbi;
  }

  public async deposit(wethAddress: string, amountIn: BigNumber) {
    const amountInBN = new BigNumber(amountIn).multipliedBy(10 ** 18).decimalPlaces(0);

    return this.runMethodConnectedMulti(
      wethAddress,
      (contract, connectedAddress) => contract.methods.deposit(),
      async () => {},
      async () => amountInBN,
    );
  }
}
