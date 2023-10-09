export default class WalletConnectionRequiredError extends Error {
  constructor(message: string) {
    super(message);
  }
}