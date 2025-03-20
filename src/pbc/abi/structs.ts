export type BufferTypes =
    | 'string'
    | 'string_hex'
    | 'address'
    | 'hash'
    | 'eth_address'
    | 'num256'
    | 'num128'
    | 'num64'
    | 'num32'
    | 'num16'
    | 'num8'
    | 'bool'
    | 'raw'
    | 'publicKey'
    | 'publicKeyBls'
    | 'signatureBls'
    | 'signature'

export interface IFields {
    field_name: string
    field_type: BufferTypes
}

export const ABI_TransactionHeader: IFields[] = [
    // { field_name: 'transactionType', field_type: 'num8' },
    { field_name: 'contract', field_type: 'address' },
    { field_name: 'payload_length', field_type: 'num32' },
]

export const ABI_TransactionInner: IFields[] = [
    { field_name: 'nonce', field_type: 'num64' },
    { field_name: 'validTo', field_type: 'num64' },
    { field_name: 'cost', field_type: 'num64' },
]