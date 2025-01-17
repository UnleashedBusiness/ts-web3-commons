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
    ) {
    }
}

export class PBCChain {
    public static readonly TESTNET = new ChainDefinition(
        18500,
        "TESTNET",
        ["https://node1.testnet.partisiablockchain.com"],
        ["Shard0", "Shard1", "Shard2"],
        {
            WASMDeploy: "0197a0e238e924025bad144aa0c4913e46308f9a4d",
            ZKDeploy: "018bc1ccbb672b87710327713c97d43204905082cb",
        },
    );
    public static readonly MAINNET = new ChainDefinition(
        8500,
        "MAINNET",
        ["https://reader.partisiablockchain.com"],
        ["Shard0", "Shard1", "Shard2"],
        {
            WASMDeploy: "",
            ZKDeploy: "",
        },
    );
}

export const PBCChainsIndex: Record<string, ChainDefinition> = {
    TESTNET: PBCChain.TESTNET,
    MAINNET: PBCChain.MAINNET,
};
