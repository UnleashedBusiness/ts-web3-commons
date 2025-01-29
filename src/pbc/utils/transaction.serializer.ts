import type {Rpc, TransactionInner, TransactionPayload} from "../dto/transaction-data.dto.js";
import {BufferWriterUtils} from "./buffer-writer.utils.js";
import {BN} from "bn.js";

export class TransactionSerializer {
    public serialize(
        inner: TransactionInner,
        data: TransactionPayload<Rpc>
    ): Buffer {
        const bufferWriter = new BufferWriterUtils();

        this.serializeTransactionInner(bufferWriter, inner);

        bufferWriter.writeHexString(data.address);
        bufferWriter.writeDynamicBuffer(data.rpc);
        return bufferWriter.toBuffer();
    }

    private serializeTransactionInner(bufferWriter: BufferWriterUtils, inner: TransactionInner) {
        bufferWriter.writeLongBE(new BN.BN(inner.nonce));
        bufferWriter.writeLongBE(new BN.BN(inner.validTo));
        bufferWriter.writeLongBE(new BN.BN(inner.cost));
    }
}