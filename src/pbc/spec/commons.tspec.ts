import {TypeIndex, type TypeSpec} from "@partisiablockchain/abi-client/target/main/types/Abi.js";

export const HashTypeSpec: TypeSpec = {
    typeIndex: TypeIndex.Hash
}

export const BooleanTypeSpec: TypeSpec = {
    typeIndex: TypeIndex.bool
}

export const StringTypeSpec: TypeSpec = {
    typeIndex: TypeIndex.String
}

export const SignatureTypeSpec: TypeSpec = {
    typeIndex: TypeIndex.Signature
}

export const EnumTypeSpec: TypeSpec = {
    typeIndex: TypeIndex.u8
}

export const AddressTypeSpec: TypeSpec = {
    typeIndex: TypeIndex.Address
}

export const U32TypeSpec: TypeSpec = {
    typeIndex: TypeIndex.u32
}

export const U64TypeSpec: TypeSpec = {
    typeIndex: TypeIndex.u64
}

export function buildVecTypeSpec<T extends TypeSpec>(spec: T): TypeSpec {
    return {
        typeIndex: TypeIndex.Vec,
        valueType: spec,
    }
}

export function buildSetTypeSpec<T extends TypeSpec>(spec: T): TypeSpec {
    return {
        typeIndex: TypeIndex.Set,
        valueType: spec,
    }
}