import {Web3} from "web3";
import {BlockchainDefinition} from "../utils/chains.js";
import {createPublicClient, fallback, http, type PublicClient} from "viem";
import {SUPPORTED_WAGMI_CHAINS} from "./web3-connection.const.js";
import {type ReadOnlyWeb3Connection} from "./interface/read-only-web3-connection.js";

export class ReadOnlyWeb3ConnectionService implements ReadOnlyWeb3Connection {
    private _web3ReadOnlyClients: Map<number, Web3> = new Map<number, Web3>();
    private _viemReadOnlyClients: Map<number, PublicClient> = new Map<number, PublicClient>();

    constructor() {
    }

    public getWeb3ReadOnly(chain: BlockchainDefinition): Web3 {
        if (!this._web3ReadOnlyClients.has(chain.networkId))
            this._web3ReadOnlyClients.set(
                chain.networkId,
                new Web3(new Web3.providers.HttpProvider(chain.networkRPC[0])),
            );
        return this._web3ReadOnlyClients.get(chain.networkId)!;
    }

    public getReadOnlyClient(chain: BlockchainDefinition): PublicClient {
        if (!this._viemReadOnlyClients.has(chain.networkId)) {
            const wagmiChainFiltered = SUPPORTED_WAGMI_CHAINS.filter(
                (x) => x.id === chain.networkId,
            );

            if (wagmiChainFiltered.length <= 0) {
                throw new Error("Chain is unsupported!");
            }

            const wagmiChain = wagmiChainFiltered[0];

            this._viemReadOnlyClients.set(
                chain.networkId,
                // @ts-ignore
                createPublicClient({
                    chain: wagmiChain,
                    transport: fallback(chain.networkRPC.map((value) => http(value))),
                }) as PublicClient,
            );
        }

        return this._viemReadOnlyClients.get(chain.networkId) as PublicClient;
    }
}
