import {type BlockchainDefinition, fromPBCChainToBlockchainDefinition} from "../utils/chains.js";

const PBC_TESTNET_ID = 18500;
const PBC_MAINNET_ID = 8500;
const PBC_TESTNET_NAME = "TESTNET";
const PBC_MAINNET_NAME = "MAINNET";

export class ChainDefinition {
    constructor(
        public readonly id: number,
        public readonly name: string,
        public readonly rpcList: string[],
        public readonly shards: string[],
        public readonly systemContracts: {
            WASMDeploy: string;
            ZKDeploy: string;
        },
        public readonly explorer: string
    ) {
    }

    public static fromBlockchainDefinition(chain: BlockchainDefinition): ChainDefinition {
        return new ChainDefinition(
            chain.networkId,
            chain.networkId === PBC_TESTNET_ID ? PBC_TESTNET_NAME : PBC_MAINNET_NAME,
            chain.networkRPC,
            chain.extra?.['Shards'] ?? [],
            chain.extra?.['SystemContracts'] ?? {},
            chain.explorerUrl ?? ""
        )
    }

    public toBlockchainDefinition(): BlockchainDefinition {
        return fromPBCChainToBlockchainDefinition(this, 1)
    }
}

export class PBCChain {
    public static readonly TESTNET = new ChainDefinition(
        PBC_TESTNET_ID,
        PBC_TESTNET_NAME,
        ["https://node1.testnet.partisiablockchain.com"],
        ["Shard0", "Shard1", "Shard2"],
        {
            WASMDeploy: "0197a0e238e924025bad144aa0c4913e46308f9a4d",
            ZKDeploy: "018bc1ccbb672b87710327713c97d43204905082cb",
        },
        "https://browser.testnet.partisiablockchain.com/"
    );
    public static readonly MAINNET = new ChainDefinition(
        PBC_MAINNET_ID,
        PBC_MAINNET_NAME,
        ["https://reader.partisiablockchain.com"],
        ["Shard0", "Shard1", "Shard2"],
        {
            WASMDeploy: "",
            ZKDeploy: "",
        },
        "https://browser.partisiablockchain.com/"
    );
}

export const PBCChainsIndex: Record<string, ChainDefinition> = {
    TESTNET: PBCChain.TESTNET,
    MAINNET: PBCChain.MAINNET,
};


export const EmptyPBCAddress = '000000000000000000000000000000000000000000';