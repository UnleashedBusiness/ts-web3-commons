import {Cipher, createCipheriv} from "crypto";
import {sha256} from "hash.js";
import ec from 'elliptic';
import KeyPair = ec.ec.KeyPair;
import {BigNumber} from "bignumber.js";
import {BN} from "@partisiablockchain/abi-client";
import {Buffer} from "buffer";

const eCurve = new ec.ec("secp256k1");

/**
 * Generates a new key pair.
 *
 * @return the generated key pair.
 */
function generateKeyPair(): KeyPair {
    return eCurve.genKeyPair();
}

/**
 * Create a shared secret from a private and a public key.
 * @param keyPair the private key.
 * @param publicKey the public key.
 * @return the shared secret.
 */
function createSharedKey(keyPair: KeyPair, publicKey: Buffer): Buffer {
    const pairFromBuffer: KeyPair = eCurve.keyFromPublic(publicKey);
    const sharedRandom = keyPair.derive(pairFromBuffer.getPublic());

    let sharedBuffer = sharedRandom.toArrayLike(Buffer, "be");
    if (sharedRandom.bitLength() % 8 === 0) {
        // Ensure that a sign bit is present in the byte encoding
        sharedBuffer = Buffer.concat([Buffer.alloc(1), sharedBuffer]);
    }
    return hashBuffer(sharedBuffer);
}

/**
 * Create an aes cipher from a private key and the public key of the receiver of the encrypted message.
 *
 * @param keyPair the private key.
 * @param publicKey the public key of the receiver.
 */
function createAesForParty(keyPair: KeyPair, publicKey: Buffer): Cipher {
    const sharedKey = createSharedKey(keyPair, publicKey);
    const iv = sharedKey.subarray(0, 16);
    const secretKey = sharedKey.subarray(16, 32);
    return createCipheriv("aes-128-cbc", secretKey, iv);
}

export interface Signature {
    r: BigNumber;
    s: BigNumber;
    recoveryParam: number | null;
}

/**
 * Determines the recoveryParam for the given signature.
 *
 * @param signature Signature to determine recovery param for.
 * @param msg Signed message.
 * @param publicKeyBuffer Public key to act as reference
 */
function signatureFillInRecoveryId(signature: Signature, msg: Buffer, publicKeyBuffer: Buffer) {
    const keyPair = eCurve.keyFromPublic(publicKeyBuffer);
    const publicKey = keyPair.getPublic();

    const signatureOptions = {
        r: signature.r,
        s: signature.s,
    };

    // NOTE: Type annotations are incorrect for below method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signature.recoveryParam = eCurve.getKeyRecoveryParam(msg as any, {
        r: new BN.BN(signatureOptions.r.toString(16), "hex"),
        s: new BN.BN(signatureOptions.s.toString(16), "hex"),
    }, publicKey as any);
}

/**
 * Serializes a signature into byte.
 *
 * @param signature the signature.
 * @return the bytes.
 */
function signatureToBuffer(signature: Signature): Buffer {
    if (signature.recoveryParam == null) {
        throw new Error("Recovery parameter is null");
    }
    return Buffer.concat([
        Buffer.from([signature.recoveryParam]),
        Buffer.from(signature.r.toString(16), "hex"),
        Buffer.from(signature.s.toString(16), "hex"),
    ]);
}

/**
 * Computes the account address based on a key pair.
 *
 * @param keyPair the keypair of the account.
 * @return the address of the account.
 */
function keyPairToAccountAddress(keyPair: KeyPair): string {
    const publicKey = keyPair.getPublic(false, "array");
    const hash = sha256();
    hash.update(publicKey);
    return "00" + hash.digest("hex").substring(24);
}

/**
 * Creates a keypair based on the private key.
 *
 * @param privateKey the private key as a hex string.
 * @return the keypair.
 */
function privateKeyToKeypair(privateKey: string): KeyPair {
    return eCurve.keyFromPrivate(privateKey, "hex");
}

/**
 * Computes the public key from a private key.
 *
 * @param privateKey the private key.
 * @return the public key.
 */
function privateKeyToPublicKey(privateKey: string): Buffer {
    const keyPair = privateKeyToKeypair(privateKey);
    return Buffer.from(keyPair.getPublic(false, "array"));
}

/**
 * Computes the account address based on a private key.
 *
 * @param privateKey the private key.
 * @return the account address.
 */
function privateKeyToAccountAddress(privateKey: string): string {
    return keyPairToAccountAddress(privateKeyToKeypair(privateKey));
}

/**
 * Computes the account address based on a public key.
 *
 * @param publicKey the public key.
 * @return the account address.
 */
function publicKeyToAccountAddress(publicKey: Buffer): string {
    return keyPairToAccountAddress(eCurve.keyFromPublic(publicKey));
}

/**
 * Hashes the buffers.
 *
 * @param buffers the buffers to be hashed.
 * @return the hash.
 */
function hashBuffers(buffers: Buffer[]): Buffer {
    const hash = sha256();

    for (const buffer of buffers) {
        hash.update(buffer);
    }

    return Buffer.from(hash.digest());
}

/**
 * Hashes the buffer.
 *
 * @param buffer the buffer to be hashed.
 * @return the hash.
 */
function hashBuffer(buffer: Buffer): Buffer {
    return hashBuffers([buffer]);
}

/** A collection of useful crypto functions. */
export const CryptoUtils = {
    generateKeyPair,
    createSharedKey,
    createAesForParty,
    signatureToBuffer,
    keyPairToAccountAddress,
    privateKeyToKeypair,
    privateKeyToPublicKey,
    privateKeyToAccountAddress,
    publicKeyToAccountAddress,
    hashBuffers,
    hashBuffer,
    signatureFillInRecoveryId,
};
