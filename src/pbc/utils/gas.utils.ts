import {Buffer} from "buffer";

export class GasUtils {
    public static readonly GAS_BYTES_MULTIPLIER = 5;
    public static readonly GAS_MULTIPLIER = 1.25;

    public static dataNetworkCost(...data: any[]): number {
        let bytesLength = data.map(x => {
            let jsonData = JSON.stringify(x, (_, v) => typeof v === 'bigint' ? v.toString() : v);
            return Buffer.from(jsonData, "utf8").byteLength;
        }).reduce((a, b) => a + b, 0);

        return bytesLength * this.GAS_BYTES_MULTIPLIER;
    }

    public static gasMultiplier(gas: number): number {
        return Math.trunc(gas * this.GAS_MULTIPLIER);
    }
}