import {WalletConnectionService} from "../wallet/wallet-connection.service";
import {BaseMultiChainContract} from "./base/base-multi-chain.contract";
import {TransactionRunningHelperService} from "../utils/transaction-running-helper.service";
import {UniswapPairAbi} from "../abi/uniswap-pair.abi";
import {BlockchainDefinition} from "../utils/chains";
import {BigNumber} from "bignumber.js";
import {Web3BatchRequest} from "web3-core";

export class UniswapPairContract extends BaseMultiChainContract {
    constructor(walletConnection: WalletConnectionService, transactionHelper: TransactionRunningHelperService) {
        super(walletConnection, transactionHelper);
    }

    protected getAbi(): any {
        return UniswapPairAbi;
    }

    //PROPERTIES
    public async getReserves(
        config: BlockchainDefinition,
        pairAddr: string,
        batch?: Web3BatchRequest,
        callback?: (output: { reserve0: BigNumber, reserve1: BigNumber, blockTimestampLast: number }) => void
    ) {
        return this.getViewMulti(
            config,
            pairAddr,
            (contract) => contract.methods.getReserves(),
            batch,
            callback);
    }

    public async getToken0(
        config: BlockchainDefinition,
        pairAddr: string,
        batch?: Web3BatchRequest,
        callback?: (output: string) => void
    ) {
        return this.getPropertyMulti(
            config,
            pairAddr,
            'token0',
            batch,
            callback);
    }

    public async getToken1(
        config: BlockchainDefinition,
        pairAddr: string,
        batch?: Web3BatchRequest,
        callback?: (output: string) => void
    ) {
        return this.getPropertyMulti(
            config,
            pairAddr,
            'token1',
            batch,
            callback);
    }

    public weth(
        config: BlockchainDefinition,
        routerAddr: string,
        batch?: Web3BatchRequest,
        callback?: (output: string) => void
    ) {
        return this.getPropertyMulti(config, routerAddr, 'WETH', batch, callback);
    }
}
