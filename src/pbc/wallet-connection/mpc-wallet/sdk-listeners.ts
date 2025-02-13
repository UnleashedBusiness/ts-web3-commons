import {jsendForward} from "./jsend.js";

export enum PermissionTypes {
    // CONNECTION = 'connection',
    SIGN = 'sign',
    PRIVATE_KEY = 'private_key',
}

interface IPopupConnection {
    payload: { permissions: PermissionTypes[]; dappName: string; chainId: string }
    windowType: string
    xpub: string
    msgId: string
}

interface IPopupSign {
    payload: string
    windowType: string
    connId: string
}

export async function sdkOpenPopupTab<T>(payload: IPopupConnection | IPopupSign): Promise<T> {
    return new Promise(async (resolve, reject) => {
        const evt = { result: false }

        window.__onPartisiaConfirmWin(payload, evt)
        await onPartisiaCallback(evt, -1)

        jsendForward(evt.result, (err, data) => {
            if (err) reject(err)
            resolve(data)
        })
    })
}
export async function sdkListenTabEvent<T>(tabId: number): Promise<T> {
    return new Promise(async (resolve, reject) => {
        const evt = { result: false }

        window.__onPartisiaWalletTabEvent(tabId, evt)
        await onPartisiaCallback(evt, tabId)

        jsendForward(evt.result, (err, data) => {
            if (err) reject(err)
            resolve(data)
        })
    })
}
const onPartisiaCallback = async (d: { result: Object }, tabId: number) => {
    if (typeof tabId !== 'number') {
        throw new Error("TabId must be a number");
    }

    const sleep = (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    // loop until result has a value
    // this is not as idiomatic as using a callback but it prevents passing a third party callback function below
    while (d.result === false) {
        if (process.env.DEV) console.log('result', d, tabId)
        await sleep(300)
    }
}

