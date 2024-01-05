import {
  arbitrum,
  arbitrumNova,
  avalanche,
  avalancheFuji,
  bsc,
  bscTestnet,
  mainnet, opBNB,
  opBNBTestnet, optimism, optimismSepolia,
  polygon,
  polygonMumbai, sepolia
} from "viem/chains";
import { blockchainIndex, DefaultEVMNativeTokenDecimalSize } from "../utils/chains";
export const SUPPORTED_WAGMI_CHAINS = [
  sepolia,
  mainnet,
  polygonMumbai,
  polygon,
  bscTestnet,
  bsc,
  avalancheFuji,
  avalanche,
  opBNBTestnet,
  opBNB,
  arbitrumNova,
  arbitrum,
  optimismSepolia,
  optimism,
  {
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
        decimals: DefaultEVMNativeTokenDecimalSize
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
      decimals: DefaultEVMNativeTokenDecimalSize
    }
  }];