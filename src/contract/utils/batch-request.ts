import type {JsonRpcOptionalRequest, Web3} from "web3";
import type {Web3BatchRequest} from "web3-core";

export class BatchRequest {
    private batch: Web3BatchRequest;
    private callbacks: Record<string, (response: string) => Promise<void>> = {};

    private readonly defaultErrorHandler: (request: JsonRpcOptionalRequest, reason: any) => Promise<void> = async (request, reason) => {
        console.warn(`Unhandled error for request in batch! Request: ${JSON.stringify(request)}, Error: ${reason}`);
    };

    constructor(web3Connection: Web3, defaultErrorHandler: ((request: JsonRpcOptionalRequest, reason: any) => Promise<void>) | undefined = undefined) {
        this.batch = new web3Connection.BatchRequest();
        if (defaultErrorHandler !== undefined) {
            this.defaultErrorHandler = defaultErrorHandler;
        }
    }

    public add(request: JsonRpcOptionalRequest, callback: (response: string) => Promise<void>, onError?: (reason: any) => Promise<void>) {
        const response = this.batch.add(request);
        if (onError !== undefined) {
            response.catch(onError);
        } else {
            response.catch(reason => this.defaultErrorHandler(request, reason));
        }
        this.callbacks[request.id!] = callback;
    }

    public async execute(config: { timeout: number }): Promise<void> {
        if (this.batch.requests.length <= 0) {
            return;
        }

        return new Promise(async (resolve, reject) => {
            try {
                const responses = await this.batch.execute(config);

                let i = 0;
                for (const response of responses) {
                    if (response.error !== undefined && response.error.code !== undefined) {
                        reject(`Error received from ETH json rpc with code ${response.error.code}. Message: ${response.error.data}, Data: ${JSON.stringify(response.error.data)}`);
                        return;
                    }
                    this.callbacks[response.id!](response.result as string)
                        .then(() => {
                            i += 1;
                            if (i >= responses.length) {
                                resolve();
                            }
                        }).catch(reject);
                }
            } catch (e) {
                reject(e);
            }
        });
    }
}