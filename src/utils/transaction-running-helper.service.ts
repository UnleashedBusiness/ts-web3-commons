import {NotificationService, PushNotification} from "./notification.service";

export class TransactionRunningHelperService {
  public running = false;
  public lastResult = false;
  public lastTransaction = '';
  public readTransaction  = false;
  public lastWasProposal  = false;

  constructor(private service: NotificationService) {
  }

  public start(): void {
    this.running = true;
  }

  public failed(message: string): void {
    this.service.show(new PushNotification('Transaction failed.', message, 'stop'));
    this.running = false;
    this.lastResult = false;
  }

  public success(tx_id: string): void {
    //this.service.show(new PushNotification('Transaction was successful!', '', 'check'));
    this.running = false;
    this.lastResult = true;
    this.lastWasProposal = false;
    this.lastTransaction = tx_id;
  }

  public addedToProposal(): void {
    this.running = false;
    this.lastResult = true;
    this.lastWasProposal = true;
  }

  public reset(): void {
    this.running = false;
    this.lastResult = false;
    this.lastWasProposal = false;
    this.lastTransaction = '';
  }
}
