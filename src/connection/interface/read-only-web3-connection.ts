import {BlockchainDefinition} from "../../utils/chains.js";
import {Web3} from "web3";
import {type PublicClient} from "viem";

export interface ReadOnlyWeb3Connection {
    getWeb3ReadOnly(chain: BlockchainDefinition): Web3;

    getReadOnlyClient(chain: BlockchainDefinition): PublicClient;
}