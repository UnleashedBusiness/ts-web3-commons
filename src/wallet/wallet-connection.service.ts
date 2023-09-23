import Web3 from "web3";
import {recoverTypedSignature, SignTypedDataVersion} from "@metamask/eth-sig-util";
import {
    BlockchainDefinition,
    DefaultEVMNativeTokenDecimals,
} from "../chains";
import {BigNumber} from "bignumber.js";
import {
    createPublicClient,
    createWalletClient,
    custom,
    fallback,
    http,
    PublicClient,
    WalletClient
} from "viem";
import {MetaMaskConnector} from "@wagmi/connectors/metaMask";
import {WalletConnectConnector} from "@wagmi/connectors/walletConnect";
import {Connector} from "@wagmi/connectors";
import {
    Config,
    configureChains,
    connect,
    createConfig,
    InjectedConnector, watchAccount,
    watchNetwork
} from "@wagmi/core";
import {CONNECTOR_CACHE_KEY, SUPPORTED_WAGMI_CHAINS} from "./wallet.constants";
import {publicProvider} from "@wagmi/core/dist/providers/public";

export class WalletConnectionService {
    private _wagmiClient?: Config<PublicClient> = undefined;
    private _connector?: Connector = undefined;
    private _web3?: Web3 = undefined;
    private _connectedBlockchainDefinition?: BlockchainDefinition = undefined;
    private _web3ReadOnlyClients: Map<number, Web3> = new Map<number, Web3>();
    private _viemReadOnlyClients: Map<number, PublicClient> = new Map<number, PublicClient>();
    private _walletClient?: WalletClient = undefined;

    private _accounts: any = [];
    private _balanceCache: BigNumber = new BigNumber(0);

    public get web3(): Web3 {
        return this._web3!;
    }

    public get walletClient(): WalletClient {
        return this._walletClient!;
    }

    public get blockchain() {
        return this._connectedBlockchainDefinition!;
    }

    public get balanceCache(): BigNumber {
        return this._balanceCache;
    }

    public get accounts(): any {
        return this._accounts;
    }

    constructor(
        private readonly walletConnectProviderId: string,
        private readonly fetchConnectorCallable: (connectors: Connector<any, any>[], walletConnectProviderId: string) => Promise<Connector<any, any>>,
    ) {
    }

    public getWeb3ReadOnly(chain: BlockchainDefinition): any {
        if (!this._web3ReadOnlyClients.has(chain.networkId))
            this._web3ReadOnlyClients.set(chain.networkId, new Web3(new Web3.providers.HttpProvider(chain.networkRPC[0], {})));
        return this._web3ReadOnlyClients.get(chain.networkId);
    }

    public getReadOnlyClient(chain: BlockchainDefinition): PublicClient {
        if (!this._viemReadOnlyClients.has(chain.networkId)) {
            const wagmiChainFiltered = SUPPORTED_WAGMI_CHAINS
                .filter(x => x.id === chain.networkId);

            if (wagmiChainFiltered.length <= 0) {
                throw new Error("Chain is unsupported!");
            }

            const wagmiChain = wagmiChainFiltered[0];
            this._viemReadOnlyClients.set(chain.networkId, createPublicClient({
                chain: wagmiChain,
                transport: fallback(
                    chain.networkRPC.map(value => http(value))
                )
            }));
        }

        return this._viemReadOnlyClients.get(chain.networkId) as PublicClient;
    }

    async connectWallet(
        allowedChains: BlockchainDefinition[],
        targetChain?: number
    ): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const chainsList: any[] = [];
                for (const chain of SUPPORTED_WAGMI_CHAINS) {
                    if (allowedChains.filter(x => x.networkId === chain.id).length > 0) {
                        chainsList.push(chain);
                    }
                }
                const {chains, publicClient, webSocketPublicClient} = configureChains(
                    chainsList,
                    [publicProvider()],
                )
                this._wagmiClient = createConfig({
                    autoConnect: false,
                    connectors: [
                        new MetaMaskConnector({chains}),
                        new WalletConnectConnector({
                            chains,
                            options: {
                                projectId: this.walletConnectProviderId
                            }
                        }),
                        new InjectedConnector({
                            chains,
                            options: {
                                name: 'Injected',
                                shimDisconnect: true,
                            },
                        }),
                    ],
                    publicClient: publicClient,
                    webSocketPublicClient: webSocketPublicClient
                })

                if (allowedChains.filter(x => x.networkId === targetChain).length === 0) {
                    targetChain = undefined;
                }

                let targetChainDefinition: BlockchainDefinition | undefined = undefined;
                if (targetChain !== undefined) {
                    targetChainDefinition = allowedChains.filter(x => x.networkId === targetChain)[0];
                }

                const cache = localStorage.getItem(CONNECTOR_CACHE_KEY);
                if (cache !== null) {
                    const filteredConnectors = this._wagmiClient.connectors.filter(x => x.id === cache);
                    if (filteredConnectors.length === 1) {
                        this._connector = filteredConnectors[0];
                    }
                }

                if (this._connector === undefined) {
                    this._connector = await this.fetchConnectorCallable(this._wagmiClient.connectors, this.walletConnectProviderId) as Connector;
                }
                const connection = await connect({
                    chainId: targetChain,
                    connector: this._connector
                })

                const account = connection.account;
                const selectedChain = connection.chain.id;
                this._connectedBlockchainDefinition = targetChainDefinition
                    ?? allowedChains.filter(x => x.networkId === selectedChain)[0];
                this._walletClient = createWalletClient({
                    // @ts-ignore
                    transport: custom(connection.provider),
                })

                watchNetwork(_ => {
                    this.disconnect();
                })

                watchAccount(_ => {
                    this.disconnect();
                });

                this._accounts = [account];
                this._web3 = new Web3((connection as any).provider);
                await this.reloadBalanceCache();

                localStorage.setItem(CONNECTOR_CACHE_KEY, this._connector!.id);

                resolve();
            } catch (e) {
                console.log(e);
                reject("Failed to connect with wallet! Please, check if you are compatible with web3 and try again ");
            }
        })
    }

    async disconnect() {
        this._web3 = undefined;
        this._connectedBlockchainDefinition = undefined;
        await this._wagmiClient.destroy();
        this._wagmiClient = undefined;
        this._connector = undefined;
        this._accounts = [];

        localStorage.removeItem(CONNECTOR_CACHE_KEY);
    }

    walletConnected(): boolean {
        return this._wagmiClient !== undefined
            && this._wagmiClient!.status == "connected"
            && this._walletClient !== undefined
            && this._accounts.length > 0;
    }

    async signV4(types: any, mainType: string, domain: {
        name: string,
        version: string,
        verifyingContract: string
    }, messageData: any): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                const signData: any = {
                    types: {
                        EIP712Domain: [
                            {name: "name", type: "string"},
                            {name: "version", type: "string"},
                            {name: "chainId", type: "uint256"},
                            {name: "verifyingContract", type: "address"},
                        ],
                        ...types
                    },
                    domain: {
                        name: domain.name,
                        version: domain.version,
                        chainId: this._connectedBlockchainDefinition.networkId,
                        verifyingContract: domain.verifyingContract
                    },
                    primaryType: mainType,
                    message: messageData,
                };

                const msgParams = JSON.stringify(signData);
                const params = [this.accounts[0], msgParams];

                const web3local = this._web3;
                const accountLocal = this.accounts[0];
                await (this._web3!.currentProvider! as any).sendAsync(
                    {
                        method: 'eth_signTypedData_v4',
                        params,
                        from: accountLocal,
                    },
                    function (err: any, result: any) {
                        if (err) return reject(err);
                        if (result.error) return reject(result.error.message);
                        const signature = result.result;

                        if (web3local!.utils.toChecksumAddress(accountLocal) !== web3local!.utils.toChecksumAddress(recoverTypedSignature({
                            data: signData,
                            version: SignTypedDataVersion.V4,
                            signature: signature
                        }))) {
                            reject("Signature failed to match original sender!");
                        }

                        resolve(signature);
                    }
                );
            } catch (e) {
                reject(e);
            }
        });
    }

    async reloadBalanceCache() {
        const client = this.getWeb3ReadOnly(this._connectedBlockchainDefinition);
        const balanceFromClient = await client.eth.getBalance(this.accounts[0]);
        this._balanceCache = new BigNumber(balanceFromClient.toString()).dividedBy(DefaultEVMNativeTokenDecimals);
    }
}
