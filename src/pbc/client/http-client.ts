import { BaseClient, type ClientResponse } from './base-client.js';
import type {ContractCore, ContractData} from "../dto/contract-data.dto.js";
import type {AccountData} from "../dto/account-data.dto.js";
import type {ExecutedTransactionDto} from "../dto/transaction-data.dto.js";

export class HttpClient extends BaseClient {
    readonly host: string;

    constructor(host: string) {
        super();

        this.host = host;
    }

    public getContractData<T>(
        address: string,
        withState = true,
        withTrees: boolean = false
    ): Promise<ClientResponse<ContractCore | ContractData<T>>> {
        return this.getRequest(this.host + "/blockchain/contracts/" + address, {
          stateOutput: (withState ? (withTrees ? "DEFAULT" : "BINARY") : "NONE")
        });
    }

    public getContractStateTraverse(address: string): Promise<ClientResponse<{ data: string }>> {
        return this.postRequest(this.host + "/blockchain/contracts/" + address, {
            "path": [
                {"type": "field", "name": "state"}
            ]
        });
    }

    public getAccountData(address: string): Promise<ClientResponse<AccountData>> {
        return this.getRequest<AccountData>(this.host + "/blockchain/account/" + address).then(
            response => {
                if (response.data != null) {
                    response.data.address = address;
                }
                return response;
            }
        );
    }

    public getExecutedTransaction(
        identifier: string,
        requireFinal = true
    ): Promise<ClientResponse<ExecutedTransactionDto>> {
        return this.getRequest(this.host + "/blockchain/transaction/" + identifier, {
          requireFinal: requireFinal
        });
    }
}
