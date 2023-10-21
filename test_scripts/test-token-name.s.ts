import {
  blockchainIndex,
  Erc20TokenContract,
  NotificationService,
  ReadOnlyWeb3ConnectionService,
  TransactionRunningHelperService
} from "../src";

const web3Connection = new ReadOnlyWeb3ConnectionService();
const transactionHelper = new TransactionRunningHelperService(new NotificationService());
const contract = new Erc20TokenContract(web3Connection, transactionHelper);
const config = blockchainIndex.MUMBAI_TESTCHAIN;

const batch = new (web3Connection.getWeb3ReadOnly(config).BatchRequest)();

contract.name(config, "0x9c3c9283d3e44854697cd22d3faa240cfb032889").then(value => console.log(value));

contract.name(config, "0x9c3c9283d3e44854697cd22d3faa240cfb032889", batch, (result) => console.log(result))
  .then(r => batch.execute());
