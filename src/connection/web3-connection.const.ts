import {
    avalanche,
    avalancheFuji,
    bsc,
    bscTestnet,
    goerli,
    mainnet, opBNB,
    opBNBTestnet,
    polygon,
    polygonMumbai
} from "viem/chains";
import {blockchainIndex} from "../utils/chains";
export const SUPPORTED_WAGMI_CHAINS = [
  mainnet, polygon, polygonMumbai, bsc, bscTestnet, goerli, avalanche, avalancheFuji, opBNBTestnet, opBNB, {
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
},];