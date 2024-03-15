import type {JsonRpcOptionalRequest, Web3} from "web3";
import type {Web3BatchRequest} from "web3-core";

export class BatchRequest {
    private batch: Web3BatchRequest;
    private callbacks: Record<string, (response: string) => Promise<void>> = {};

    constructor(web3Connection: Web3) {
        this.batch = new web3Connection.BatchRequest();
    }

    public add(request: JsonRpcOptionalRequest, callback: (response: string) => Promise<void>) {
        this.batch.add(request);
        this.callbacks[request.id!] = callback;
    }

    public async execute(config: { timeout: number }): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const responses = await this.batch.execute(config);
            let i = 0;
            for (const response of responses) {
                this.callbacks[response.id!](response.result as string)
                    .then(() => {
                        i += 1;
                        if (i >= responses.length) {
                            resolve();
                        }
                    }).catch(reject);

            }
        });
    }
}