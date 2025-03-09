import {BaseClient} from "./base-client.js";
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
    ): Promise<ContractCore | ContractData<T> | undefined> {
        const query = "?stateOutput="
            + (withState ? (withTrees ? "DEFAULT" : "BINARY") : "NONE");

        return this.getRequest(this.host + "/blockchain/contracts/" + address + query);
    }

    public getAccountData(address: string): Promise<AccountData | undefined> {
        return this.getRequest<AccountData>(this.host + "/blockchain/account/" + address).then(
            (response?: AccountData) => {
                if (response != null) {
                    response.address = address;
                }
                return response;
            }
        );
    }

    public getExecutedTransaction(
        identifier: string,
        requireFinal = true
    ): Promise<ExecutedTransactionDto | undefined> {
        const query = "?requireFinal=" + requireFinal;
        return this.getRequest(this.host + "/blockchain/transaction/" + identifier + query);
    }
}
