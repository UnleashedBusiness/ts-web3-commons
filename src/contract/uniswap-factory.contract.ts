import {BaseMultiChainContract} from "./base/base-multi-chain.contract";
import {WalletConnectionService} from "../wallet/wallet-connection.service";
import {TransactionRunningHelperService} from "../utils/transaction-running-helper.service";
import {UniswapFactoryAbi} from "../abi/uniswap-factory.abi";
import {BlockchainDefinition} from "../utils/chains";
import {Web3BatchRequest} from "web3-core";

export class UniswapFactoryContract extends BaseMultiChainContract {
    constructor(walletConnection: WalletConnectionService, transactionHelper: TransactionRunningHelperService) {
        super(walletConnection, transactionHelper);
    }

    protected getAbi(): any {
        return UniswapFactoryAbi;
    }

    //PROPERTIES
    public async getPair(
        config: BlockchainDefinition,
        factoryAddr: string,
        token0: string,
        token1: string,
        batch?: Web3BatchRequest,
        callback?: (output: string) => void
    ) {
        return this.getViewMulti(
            config,
            factoryAddr,
            contract => contract.methods.getPair(token0, token1),
            batch,
            callback);
    }
}
