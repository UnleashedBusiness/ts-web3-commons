import { NumericResult } from '../contract/utils/contract.types';
import { bn_wrap } from './big-number.utils';
import { Web3Contract } from '../contract/web3-contract';
import { Erc20AbiFunctional } from '../abi/erc20.abi';
import { BlockchainDefinition } from './chains';
import BigNumber from 'bignumber.js';

export const bigNumberPipe = async (value: NumericResult): Promise<BigNumber> => bn_wrap(value);

export const scalePipe =
  (scaling: BigNumber) =>
  async (value: BigNumber): Promise<BigNumber> =>
    value.dividedBy(scaling);

export const scaleForTokenPipe =
  (
    config: BlockchainDefinition,
    tokenContract: Web3Contract<Erc20AbiFunctional>,
    tokenAddress: string,
    reverse: boolean = false,
  ) =>
  (value: BigNumber): Promise<BigNumber> =>
    tokenContract.views
      .decimals<NumericResult>(config, tokenAddress, {})
      .then(bigNumberPipe)
      .then(async (input) =>
        reverse ? value.multipliedBy(10 ** input.toNumber()) : value.dividedBy(10 ** input.toNumber()),
      );
