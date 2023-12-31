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

export const blockchainIndex = {
  MUMBAI_TESTCHAIN: new BlockchainDefinition(
    'mumbai',
    80001,
    'Mumbai Polygon Testnet',
    ['https://rpc.ankr.com/polygon_mumbai'],
    'MATIC',
    2,
    'https://mumbai.polygonscan.com/',
  ),
  BSC_TESTCHAIN: new BlockchainDefinition(
    'bnb-testnet',
    97,
    'BNB Testnet',
    [
      'https://data-seed-prebsc-1-s1.binance.org:8545',
      'https://data-seed-prebsc-2-s1.binance.org:8545',
      'https://data-seed-prebsc-2-s1.binance.org:8545',
      'https://data-seed-prebsc-2-s2.binance.org:8545',
    ],
    'TBNB',
    3,
    'https://testnet.bscscan.com/',
  ),
  DMC_TESTCHAIN: new BlockchainDefinition(
    'dmc-testnet',
    1131,
    'DefiChain MetaChain Testnet',
    ['https://dmc.mydefichain.com/testnet', 'https://dmc01.mydefichain.com/testnet'],
    'DFI',
    10,
    'https://testnet3-dmc.mydefichain.com:8445/',
  ),
  BSC: new BlockchainDefinition(
    'binance',
    56,
    'Binance Smart Chain',
    [
      'https://bsc-dataseed.binance.org/',
      'https://bsc-dataseed1.defibit.io/',
      'https://bscrpc.com',
      'https://bsc-dataseed1.ninicoin.io/',
      'https://bsc-dataseed2.binance.org/',
      'https://bsc-dataseed2.defibit.io/',
      'https://bsc-dataseed3.ninicoin.io/',
    ],
    'BNB',
    3,
    'https://bscscan.com/',
  ),
  MATIC: new BlockchainDefinition(
    'matic',
    137,
    'Polygon',
    ['https://polygon-rpc.com'],
    'MATIC',
    2,
    'https://polygonscan.com/',
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
