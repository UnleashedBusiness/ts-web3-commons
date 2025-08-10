import type { JsonRpcOptionalRequest, Web3 } from 'web3';
import type { Web3BatchRequest } from 'web3-core';

export class BatchRequest {
    private batch: Web3BatchRequest;
    private callbacks: Record<string, (response: string) => Promise<void>> = {};

    private callErrors: Record<string, any> = {};
    private requests: Record<string, JsonRpcOptionalRequest> = {};

    constructor(web3Connection: Web3, _: ((request: JsonRpcOptionalRequest, reason: any) => Promise<void>) | undefined = undefined) {
        this.batch = new web3Connection.BatchRequest();
    }

    public add(request: JsonRpcOptionalRequest, callback: (response: string) => Promise<void>, onError?: (reason: any) => Promise<void>) {
        this.requests[request.id as string] = request;
        const response = this.batch.add(request);
        response.catch(reason => {
            this.callErrors[request.id as string] = reason;

            onError?.(reason);
        });

        this.callbacks[request.id!] = callback;
    }

    public async execute(config: { timeout: number }): Promise<void> {
        if (this.batch.requests.length <= 0) {
            return;
        }

        this.callErrors = {};
        return new Promise(async (resolve, reject) => {
            try {
                const responses = await this.batch.execute(config);

                let errorMessage = 'Batch execution failed! Errors: \n';
                let hasErrors = false;
                let responseCallbacks: Promise<void>[] = [];

                for (let response of responses) {
                    const hasCallError = typeof this.callErrors[response.id!] !== 'undefined';
                    const hasErrorResponse = response.error !== undefined && response.error.code !== undefined;
                    const hasEmptyResponse = response.result === '0x';

                    if (hasCallError || hasErrorResponse || hasErrorResponse) {
                        hasErrors = true;

                        let errorMessageForCall = `[${response.id!}]: ${JSON.stringify(this.requests[response.id!]!)}`;
                        if (hasCallError) {
                            let reasonString = JSON.stringify(this.callErrors[response.id!]);
                            if (reasonString.includes("Batch request timeout")) {
                                errorMessage = reasonString;
                                break;
                            }

                            errorMessageForCall += `, Reason: ${reasonString}`;
                        } else if (hasErrorResponse) {
                            errorMessageForCall += `, Code ${response.error!.code}. Message: ${response.error!.message}, Data: ${JSON.stringify(response.error!.data)}`;
                        } else if (hasEmptyResponse) {
                            errorMessageForCall += `: Empty response received from ETH json rpc!`;
                        }

                        errorMessage += `${errorMessageForCall}\n`;
                    } else {
                        responseCallbacks.push(this.callbacks[response.id!](response.result as string));
                    }
                }

                if (hasErrors) {
                    reject(errorMessage);
                } else {
                    await Promise.all(responseCallbacks);

                    resolve();
                }
            } catch (e) {
                reject(e);
            }
        });
    }
}