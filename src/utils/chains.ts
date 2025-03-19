import type {Chain} from "viem/chains";

export class BlockchainDefinition {
    public readonly isPBC: boolean;

    constructor(
        public readonly network: string,
        public readonly networkId: number,
        public readonly networkName: string,
        public readonly networkRPC: string[],
        public readonly networkSymbol: string,
        public readonly blockTime: number,
        public readonly explorerUrl?: string,
        isPBC?: boolean,
        public readonly extra?: Record<string, any>,
    ) {
        this.isPBC = isPBC ?? false;
    }
}

export function fromViemChainToBlockchainDefinition(chain: Chain, blockTime: number): BlockchainDefinition {
    return new BlockchainDefinition(
        "chain_" + chain.id,
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
        chain.blockExplorers?.default.url,
    );
}

export const EmptyAddress = '0x0000000000000000000000000000000000000000';
export const DeadAddress = '0x000000000000000000000000000000000000DEAD';

export const EmptyBytes32 = new Array(32).fill(0) as number[];
export const DefaultEVMNativeTokenDecimals = 10 ** 18;
export const DefaultEVMNativeTokenDecimalSize = 18;
