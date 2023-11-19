import {
    avalanche,
    avalancheFuji,
    bsc,
    bscTestnet,
    goerli,
    mainnet, opBNB,
    opBNBTestnet,
    polygon,
    polygonMumbai,
} from "viem/chains";
import { blockchainIndex, DefaultEVMNativeTokenDecimals } from "../utils/chains";
export const SUPPORTED_WAGMI_CHAINS = [
  mainnet, polygon, polygonMumbai, bsc, bscTestnet, goerli, avalanche, avalancheFuji, opBNBTestnet, opBNB, {
    name:  blockchainIndex.DMC_TESTCHAIN.networkName,
    id: blockchainIndex.DMC_TESTCHAIN.networkId,
    network: blockchainIndex.DMC_TESTCHAIN.network,
    rpcUrls: {
        public: {
            http: blockchainIndex.DMC_TESTCHAIN.networkRPC
        },
        default: {
            http: blockchainIndex.DMC_TESTCHAIN.networkRPC
        }
    },
    nativeCurrency: {
        name: blockchainIndex.DMC_TESTCHAIN.networkSymbol,
        symbol: blockchainIndex.DMC_TESTCHAIN.networkSymbol,
        decimals: DefaultEVMNativeTokenDecimals
    }
},{
    name:  blockchainIndex.DMC_MAINNET.networkName,
    id: blockchainIndex.DMC_MAINNET.networkId,
    network: blockchainIndex.DMC_MAINNET.network,
    rpcUrls: {
      public: {
        http: blockchainIndex.DMC_MAINNET.networkRPC
      },
      default: {
        http: blockchainIndex.DMC_MAINNET.networkRPC
      }
    },
    nativeCurrency: {
      name: blockchainIndex.DMC_MAINNET.networkSymbol,
      symbol: blockchainIndex.DMC_MAINNET.networkSymbol,
      decimals: DefaultEVMNativeTokenDecimals
    }
  }];