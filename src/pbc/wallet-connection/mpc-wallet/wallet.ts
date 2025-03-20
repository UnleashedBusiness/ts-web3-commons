import * as bip39 from 'bip39'
import {decrypt, encrypt} from './ecies.js'
import {Buffer} from "buffer";
import {HDKey} from "@scure/bip32";
import CryptoJS from "crypto-js";
import type {BNInput, Elliptic} from "../elliptic/interfaces.js";

// export const PathHD = `m/44'/60'/0'/0`
export const PathHD = `m/44'/3757'/0'/0`

export enum WalletTypes {
    'Legacy',
    'HD',
    'Torus',
}

export const generateMnemonic = (numberOfWords = 12): string => {
    if ([12, 15, 18, 21, 24].indexOf(numberOfWords) !== -1) {
        return bip39.generateMnemonic((numberOfWords * 32) / 3)
    } else {
        throw new Error('InvalidNumberOfWords')
    }
}

export const getWordlist = () => {
    return bip39.wordlists[bip39.getDefaultWordlist()]
}
// // https://gitlab.com/privacyblockchain/core/dashboard/-/blob/master/src/main/contexts/ShardedClient.ts#L60
// export const getShardId = (address: string | Buffer, numShards: number): number => {
//   const buf = typeof address === 'string' ? Buffer.from(address, 'hex') : address
//   assert(buf.length === 21, 'invalid address')
//   const int32 = Math.abs(buf.readInt32BE(17))
//   return int32 % numShards
// }

export const validMnemonic = (mnemonic: string): boolean => {
    return bip39.validateMnemonic(mnemonic)
}

export const mnemonicToSeed = (mnemonic: string, passphrase = '', bip32Seed = false): Buffer => {
    if (!validMnemonic(mnemonic)) {
        throw new Error('InvalidMnemonic')
    }
    return bip39.mnemonicToSeedSync(mnemonic, passphrase).slice(0, bip32Seed ? 64 : 32)
}

export const mnemonicToEntropy = (mnemonic: string): string => {
    if (!validMnemonic(mnemonic)) {
        throw new Error('InvalidMnemonic')
    }
    return bip39.mnemonicToEntropy(mnemonic)
}

export const entropyToMnemonic = (entropy: Uint8Array | Buffer | string): string => {
    const buf = typeof entropy === 'string' ? Buffer.from(entropy, 'hex') : entropy
    return bip39.entropyToMnemonic(Buffer.from(buf))
}

function getChildNodeByPath(node: HDKey, aryPath: string[]): HDKey {
    let child: HDKey = node
    while (child.depth < aryPath.length - 1) {
        child = child.deriveChild(parseInt(aryPath[child.depth + 1]))
    }
    return child
}

export function walletFromXPrv(elliptic: Elliptic, xprv: string, idx: number = 0) {
    const node = HDKey.fromExtendedKey(xprv)
    const aryPath = `${PathHD}/${idx}`.split('/')
    const child = getChildNodeByPath(node, aryPath)
    return {
        privateKey: Buffer.from(child.privateKey!).toString('hex'),
        publicKey: Buffer.from(child.publicKey!).toString('hex'),
        address: publicKeyToAddress(elliptic, Buffer.from(child.publicKey!)),
        path: aryPath.join('/'),
    }
}

export function getWalletExtended(mnemonic: string | string[], passphrase: string = '') {
    const seed = mnemonicToSeed(typeof mnemonic === 'string' ? mnemonic : mnemonic.join(' '), passphrase, true)
    if (seed.length !== 64) {
        throw new Error('Invalid seed')
    }

    const node = HDKey.fromMasterSeed(seed)
    const pathDerivation = PathHD.split('/').slice(0, -1).slice(0, -1).join('/')
    const privExtended44 = node.derive(pathDerivation).deriveChild(0).privateExtendedKey
    const pubExtended44 = node.derive(pathDerivation).deriveChild(0).publicExtendedKey

    return {
        xpub: pubExtended44,
        xprv: privExtended44,
    }
}
// export function getKeyPairTorus() {
//   // TODO
// }

export function getKeyPairHD(elliptic: Elliptic, mnemonic: string | string[], path_idx: number = 0, passphrase: string = '') {
    // need to register coin with Bip-44
    // https://github.com/satoshilabs/slips/blob/master/slip-0044.md
    const extended = getWalletExtended(mnemonic, passphrase)
    const wallet = walletFromXPrv(elliptic, extended.xprv, Number(path_idx || 0))
    return {
        ...extended,
        ...wallet,
        type: WalletTypes.HD,
    }
}

export function getPublicKeyBuffer(elliptic: Elliptic, publicKey: string | Buffer, compress: boolean = false): Buffer {
    // const publicKey = keyPair.getPublic(false, "array");
    let publicKeyBuf: Buffer = typeof publicKey === 'string' ? Buffer.from(publicKey, 'hex') : publicKey
    if (publicKeyBuf.length !== 65) {
        // attempt to uncompress
        publicKeyBuf = Buffer.from(elliptic.keyFromPublic(publicKeyBuf).getPublic(false, 'array'))
    } else {
        if (publicKeyBuf.length !== 65) {
            throw new Error('public key must be in uncompressed format');
        }
    }
    return Buffer.from(elliptic.keyFromPublic(publicKeyBuf).getPublic(compress, 'array'))
}

export function publicKeyToAddress(elliptic: Elliptic, publicKey: Buffer | string): string {
    const pubBuffer = getPublicKeyBuffer(elliptic, publicKey)
    if (pubBuffer.length !== 65) {
        throw new Error('public key must be in uncompressed format');
    }

    const hash = Buffer.from(CryptoJS.enc.Hex.stringify(CryptoJS.SHA256(CryptoJS.lib.WordArray.create(pubBuffer))), "hex");
    return '00' + hash.toString('hex').substring(24)
}
export function isValidPrivateKey(key: Buffer | string): boolean {
    try {
        const str = typeof key === 'string' ? key : key.toString('hex')
        const buf = typeof key === 'string' ? Buffer.from(key, 'hex') : key
        return buf.length === 32 && str.length === 64 && buf.toString('hex') === str.toLowerCase()
    } catch (error) {
        return false
    }
}
export function isValidAddress(address: Buffer | string): boolean {
    try {
        const str = typeof address === 'string' ? address : address.toString('hex')
        const buf = typeof address === 'string' ? Buffer.from(address, 'hex') : address
        return buf.length === 21 && str.length === 42 && buf.toString('hex') === str.toLowerCase() && [0, 1, 2, 3, 4].includes(buf[0])
    } catch (error) {
        return false
    }
}

export function privateKeyToKeypair(elliptic: Elliptic, privateKey: string) {
    if (!isValidPrivateKey(privateKey)) {
        throw new Error('invalid private key');
    }

    return elliptic.keyFromPrivate(privateKey, 'hex')
}

export function privateKeyToPublicKey(elliptic: Elliptic, privateKey: string, compress: boolean = true) {
    if (!isValidPrivateKey(privateKey)) {
        throw new Error('invalid private key');
    }

    return Buffer.from(privateKeyToKeypair(elliptic, privateKey).getPublic(compress, 'array'))
}

export function encryptMessage(elliptic: Elliptic, pubKey: string | Buffer, message: string | Buffer): Buffer {
    const pubBuffer = getPublicKeyBuffer(elliptic, pubKey)
    if (pubBuffer.length !== 65) {
        throw new Error('public key must be in uncompressed format');
    }

    const messageBuffer = typeof message === 'string' ? Buffer.from(message, 'utf8') : message

    return encrypt(elliptic, pubBuffer, messageBuffer)
}

export function decryptMessage(elliptic: Elliptic, privateKey: Buffer | string, encrypt: Buffer | string): Buffer {
    const privBuffer = typeof privateKey === 'string' ? Buffer.from(privateKey, 'hex') : privateKey
    if (privBuffer.length !== 32) {
        throw new Error('private key must be with length 32');
    }

    const encryptBuffer: Buffer = typeof encrypt === 'string' ? Buffer.from(encrypt, 'hex') : encrypt
    return decrypt(elliptic, elliptic.keyFromPrivate(privBuffer), encryptBuffer)
}

export function signTransaction(elliptic: Elliptic, data: BNInput, privateKey: string): Buffer {
    const keyPair = privateKeyToKeypair(elliptic, privateKey)
    const signature = keyPair.sign(data, 'hex', { canonical: true })
    return Buffer.concat([
        Buffer.from([signature.recoveryParam!]),
        signature.r.toArrayLike(Buffer, 'be', 32),
        signature.s.toArrayLike(Buffer, 'be', 32),
    ])
}