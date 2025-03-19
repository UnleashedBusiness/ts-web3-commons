import {fromPBCChainToBlockchainDefinition, PBCChain} from "../pbc/pbc.chains.js";
import {
    arbitrum,
    arbitrumNova,
    avalanche, avalancheFuji,
    bsc,
    bscTestnet, mainnet, opBNB, opBNBTestnet, optimism, optimismSepolia,
    polygon,
    polygonAmoy,
    polygonMumbai,
    polygonZkEvm,
    polygonZkEvmTestnet, sepolia
} from "viem/chains";
import {BlockchainDefinition, fromViemChainToBlockchainDefinition} from "./chains.js";

export const blockchainIndex = {
    MUMBAI_TESTCHAIN: fromViemChainToBlockchainDefinition(polygonMumbai, 2),
    AMOY_TESTCHAIN: fromViemChainToBlockchainDefinition(polygonAmoy, 2),
    ZKEVM_TESTCHAIN: fromViemChainToBlockchainDefinition(polygonZkEvmTestnet, 2),
    MATIC: fromViemChainToBlockchainDefinition(polygon, 4),
    ZKEVM_MAINNET: fromViemChainToBlockchainDefinition(polygonZkEvm, 4),
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
        'https://blockscout.testnet.ocean.jellyfishsdk.com/',
    ),
    DMC_MAINNET: new BlockchainDefinition(
        'dmc-mainnet',
        1130,
        'DefiChain MetaChain',
        ['https://dmc.mydefichain.com/mainnet', 'https://dmc01.mydefichain.com/mainnet'],
        'DFI',
        5,
        'https://blockscout.mainnet.ocean.jellyfishsdk.com/',
    ),
    PBC_TESTNET: fromPBCChainToBlockchainDefinition(PBCChain.TESTNET, 1),
    PBC_MAINNET: fromPBCChainToBlockchainDefinition(PBCChain.MAINNET, 1),
};