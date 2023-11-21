import {BaseMultiChainContract, MethodRunnable} from "./base/base-multi-chain.contract";
import { IEERC721Abi, IEERC721AbiFunctional } from "../abi/ierc721.abi";
import ContractToolkitService from "./utils/contract-toolkit.service";

export class Erc721Contract<FunctionalAbi extends IEERC721AbiFunctional = IEERC721AbiFunctional> extends BaseMultiChainContract<FunctionalAbi> {
    constructor(toolkit: ContractToolkitService) {
        super(toolkit);
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
