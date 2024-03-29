import {BlockchainDefinition} from "../../utils/chains.js";
import {Web3} from "web3";
import {type WalletClient} from "viem";
import {type ReadOnlyWeb3Connection} from "./read-only-web3-connection.js";
import {BigNumber} from "bignumber.js";

export interface WalletWeb3Connection extends ReadOnlyWeb3Connection {
    get web3(): Web3;

    get walletClient(): WalletClient;

    get blockchain(): BlockchainDefinition;

    get balanceCache(): BigNumber;

    get accounts(): any;

    connectWallet(
        allowedChains: BlockchainDefinition[],
        targetChain?: number,
    ): Promise<void>;

    disconnect(): Promise<void>;

    walletConnected(): boolean;

    isLocalAccountConnected(): boolean;

    signV4(types: any, mainType: string, domain: {
        name: string,
        version: string,
        verifyingContract: string
    }, messageData: any): Promise<string>;

    reloadBalanceCache(): Promise<void>;
}
