import * as bip32 from 'bip32'
import * as bip39 from 'bip39'
import {type BNInput, ec as Elliptic, type SignatureInput} from 'elliptic'
import {decrypt, encrypt} from './ecies.js'
import {Buffer} from "buffer";
import KeyPair = Elliptic.KeyPair;

const ec = new Elliptic('secp256k1')

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

function getChildNodeByPath(node: bip32.BIP32Interface, aryPath: string[]): bip32.BIP32Interface {
    let child: bip32.BIP32Interface = node
    while (child.depth < aryPath.length - 1) {
        child = child.derivePath(aryPath[child.depth + 1])
    }
    return child
}
export function walletFromXY(eccPoint: { x: string; y: string }, compress: boolean = false) {
    const publicKey = Buffer.from(ec.keyFromPublic(eccPoint).getPublic(compress, 'array'))
    return {
        publicKey: publicKey.toString('hex'),
        address: publicKeyToAddress(publicKey),
        type: WalletTypes.Legacy,
    }
}
export function walletFromXPub(xpub: string, idx: number = 0) {
    const node = bip32.fromBase58(xpub)
    const aryPath = `${PathHD}/${idx}`.split('/')
    const child = getChildNodeByPath(node, aryPath)
    return {
        // privateKey: null,
        publicKey: child.publicKey.toString('hex'),
        address: publicKeyToAddress(child.publicKey),
        path: aryPath.join('/'),
    }
}
export function walletFromXPrv(xprv: string, idx: number = 0) {
    const node = bip32.fromBase58(xprv)
    const aryPath = `${PathHD}/${idx}`.split('/')
    const child = getChildNodeByPath(node, aryPath)
    return {
        privateKey: child.privateKey!.toString('hex'),
        publicKey: child.publicKey.toString('hex'),
        address: publicKeyToAddress(child.publicKey),
        path: aryPath.join('/'),
    }
}

export function getWalletExtended(mnemonic: string | string[], passphrase: string = '') {
    const seed = mnemonicToSeed(typeof mnemonic === 'string' ? mnemonic : mnemonic.join(' '), passphrase, true)
    if (seed.length !== 64) {
        throw new Error('Invalid seed')
    }

    const node = bip32.fromSeed(seed)
    const pathDerivation = PathHD.split('/').slice(0, -1).slice(0, -1).join('/')
    const privExtended44 = node.derivePath(pathDerivation).deriveHardened(0).toBase58()
    const pubExtended44 = node.derivePath(pathDerivation).deriveHardened(0).neutered().toBase58()

    return {
        xpub: pubExtended44,
        xprv: privExtended44,
    }
}
// export function getKeyPairTorus() {
//   // TODO
// }

export function getKeyPairHD(mnemonic: string | string[], path_idx: number = 0, passphrase: string = '') {
    // need to register coin with Bip-44
    // https://github.com/satoshilabs/slips/blob/master/slip-0044.md
    const extended = getWalletExtended(mnemonic, passphrase)
    const wallet = walletFromXPrv(extended.xprv, Number(path_idx || 0))
    return {
        ...extended,
        ...wallet,
        type: WalletTypes.HD,
    }
}
export function seedToKeyPair(seed: Buffer) {
    // hash the seed to derive a keypair
    const privateKey = Buffer.from(CryptoJS.enc.Hex.stringify(CryptoJS.SHA256(CryptoJS.lib.WordArray.create(seed))), "hex");
    if (privateKey.length !== 32) {
        throw new Error('invalid private key length');
    }
    const publicKey = privateKeyToPublicKey(privateKey.toString('hex'), true)

    return { privateKey, publicKey }
}
export function getKeyPairLegacy(mnemonic: string | string[], passphrase: string = '') {
    const seed = mnemonicToSeed(typeof mnemonic === 'string' ? mnemonic : mnemonic.join(' '), passphrase, false)
    if (seed.length !== 32) {
        throw new Error('invalid seed length');
    }

    const { privateKey, publicKey } = seedToKeyPair(seed)
    return {
        privateKey: privateKey.toString('hex'),
        publicKey: publicKey.toString('hex'),
        address: publicKeyToAddress(publicKey),
        type: WalletTypes.Legacy,
    }
}

export function getPublicKeyBuffer(publicKey: string | Buffer, compress: boolean = false): Buffer {
    // const publicKey = keyPair.getPublic(false, "array");
    let publicKeyBuf: Buffer = typeof publicKey === 'string' ? Buffer.from(publicKey, 'hex') : publicKey
    if (publicKeyBuf.length !== 65) {
        // attempt to uncompress
        publicKeyBuf = Buffer.from(ec.keyFromPublic(publicKeyBuf).getPublic(false, 'array'))
    } else {
        if (publicKeyBuf.length !== 65) {
            throw new Error('public key must be in uncompressed format');
        }
    }
    return Buffer.from(ec.keyFromPublic(publicKeyBuf).getPublic(compress, 'array'))
}

export function publicKeyToAddress(publicKey: Buffer | string): string {
    const pubBuffer = getPublicKeyBuffer(publicKey)
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
export function privateKeyToKeypair(privateKey: string) {
    if (!isValidPrivateKey(privateKey)) {
        throw new Error('invalid private key');
    }

    return ec.keyFromPrivate(privateKey, 'hex')
}

export function privateKeyToPublicKey(privateKey: string, compress: boolean = true) {
    if (!isValidPrivateKey(privateKey)) {
        throw new Error('invalid private key');
    }

    return Buffer.from(privateKeyToKeypair(privateKey).getPublic(compress, 'array'))
}

export function privateKeyToAccountAddress(privateKey: string) {
    if (!isValidPrivateKey(privateKey)) {
        throw new Error('invalid private key');
    }

    const publicKey = privateKeyToPublicKey(privateKey)
    return publicKeyToAddress(publicKey)
}

export function encryptMessage(pubKey: string | Buffer, message: string | Buffer): Buffer {
    const pubBuffer = getPublicKeyBuffer(pubKey)
    if (pubBuffer.length !== 65) {
        throw new Error('public key must be in uncompressed format');
    }

    const messageBuffer = typeof message === 'string' ? Buffer.from(message, 'utf8') : message

    return encrypt(pubBuffer, messageBuffer)
}

export function decryptMessage(privateKey: Buffer | string, encrypt: Buffer | string): Buffer {
    const privBuffer = typeof privateKey === 'string' ? Buffer.from(privateKey, 'hex') : privateKey
    if (privBuffer.length !== 32) {
        throw new Error('private key must be with length 32');
    }

    const encryptBuffer: Buffer = typeof encrypt === 'string' ? Buffer.from(encrypt, 'hex') : encrypt
    return decrypt(KeyPair.fromPrivate(ec, privBuffer), encryptBuffer)
}
export function signTransaction(data: BNInput, privateKey: string): Buffer {
    const keyPair = privateKeyToKeypair(privateKey)
    const signature = keyPair.sign(data, 'hex', { canonical: true })
    return Buffer.concat([
        Buffer.from([signature.recoveryParam!]),
        signature.r.toArrayLike(Buffer, 'be', 32),
        signature.s.toArrayLike(Buffer, 'be', 32),
    ])
}

export function verifySignature(hash: Buffer | string, signature: Buffer | string, publicKey: Buffer | string): boolean {
    if (hash.length !== 32) {
        throw new Error('must be sha256 hash');
    }
    const publicKeyBuf = typeof publicKey === 'string' ? Buffer.from(publicKey, 'hex') : publicKey
    const signatureBuf = typeof signature === 'string' ? Buffer.from(signature, 'hex') : signature
    const keyPair = ec.keyFromPublic(publicKeyBuf, 'array')

    if (signatureBuf.length !== 65) {
        throw new Error('Partisia Signatures must be 65 bytes');
    }

    const recoveryParam = signatureBuf[0]
    const r = signatureBuf.subarray(1, 33)
    const s = signatureBuf.subarray(33, 65)

    const sig: SignatureInput = {
        recoveryParam,
        r,
        s,
    }

    return ec.verify(hash, sig, keyPair, 'array')
}
