import {
    BasePBCSmartContract, BasePBCSmartContractInstance, ChainDefinition,
    type ConnectedWalletInterface, NotificationService,
    PartisiaBlockchainService, PBCChain, PrivateKeyConnectedWallet,
    TransactionRunningHelperService
} from "../src/index.js";
import {BigNumber} from "bignumber.js";
import {BN} from "@partisiablockchain/abi-client";
import {CryptoUtils} from "@partisiablockchain/zk-client";
import type {StructTypeSpec} from "@partisiablockchain/abi-client/target/main/types/StructTypeSpec.js";


export class TokenBridgeContract extends BasePBCSmartContract {
    public static readonly GAS_DEPOSIT_CALL = 30000;

    constructor(
        pbcWalletConnection: ConnectedWalletInterface,
        transactionHelper: TransactionRunningHelperService
    ) {
        super(new PartisiaBlockchainService(), pbcWalletConnection, transactionHelper);
    }

    // @ts-ignore
    public buildInstance(chain: ChainDefinition, contractAddress: string): TokenBridgeContractInstance {
        return new TokenBridgeContractInstance(this, chain, contractAddress);
    }
}

export class TokenBridgeContractInstance extends BasePBCSmartContractInstance<TokenBridgeContract> {
    constructor(
        contract: TokenBridgeContract,
        chain: ChainDefinition,
        address: string,
    ) {
        super(contract, chain, address);
    }

    public deposit(targetBlockchain: number, toAddress: string, amount: BigNumber): Promise<string> {
        return this.send(
            "deposit",
            builder => {
                builder.addU128(new BN.BN(amount.toFixed()));
                builder.addU32(targetBlockchain);
                builder.addAddress(toAddress);

                return builder.getBytes();
            },
            TokenBridgeContract.GAS_DEPOSIT_CALL
        );
    }
}


new Promise(async () => {
    const chain = PBCChain.TESTNET;
    chain.rpcList[0] = "https://pbc-testnet.unleashed-business.com:8443";
    const privateKey = CryptoUtils.generateKeyPair();
    const address =  CryptoUtils.privateKeyToAccountAddress(privateKey.getPrivate().toString(16));
    const executorWallet = new PrivateKeyConnectedWallet(
        address,
        privateKey,
        chain
    );
    await executorWallet.connect();
    const contract = new TokenBridgeContract(executorWallet, new TransactionRunningHelperService(new NotificationService()));
    const instance = contract.buildInstance(chain, "0255a41ee56dc1b592f1b5069412aa37d603d04f53");

    await instance.callView(
        async (state, trees, namedTypes) => {
            const tree = trees[1](namedTypes['BridgeQueueElement'] as StructTypeSpec, true, value => value.structValue().getFieldValue("timestamp")!.asBN().toString());
            let entry = await tree.getByKey(new BN.BN("256").toBuffer("le", 16));
            console.log(entry);
        },
        [1]
    )
    console.timeEnd("refer");

    await instance.deposit(1131, address, new BigNumber(1));
}).catch(e => console.log(e)).then();