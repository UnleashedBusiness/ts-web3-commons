import {BN} from "@partisiablockchain/abi-client";

export class BufferWriterUtils {
    private buffer: Buffer;

    constructor() {
        this.buffer = Buffer.alloc(0);
    }

    public readonly writeIntBE = (int: number): void => {
        const buffer = Buffer.alloc(4);
        buffer.writeInt32BE(int, 0);
        this.appendBuffer(buffer);
    };

    public readonly writeLongBE = (long: BN): void => {
        this.writeNumberBE(long, 8);
    };

    public readonly writeNumberBE = (num: BN, byteCount: number): void => {
        const buffer = num.toTwos(byteCount * 8).toArrayLike(Buffer, "be", byteCount);
        this.appendBuffer(buffer);
    };

    public readonly writeBuffer = (buffer: Buffer): void => {
        this.appendBuffer(buffer);
    };

    public readonly writeDynamicBuffer = (buffer: Buffer): void => {
        this.writeIntBE(buffer.length);
        this.writeBuffer(buffer);
    };

    public readonly writeHexString = (hex: string): void => {
        this.appendBuffer(Buffer.from(hex, "hex"));
    };

    public readonly toBuffer = (): Buffer => {
        return this.buffer.slice();
    };

    private readonly appendBuffer = (buffer: Buffer) => {
        this.buffer = Buffer.concat([this.buffer, buffer]);
    };
}
