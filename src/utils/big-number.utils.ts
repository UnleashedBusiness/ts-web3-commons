import {type NumericResult} from "../contract/utils/contract.types.js";
import {BigNumber} from "bignumber.js";

export class BigNumberUtils {
    public static wrap(value: NumericResult): BigNumber {
        if (typeof value === 'bigint') {
            return new BigNumber(value.toString());
        }
        return new BigNumber(value);
    }
}

export const bn_wrap = (value: NumericResult) => BigNumberUtils.wrap(value);