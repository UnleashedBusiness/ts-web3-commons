import {type NumericResult} from '../contract/utils/contract.types.js';
import {bn_wrap} from './big-number.utils.js';
import {BigNumber} from 'bignumber.js';

export const bigNumberPipe = async (value: NumericResult): Promise<BigNumber> => bn_wrap(value);

export const scalePipe =
    (scaling: BigNumber) =>
        async (value: BigNumber): Promise<BigNumber> =>
            value.dividedBy(scaling);
