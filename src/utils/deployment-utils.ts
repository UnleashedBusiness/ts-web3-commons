import {
    BaseContract,
    type ContractDeployTransaction,
    ContractFactory,
    type ContractTransaction,
    getCreateAddress
} from "ethers";
import {getContractFactory} from "@nomicfoundation/hardhat-ethers/types";
import type {HardhatEthersProvider} from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider.js";
import {spawn} from "child_process";
import {ProviderError} from "hardhat/internal/core/providers/errors.js";
import {getContractAt} from "@nomicfoundation/hardhat-ethers/internal/helpers.js";
import type {HardhatRuntimeEnvironment} from "hardhat/types";

export class DeploymentUtils {
    public static execute(command: string, args: string[] = []): Promise<string> {
        return new Promise(function (resolve, reject) {
            const script = spawn(command, args, {stdio: ['inherit', "pipe", "inherit"]});

            script.stdout?.on('data', (data) => {
                resolve(data.toString());
            });

            script.on('error', (err) => {
                reject(err.stack);
            });
        });
    }

    public static async deployContract<Factory extends ContractFactory<any[], BaseContract>>(provider: HardhatEthersProvider, rpc: string, signer: string, name: string, callable: (factory: Factory) => Promise<ContractDeployTransaction>): Promise<string> {
        let routerFactory = await getContractFactory<any[], BaseContract>(name);

        let deployTxn = await callable(routerFactory as unknown as Factory);
        let estimate = await provider.estimateGas(deployTxn).then(x => x * 11n / 10n);
        let nonce = await provider.getTransactionCount(signer);

        await DeploymentUtils.execute("seth", ["send", `--from`, `${signer}`, `--create`, `${deployTxn.data}`, `--rpc-url`, `${rpc}`, `-G`, estimate.toString(), '--nonce', `${nonce}`]).then(x => x.replace("\n", ""));

        return getCreateAddress({from: signer, nonce: nonce});
    }

    public static async methodExecute<T extends BaseContract>(hre: HardhatRuntimeEnvironment, provider: HardhatEthersProvider, rpc: string, signer: string, name: string, address: string, callable: (contract: T) => Promise<ContractTransaction>): Promise<string> {
        let contract = await getContractAt(hre, name, address);
        let methodTxn = await callable(contract as unknown as T);

        let estimate: bigint | undefined;
        try {
            estimate = await provider.estimateGas({...methodTxn, from: signer}).then(x => x * 11n / 10n);
        } catch (e) {
            await provider.call({...methodTxn, from: signer}).catch(x => {
                console.error((x as ProviderError).data);
                throw x;
            });
        }
        let nonce = await provider.getTransactionCount(signer);

        await DeploymentUtils.execute("seth", ["send", `--from`, `${signer}`,  `--rpc-url`, `${rpc}`, `-G`, estimate!.toString(), '--nonce', `${nonce}`, `${address}`, `${methodTxn.data}`]).then(x => x.replace("\n", ""));

        return getCreateAddress({from: signer, nonce: nonce});
    }

    public static async repeatingTransaction<T>(callable: () => Promise<T>) {
        let i = 0;
        let ex;
        while (i < 1) {
            i += 1;
            try {
                return await callable();
            } catch (e) {
                ex = e;
                console.warn('Failed to run transaction! Sleeping....');
                await DeploymentUtils.sleep(i * 100);
            }
        }
        throw ex;
    }

    public static async sleep(ms: number) {
        await new Promise(r => setTimeout(r, ms));
    }
}