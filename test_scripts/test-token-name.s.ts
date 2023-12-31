import {
  blockchainIndex,
  ContractGeneralConfig,
  ContractToolkitService,
  EmptyAddress,
  NotificationService,
  ReadOnlyWeb3ConnectionService,
  TransactionRunningHelperService,
  Web3Contract,
} from '../src';
import { Erc20Abi, Erc20AbiFunctional } from '../src/abi/erc20.abi';
import { bigNumberPipe, scaleForTokenPipe } from "../src/utils/contract-pipe.utils";
import { v4 as uuidv4 } from "uuid";
import { decodeMethodReturn } from "web3-eth-contract/lib/types";
import { bn_wrap } from "../src/utils/big-number.utils";
import BigNumber from "bignumber.js";

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