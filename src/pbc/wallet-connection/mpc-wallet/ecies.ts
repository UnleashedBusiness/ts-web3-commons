import CryptoJS from "crypto-js";
import {Buffer} from "buffer";
import type {Elliptic, KeyPairSigner} from "../elliptic/interfaces.js";


const optionsDefault = {
    hashName: 'sha256',
    hashLength: 32,
    macName: 'sha256',
    macLength: 32,
    curveName: 'secp256k1',
    symmetricCypherName: 'aes-128-ecb',
    iv: Buffer.from(new Uint8Array(0)),
    // iv: null,
    keyFormat: 'uncompressed',
    s1: Buffer.from(new Uint8Array(0)),
    s2: Buffer.from(new Uint8Array(0)),
}

// E
function symmetricEncrypt(iv: Buffer, key: Buffer, plaintext: Buffer) {
    const encryptionResult = CryptoJS.AES.encrypt(
        CryptoJS.lib.WordArray.create(plaintext),
        CryptoJS.lib.WordArray.create(key),
        {
            mode: CryptoJS.mode.ECB,
            iv: CryptoJS.lib.WordArray.create(iv),
        }
    );

    return Buffer.from(encryptionResult.ciphertext.toString(CryptoJS.enc.Hex), "hex");
}

// E-1
function symmetricDecrypt(iv: Buffer, key: Buffer, cipherText: Buffer) {
    return Buffer.from(CryptoJS.AES.decrypt(
        cipherText.toString("base64"),
        CryptoJS.lib.WordArray.create(key),
        {
            mode: CryptoJS.mode.ECB,
            iv: CryptoJS.lib.WordArray.create(iv),
        }
    ).toString(CryptoJS.enc.Hex), "hex");
}

// KDF
function hashMessage(message: Buffer): Buffer {
    return Buffer.from(CryptoJS.enc.Hex.stringify(CryptoJS.SHA256(CryptoJS.lib.WordArray.create(message))), "hex");
}

// MAC
function macMessage(key: Buffer, message: Buffer): Buffer {
    return Buffer.from(CryptoJS.enc.Hex.stringify(CryptoJS.HmacSHA256(CryptoJS.lib.WordArray.create(message), CryptoJS.lib.WordArray.create(key))), "hex");
}

export const encrypt = (elliptic: Elliptic, publicKey: Buffer | string, message: Buffer | string, options: any = {}) => {
    publicKey = typeof publicKey === 'string' ? Buffer.from(publicKey, 'hex') : publicKey
    message = typeof message === 'string' ? Buffer.from(message, 'utf8') : message

    options = {...optionsDefault, ...options}

    const ecdh = elliptic.genKeyPair();
    // R
    const R = Buffer.from(ecdh.getPublic().encode("array", false));
    // S
    const sharedSecret = Buffer.from(ecdh.derive(elliptic.keyFromPublic(publicKey).getPublic()).toString(16), "hex");

    // uses KDF to derive a symmetric encryption and a MAC keys:
    // Ke || Km = KDF(S || S1)
    const hash = hashMessage(Buffer.concat([sharedSecret, options.s1], sharedSecret.length + options.s1.length))
    // Ke
    const encryptionKey = hash.subarray(0, hash.length / 2)
    // Km
    const macKey = hash.subarray(hash.length / 2)

    // encrypts the message:
    // c = E(Ke; m);
    const cipherText = symmetricEncrypt(options.iv, encryptionKey, message)

    // computes the tag of encrypted message and S2:
    // d = MAC(Km; c || S2)
    const tag = Buffer.from(
        macMessage(macKey, Buffer.concat([cipherText, options.s2], cipherText.length + options.s2.length))
    )
    // outputs R || c || d
    return Buffer.concat([R, cipherText, tag])
}

function equalConstTime(b1: Buffer, b2: Buffer) {
    if (b1.length !== b2.length) {
        return false
    }
    let result = 0
    for (let i = 0; i < b1.length; i++) {
        result |= b1[i] ^ b2[i]
    }
    return result === 0
}

export const decrypt = (elliptic: Elliptic, ecdh: KeyPairSigner, message: Buffer, options: any = {}) => {
    options = {...optionsDefault, ...options}

    const publicKeyLength = ecdh.getPublic().encode("array", false).length
    // R
    const R = message.subarray(0, publicKeyLength)
    // c
    const cipherText = message.subarray(publicKeyLength, message.length - options.macLength)
    // d
    const messageTag = message.subarray(message.length - options.macLength)

    // S
    const sharedSecret = Buffer.from(ecdh.derive(elliptic.keyFromPublic(R).getPublic()).toString(16), "hex");

    // derives keys the same way as Alice did:
    // Ke || Km = KDF(S || S1)
    const hash = hashMessage(Buffer.concat([sharedSecret, options.s1], sharedSecret.length + options.s1.length))
    // Ke
    const encryptionKey = hash.subarray(0, hash.length / 2)
    // Km
    const macKey = hash.subarray(hash.length / 2)

    // uses MAC to check the tag
    const keyTag = macMessage(macKey, Buffer.concat([cipherText, options.s2], cipherText.length + options.s2.length))

    // outputs failed if d != MAC(Km; c || S2);
    if (!equalConstTime(messageTag, keyTag)) {
        throw new Error('Bad MAC')
    }

    // uses symmetric encryption scheme to decrypt the message
    // m = E-1(Ke; c)
    return symmetricDecrypt(options.iv, encryptionKey, cipherText)
}
