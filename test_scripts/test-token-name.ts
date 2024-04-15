import {
  blockchainIndex,
  ContractGeneralConfig,
  ContractToolkitService, EmptyAddress,
  NotificationService,
  ReadOnlyWeb3ConnectionService,
  TransactionRunningHelperService,
  Web3Contract,
} from '../src/index.js';
import { Erc20Abi, type Erc20AbiFunctional } from '../src/index.js';
import {BatchRequest} from "../src/contract/utils/batch-request.js";

const web3Connection = new ReadOnlyWeb3ConnectionService();
const transactionHelper = new TransactionRunningHelperService(new NotificationService());
const toolkit = new ContractToolkitService(web3Connection, transactionHelper, {} as ContractGeneralConfig);

const contract = new Web3Contract<Erc20AbiFunctional>(toolkit, Erc20Abi);

const config = blockchainIndex.MUMBAI_TESTCHAIN;
const client = web3Connection.getWeb3ReadOnly(config);

const batch = new BatchRequest(client);
const token = '0x9c3c9283d3e44854697cd22d3faa240cfb032889';
/*
contract.views.name(config, token, {}).then((value) => console.log(value));
contract.views.name(config, token, {}, batch).then((result) => console.log(result));
contract.views
  .balanceOf(config, token, { account: EmptyAddress })
  .then(bigNumberPipe)
  .then(scaleForTokenPipe(config, contract, token))
  .then((value) => console.log(value.toFixed()));

batch.execute({ timeout: 30_000 });
const instance = contract.readOnlyInstance(config, token);
instance.totalSupply({})
  .then(bigNumberPipe)
  .then(scaleForTokenPipe(config, contract, token))
  .then((x) => console.log(x.toFixed()));

console.log(bn_wrap("1000000000000000000000000").toFixed());*/
new Promise(async () => {
  const batchEmpty = new BatchRequest(client);
  await batchEmpty.execute({timeout: 20_000});

  await contract.views.name(config, token, {}, batch, async x => console.log(x, 1))
  await  contract.views.name(config, token, {}, batch, x => console.log(x));
  await contract.views.name(config, token, {}, batch, x => console.log(x));
  await contract.views.name(config, token, {}, batch, async x => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(4, x);
  });
  await contract.views.name(config, token, {}, batch, x => console.log(x));
  await contract.views.name(config, token, {}, batch, x => console.log(x));
  await contract.views.name(config, token, {}, batch, x => console.log(x));
  await contract.views.name(config, token, {}, batch, x => console.log(x));
  await contract.views.name(config, token, {}, batch, x => console.log(x));
  await contract.views.balanceOf(config, token, {account: EmptyAddress}, batch, x => console.log(x));

  await batch.execute({ timeout: 30_000 });

  console.log('emd');
}).catch(e => console.log(e)).then();