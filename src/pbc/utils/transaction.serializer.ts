import {Big} from 'big.js'
import {ABI_TransactionHeader, ABI_TransactionInner, type BufferTypes, type IFields} from "../abi/structs.js";

const CONSTANTS = {
    Cost: 20,
}

export class TransactionSerializer {
    public serialize(
        dataInner: {
            nonce: string | number
            cost?: string | number
            validTo?: string
        },
        dataHeader: {
            contract: string
        },
        dataPayload: Buffer
    ): Buffer
    public serialize(...args: any[]): Buffer {
        const [dataInner, dataHeader] = args
        let bufPayload: Buffer
        if (Buffer.isBuffer(args[2])) {
            bufPayload = args[2]
        } else {
            const dataPayload = args[2]
            const abi = args[3]
            for (const field of abi) {
                if (!dataPayload.hasOwnProperty(field.field_name)) {
                    throw new Error(`malformed payload, missing ${field.field_name}`);
                }
            }
            bufPayload = this.serializeToBuffer(dataPayload, ...abi)
        }
        const bufInner = this.serializeToBuffer(this.getStructInner(dataInner), ...ABI_TransactionInner)
        const bufHeader = this.serializeToBuffer(
            this.getStructHeader({
                ...dataInner,
                ...dataHeader,
                payload_length: bufPayload.length,
                // transactionType: TransactionType.INTERACT,
            }),
            ...ABI_TransactionHeader
        )

        return Buffer.concat([bufInner, bufHeader, bufPayload])
    }

    private getStructInner(args: { nonce: number | string; cost?: number | string; validTo?: string | Date }) {
        // Add the defaults for cost and validTo
        const { nonce, cost, validTo } = {
            cost: CONSTANTS.Cost,
            validTo: Date.now() + 1000 * 30,
            ...args,
        }

        return {
            cost: String(cost),
            nonce: String(nonce),
            validTo: String(new Date(validTo).getTime()),
        }
    }

    private getStructHeader(args: { contract: string; payload_length: number | string }) {
        // Add the defaults
        return {
            contract: args.contract,
            payload_length: String(args.payload_length),
            // transactionType: args.transactionType,
        }
    }

    private serializeToBuffer(args: Record<string, any>, ...aryFields: IFields[]) {
        const bufData: Uint8Array[] = []

        for (const field of aryFields) {
            const fieldVal = args[field.field_name]
            const bufSize = this.fieldTypeToSize(field.field_type)
            if (field.field_type.substring(0, 3) === 'num') {
                bufData.push(Buffer.from(this.numToBuffer(fieldVal, bufSize).reverse()))
            } else if (field.field_type === 'bool') {
                bufData.push(Buffer.from(this.numToBuffer(Number(fieldVal), bufSize)))
            } else if (['address', 'publicKey', 'publicKeyBls', 'signatureBls', 'hash', 'signature', 'eth_address'].includes(field.field_type)) {
                if (typeof fieldVal !== 'string'){
                    throw new Error(`pass ${field.field_type} as string`);
                }
                let t = fieldVal.replace('0x', '')
                const bufSize = this.fieldTypeToSize(field.field_type)

                if (t.length !== bufSize / 4) {
                    throw new Error(`invalid ${field.field_type} ${fieldVal}`);
                }
                bufData.push(Buffer.from(t, 'hex'))
            } else if (['string', 'string_hex'].includes(field.field_type)) {
                if (typeof fieldVal !== 'string'){
                    throw new Error(`pass ${field.field_type} as string`);
                }
                const bufStr = Buffer.from(fieldVal, field.field_type === 'string_hex' ? 'hex' : 'utf8')
                const bufLen = this.numToBuffer(bufStr.length, 32).reverse()
                bufData.push(Buffer.concat([bufLen, bufStr]))
            }
        }

        return Buffer.concat(bufData)
    }

    private fieldTypeToSize(type: BufferTypes): number {
        if (type === 'address') {
            return (42 / 2) * 8
        }
        if (type === 'hash') {
            return (64 / 2) * 8
        }
        if (type === 'publicKey') {
            return 33 * 8
        }
        if (type === 'publicKeyBls') {
            return 96 * 8
        }
        if (type === 'eth_address') {
            return 20 * 8
        }
        if (type === 'signatureBls') {
            return 48 * 8
        }
        if (type === 'signature') {
            return 65 * 8
        }
        if (['string', 'string_hex'].includes(type)) {
            return 4 * 8 // the string length itself will be added later
        }

        if (type === 'num256') {
            return 256
        }
        if (type === 'num128') {
            return 128
        }
        if (type === 'num64') {
            return 64
        }
        if (type === 'num32') {
            return 32
        }
        if (type === 'num16') {
            return 16
        }
        if (type === 'num8') {
            return 8
        }
        if (type === 'bool') {
            return 8
        }

        throw new Error('unkown field byte length');
    }

    private numToBuffer(num: string | number, bytes: number): Buffer {
        Big.RM = Big.roundDown
        let res = new Big(num)
        // Max size that can fit is pow(2,bytes) - 1
        if (!res.lt(new Big(2).pow(bytes))) {
            throw new Error('number too big');
        }

        let leftShift = bytes - 8
        if (bytes % 8 !== 0) {
          throw new Error('invalid byte number')
        }

        const aryBuf: Uint8Array = new Uint8Array(bytes / 8)
        while (leftShift >= 0) {
            const shiftBits = new Big(2).pow(leftShift)
            const pos = Number(res.div(shiftBits).toFixed(0))
            aryBuf[leftShift / 8] = pos

            res = res.minus(shiftBits.times(pos))
            leftShift -= 8
        }

        return Buffer.from(aryBuf)
    }
}