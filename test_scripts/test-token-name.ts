import {
  blockchainIndex,
  ContractGeneralConfig,
  ContractToolkitService,
  NotificationService,
  ReadOnlyWeb3ConnectionService,
  TransactionRunningHelperService,
  Web3Contract,
} from '../src/index.js';
import { Erc20Abi, type Erc20AbiFunctional } from '../src/abi/erc20.abi.js';

const web3Connection = new ReadOnlyWeb3ConnectionService();
const transactionHelper = new TransactionRunningHelperService(new NotificationService());
const toolkit = new ContractToolkitService(web3Connection, transactionHelper, {} as ContractGeneralConfig);

const contract = new Web3Contract<Erc20AbiFunctional>(toolkit, Erc20Abi);
const config = blockchainIndex.MUMBAI_TESTCHAIN;

const batch = new (web3Connection.getWeb3ReadOnly(config).BatchRequest)();
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


contract.views.name(config, token, {}, batch).then(x => console.log(x));
contract.views.name(config, token, {}, batch).then(x => console.log(x));
batch.execute({ timeout: 30_000 }).then(x => console.log(x))