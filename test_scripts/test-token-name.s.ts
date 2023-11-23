import {
  blockchainIndex,
  ContractGeneralConfig,
  ContractToolkitService, EmptyAddress,
  Erc20TokenContract,
  NotificationService,
  ReadOnlyWeb3ConnectionService,
  TransactionRunningHelperService
} from "../src";

const web3Connection = new ReadOnlyWeb3ConnectionService();
const transactionHelper = new TransactionRunningHelperService(new NotificationService());
const toolkit = new ContractToolkitService(web3Connection, transactionHelper, {} as ContractGeneralConfig);
const contract = new Erc20TokenContract(toolkit);
const config = blockchainIndex.MUMBAI_TESTCHAIN;

const batch = new (web3Connection.getWeb3ReadOnly(config).BatchRequest)();

contract.views.name(config, '0x9c3c9283d3e44854697cd22d3faa240cfb032889', {}).then((value) => console.log(value));

contract.views.name(config, '0x9c3c9283d3e44854697cd22d3faa240cfb032889', {}, batch, (result) => console.log(result));

contract.views.balanceOf(config, '0x9c3c9283d3e44854697cd22d3faa240cfb032889', {account: EmptyAddress}).then((value) => {
  console.log(value)
});

batch.execute({ timeout: 30_000 });