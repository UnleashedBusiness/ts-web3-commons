import { type ReadOnlyWeb3Connection } from '../../connection/interface/read-only-web3-connection.js';
import { TransactionRunningHelperService } from '../../utils/transaction-running-helper.service.js';
import { ContractGeneralConfig } from './contract-general.config.js';

export class ContractToolkitService {
  public constructor(
    public readonly web3Connection: ReadOnlyWeb3Connection,
    public readonly transactionHelper: TransactionRunningHelperService,
    public readonly generalConfig: ContractGeneralConfig,
  ){}
}
