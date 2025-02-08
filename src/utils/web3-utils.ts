import {Web3} from "web3";
import {EmptyAddress} from "./chains.js";

export class Web3Utils {
    static web3AddressEq(a: string, b: string): boolean {
        return Web3.utils.toChecksumAddress(a) === Web3.utils.toChecksumAddress(b);
    }

    static web3IsEmptyAddress(target: string | null | undefined): boolean {
        return target === null || target === undefined || Web3Utils.web3AddressEq(target, EmptyAddress);
    }
}