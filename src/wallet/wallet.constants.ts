import {avalanche, avalancheFuji, bsc, bscTestnet, goerli, mainnet, polygon, polygonMumbai} from "@wagmi/chains";
import {blockchainIndex} from "../chains";

export const CONNECTOR_CACHE_KEY = 'connector_cache_wallet';
export const SUPPORTED_WAGMI_CHAINS = [mainnet, polygon, polygonMumbai, bsc, bscTestnet, goerli, avalanche, avalancheFuji, {
    name: "DeFi Meta Chain",
    id: 1133,
    network: "metachainChangi",
    rpcUrls: {
        public: {
            http: blockchainIndex.DMC_TESTCHAIN.networkRPC
        },
        default: {
            http: blockchainIndex.DMC_TESTCHAIN.networkRPC
        }
    },
    nativeCurrency: {
        name: "DFI",
        symbol: "DFI",
        decimals: 18
    }
}, {
    name: "opBNB Chain Testnet",
    id: 5611,
    network: "opbnbtestnet",
    rpcUrls: {
        public: {
            http: ["https://opbnb-testnet-rpc.bnbchain.org"]
        },
        default: {
            http: ["https://opbnb-testnet-rpc.bnbchain.org"]
        }
    },
    nativeCurrency: {
        name: "tBNB",
        symbol: "tBNB",
        decimals: 18
    }
}];