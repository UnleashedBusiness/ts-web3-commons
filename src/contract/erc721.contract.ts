import {BaseMultiChainContract, MethodRunnable} from "./base/base-multi-chain.contract";
import { IEERC721Abi, IEERC721AbiFunctional } from "../abi/ierc721.abi";
import {TransactionRunningHelperService} from "../utils/transaction-running-helper.service";
import { ReadOnlyWeb3Connection } from "../connection/interface/read-only-web3-connection";

export class Erc721Contract<FunctionalAbi extends IEERC721AbiFunctional = IEERC721AbiFunctional> extends BaseMultiChainContract<FunctionalAbi> {

    constructor({ web3Connection, transactionHelper }: {
        web3Connection: ReadOnlyWeb3Connection,
        transactionHelper: TransactionRunningHelperService
    }) {
        super(web3Connection, transactionHelper);
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
