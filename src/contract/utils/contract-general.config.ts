export default class ContractGeneralConfig {
  constructor(
    public readonly executionReceiptTimeout: number = 10_000,
    public readonly executionConfirmation: number = 1,
    public readonly estimateGasMultiplier: number = 1.15
  ) {
  }
}