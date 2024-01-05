import {
  arbitrum, arbitrumNova,
  avalanche, avalancheFuji,
  bsc,
  bscTestnet,
  Chain,
  mainnet,
  opBNB,
  opBNBTestnet,
  optimism, optimismSepolia,
  polygon,
  polygonMumbai,
  sepolia
} from "viem/chains";

export class BlockchainDefinition {
  constructor(
    public readonly network: string,
    public readonly networkId: number,
    public readonly networkName: string,
    public readonly networkRPC: string[],
    public readonly networkSymbol: string,
    public readonly blockTime: number,
    public readonly explorerUrl: string,
  ) {}
}

export function fromViemChainToBlockchainDefinition(chain: Chain, blockTime: number): BlockchainDefinition {
  return new BlockchainDefinition(
    chain.network,
    chain.id,
    chain.name,
    [
      ...chain.rpcUrls.default.http,
      ...Object.keys(chain.rpcUrls)
        .filter((x) => x !== 'default' && x !== 'public')
        .map((x) => chain.rpcUrls[x].http)
        .flat(),
    ],
    chain.nativeCurrency.symbol,
    blockTime,
    chain.blockExplorers.default.url,
  );
}

export const blockchainIndex = {
  MUMBAI_TESTCHAIN: fromViemChainToBlockchainDefinition(polygonMumbai, 2),
  MATIC: fromViemChainToBlockchainDefinition(polygon, 2),
  BSC_TESTCHAIN: fromViemChainToBlockchainDefinition(bscTestnet, 3),
  BSC: fromViemChainToBlockchainDefinition(bsc, 3),
  OPBNB_TESTNET: fromViemChainToBlockchainDefinition(opBNBTestnet, 1),
  OPBNB: fromViemChainToBlockchainDefinition(opBNB, 1),
  SEPOLIA_TESTCHAIN: fromViemChainToBlockchainDefinition(sepolia, 12),
  MAINNET: fromViemChainToBlockchainDefinition(mainnet, 12),
  OPTIMISM_SEPOLIA_TESTCHAIN: fromViemChainToBlockchainDefinition(optimismSepolia, 2),
  OPTIMISM: fromViemChainToBlockchainDefinition(optimism, 12),
  AVALANCHE_C_CHAIN_FUJI_TESTNET: fromViemChainToBlockchainDefinition(avalanche, 0.5),
  AVALANCHE_C_CHAIN: fromViemChainToBlockchainDefinition(avalancheFuji, 0.5),
  ARBITRUM_NOVA: fromViemChainToBlockchainDefinition(arbitrumNova, 0.25),
  ARBITRUM: fromViemChainToBlockchainDefinition(arbitrum, 0.255),
  DMC_TESTCHAIN: new BlockchainDefinition(
    'dmc-testnet',
    1131,
    'DefiChain MetaChain Testnet',
    ['https://dmc.mydefichain.com/testnet', 'https://dmc01.mydefichain.com/testnet'],
    'DFI',
    10,
    'https://testnet3-dmc.mydefichain.com:8445/',
  ),
  DMC_MAINNET: new BlockchainDefinition(
    'dmc-mainnet',
    1130,
    'DefiChain MetaChain',
    ['https://dmc.mydefichain.com/mainnet', 'https://dmc01.mydefichain.com/mainnet'],
    'DFI',
    5,
    'https://mainnet-dmc.mydefichain.com:8441/',
  ),
};

export const EmptyAddress = '0x0000000000000000000000000000000000000000';
export const DeadAddress = '0x000000000000000000000000000000000000DEAD';

export const DefaultEVMNativeTokenDecimals = 10 ** 18;
export const DefaultEVMNativeTokenDecimalSize = 18;
