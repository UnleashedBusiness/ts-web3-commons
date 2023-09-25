import {BaseMultiChainContract, MethodRunnable} from "./base/base-multi-chain.contract";
import {IEERC721Abi} from "../abi/ierc721.abi";
import {WalletConnectionService} from "../wallet/wallet-connection.service";
import {TransactionRunningHelperService} from "../utils/transaction-running-helper.service";

export class Erc721Contract extends BaseMultiChainContract {
    constructor(walletConnection: WalletConnectionService, transactionHelper: TransactionRunningHelperService) {
        super(walletConnection, transactionHelper);
    }

    protected getAbi(): typeof IEERC721Abi {
        return IEERC721Abi;
    }

    public safeTransfer(contractAddress: string, from: string, toAddress: string, tokenId: number): MethodRunnable {
        return this.buildMethodRunnableMulti(
            contractAddress,
            async (contract, connectedAddress) => contract.methods.safeTransferFrom(from, toAddress, tokenId)
        );
    }
}
