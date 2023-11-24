import {
  blockchainIndex,
  ContractGeneralConfig,
  ContractToolkitService,
  EmptyAddress,
  NotificationService,
  NumericResult,
  ReadOnlyWeb3ConnectionService,
  TransactionRunningHelperService,
  Web3Contract,
} from '../src';
import { Erc20Abi, Erc20AbiFunctional } from '../src/abi/erc20.abi';
import BigNumber from 'bignumber.js';
import { bn_wrap } from '../src/utils/big-number.utils';

const web3Connection = new ReadOnlyWeb3ConnectionService();
const transactionHelper = new TransactionRunningHelperService(new NotificationService());
const toolkit = new ContractToolkitService(web3Connection, transactionHelper, {} as ContractGeneralConfig);

const contract = new Web3Contract<Erc20AbiFunctional>(toolkit, Erc20Abi);
const config = blockchainIndex.MUMBAI_TESTCHAIN;

const batch = new (web3Connection.getWeb3ReadOnly(config).BatchRequest)();
const token = '0x9c3c9283d3e44854697cd22d3faa240cfb032889';

contract.views.name(config, token, {}).then((value) => console.log(value));
contract.views.name(config, token, {}, batch, (result) => console.log(result));
contract.views
  .balanceOf(config, token, { account: EmptyAddress })
  .then<BigNumber>(
    (value: any) =>
      new Promise((resolve) => {
        contract.views
          .decimals(config, token, {}, undefined, undefined)
          .then((value1: any) => resolve(bn_wrap(value).dividedBy(bn_wrap(value1))));
      }),
  )
  .then((value) => console.log(value.toString()));
batch.execute({ timeout: 30_000 });
const instance = contract.readOnlyInstance(config, '0x9c3c9283d3e44854697cd22d3faa240cfb032889');
instance.totalSupply({}).then((x) => console.log(x));
