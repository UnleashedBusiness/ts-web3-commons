import type {Rpc, TransactionInner, TransactionPayload} from "../dto/transaction-data.dto.js";
import {BufferWriterUtils} from "./buffer-writer.utils.js";
import {BigNumber} from "bignumber.js";

export class TransactionSerializer {
    public serialize(
        inner: TransactionInner,
        data: TransactionPayload<Rpc>
    ): Buffer {
        const bufferWriter = new BufferWriterUtils();

        bufferWriter.writeLongBE(new BigNumber(inner.nonce));
        bufferWriter.writeLongBE(new BigNumber(inner.validTo));
        bufferWriter.writeLongBE(new BigNumber(inner.cost));

        bufferWriter.writeHexString(data.address);
        bufferWriter.writeDynamicBuffer(data.rpc);
        return bufferWriter.toBuffer();
    }
}