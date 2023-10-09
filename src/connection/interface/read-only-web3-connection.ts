import { BlockchainDefinition } from "../../utils/chains";
import Web3 from "web3";
import { PublicClient } from "viem";

export interface ReadOnlyWeb3Connection {
  getWeb3ReadOnly(chain: BlockchainDefinition): Web3;
  getReadOnlyClient(chain: BlockchainDefinition): PublicClient;
}