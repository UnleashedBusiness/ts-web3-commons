import {PermissionTypes, sdkListenTabEvent, sdkOpenPopupTab} from './sdk-listeners.js'
import {Buffer} from "buffer";
import {decryptMessage, encryptMessage, entropyToMnemonic, getKeyPairHD} from "./wallet.js";
import {randomBytes} from "ethers";
import {deserializeBSONWithoutOptimiser, serializeBSONWithoutOptimiser} from "@deepkit/bson";
import type {Elliptic} from "../elliptic/interfaces.js";

declare global {
    interface Window {
        __onPartisiaConfirmWin: Function
        __onPartisiaWalletTabEvent: Function
    }
}

export interface ISdkConnection {
    account: { address: string; pub: string }
    popupWindow: { tabId: number; box: string }
}

export class PartisiaSdk {
    readonly seed: string
    private _connection?: ISdkConnection = undefined

    constructor(
        private readonly elliptic: Elliptic,
        args: { seed?: Buffer | string; connection?: ISdkConnection } = {}
    ) {
        const {seed, connection} = args
        if (seed) {
            this.seed = typeof seed === 'string' ? seed : Buffer.from(seed).toString('hex')
            if (connection) {
                this._connection = connection
            }
        } else {
            this.seed = Buffer.from(randomBytes(32)).toString("hex");
        }
    }

    async connect(args: { permissions: PermissionTypes[]; dappName: string; chainId: string }) {
        if (
            typeof window.__onPartisiaConfirmWin !== 'function' ||
            typeof window.__onPartisiaWalletTabEvent !== 'function'
        ) {
            throw new Error('Extension not Found');
        }

        const hd = getKeyPairHD(this.elliptic, entropyToMnemonic(this.seed), 0)

        const payloadOpenConfirm = {
            payload: args,
            windowType: 'connection',
            xpub: hd.xpub,
            msgId: hd.publicKey,
        }

        const popupWindow = await sdkOpenPopupTab<{ tabId: number; box: string }>(payloadOpenConfirm)
        const {payload} = await sdkListenTabEvent<{ tabId: number; payload: string }>(popupWindow.tabId)

        const decrypted = decryptMessage(this.elliptic, hd.privateKey, payload);

        const account = deserializeBSONWithoutOptimiser(decrypted);
        this._connection = {account, popupWindow}
    }

    async signMessage(args: {
        contract?: string,
        payload: string,
        payloadType: 'utf8' | 'hex' | 'hex_payload',
        dontBroadcast?: boolean
    }) {
        if (!this.isConnected) {
            throw new Error('You must connect the Dapp first');
        }

        const {payload, payloadType, contract, dontBroadcast} = args
        const obj = {payload, payloadType, dontBroadcast}
        if (payloadType === 'hex_payload') {
            if (typeof contract !== 'string' || contract?.length === 42) {
                throw new Error('must supply Contract for hex_payload type');
            }

            obj.payload = `${contract}${obj.payload}`
        }

        const publicKey = this.connection!.popupWindow.box
        const enc = encryptMessage(this.elliptic, publicKey, Buffer.from(serializeBSONWithoutOptimiser(obj))).toString('hex')

        const hd = getKeyPairHD(this.elliptic, entropyToMnemonic(this.seed), 0)
        const payloadWindowSign = {
            payload: enc,
            windowType: PermissionTypes.SIGN,
            connId: hd.publicKey,
        }
        const popupSign = await sdkOpenPopupTab<{ tabId: number }>(payloadWindowSign)
        const popupData = await sdkListenTabEvent<{ tabId: number; payload: string, hd_idx: number }>(popupSign.tabId)
        const hdWallet = getKeyPairHD(this.elliptic, entropyToMnemonic(this.seed), popupData.hd_idx)

        return deserializeBSONWithoutOptimiser(decryptMessage(this.elliptic, Buffer.from(hdWallet.privateKey, 'hex'), popupData.payload)) as {
            signature: string
            serializedTransaction: string
            digest: string
            trxHash: string
            isFinalOnChain: boolean
        };
    }

    get isConnected() {
        return !!this._connection
    }

    get connection() {
        return this._connection
    }
}
