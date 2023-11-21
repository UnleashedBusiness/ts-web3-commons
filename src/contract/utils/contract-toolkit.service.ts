import { ReadOnlyWeb3Connection } from '../../connection/interface/read-only-web3-connection';
import { TransactionRunningHelperService } from '../../utils/transaction-running-helper.service';
import ContractGeneralConfig from './contract-general.config';

export default class ContractToolkitService {
  public constructor(
    public readonly web3Connection: ReadOnlyWeb3Connection,
    public readonly transactionHelper: TransactionRunningHelperService,
    public readonly generalConfig: ContractGeneralConfig,
  ){}
}
