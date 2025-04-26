
const signatureLength = 64;
const txnInnerLength = 3 * 8;
const addressLength = 21;
const hashLength = 32;
const payloadLength = 4;
const headerLength = addressLength + payloadLength;
const transactionPreHeaderLength = 1 + signatureLength + txnInnerLength;
const transactionPrePayloadLength = 1 + signatureLength + txnInnerLength + headerLength;

const preTypeLength = 10 + 1 + hashLength;

const eventPreHeaderLength = 1 + 10;
const eventPreShardLength = eventPreHeaderLength + hashLength;
const eventPreSenderLength = eventPreShardLength + 1;
const eventPreReceiverLength = eventPreSenderLength + addressLength + 8 + 1;
const eventPrePayloadLengthLength = eventPreReceiverLength + addressLength;

const responsePreHeaderLength = 1 + 10;
const responsePreShardLength = responsePreHeaderLength + hashLength;
const responsePreSubtypeLength = responsePreShardLength + 1;
const responsePreReceiverLength = responsePreShardLength + 2;
const responsePreParentCallLength = responsePreReceiverLength + addressLength;
const responsePayloadLengthLength = responsePreParentCallLength + hashLength + 1;

const callbackPreHeaderLength = 1 + 10;
const callbackPreShardLength = callbackPreHeaderLength + hashLength;
const callbackPreReceiverLength = callbackPreShardLength + 1;
const callbackPreSenderLength = callbackPreReceiverLength + addressLength + hashLength;
const callbackPayloadLengthLength = callbackPreSenderLength + addressLength + 8;

export enum EventType {
  Transaction = 0,
  ContractActionCall = 1,
  CallbackCall = 2,
  CallbackResponse = 3,
  StateUpdate = 4,
}

export abstract class ParsedEventData {
  protected constructor(
    public readonly type: EventType,
    public readonly shardId: string,
    public readonly receiverAddress: string,
  ) {}
}

export class ParsedTransactionData extends ParsedEventData {
  constructor(
    shardId: string,
    receiverAddress: string,
    public readonly senderAddress: string,
    public readonly data: string,
  ) {
    super(EventType.Transaction, shardId, receiverAddress);
  }
}

export class ParsedContractActionCallData extends ParsedEventData {
  constructor(
    shardId: string,
    receiverAddress: string,
    public readonly senderAddress: string,
    public readonly data: string,
    public readonly parentTransaction: string,
  ) {
    super(EventType.ContractActionCall, shardId, receiverAddress);
  }
}

export class ParsedCallbackCallData extends ParsedEventData {
  constructor(
    shardId: string,
    receiverAddress: string,
    public readonly senderAddress: string,
    public readonly data: string,
    public readonly parentTransaction: string,
  ) {
    super(EventType.CallbackCall, shardId, receiverAddress);
  }
}

export class ParsedCallbackResponseData extends ParsedEventData {
  constructor(
    shardId: string,
    receiverAddress: string,
    public readonly parentEvent: string,
    public readonly data: string,
    public readonly parentTransaction: string,
  ) {
    super(EventType.CallbackResponse, shardId, receiverAddress);
  }
}

export class ParsedStateUpdateData extends ParsedEventData {
  constructor(
    shardId: string,
    receiverAddress: string,
    public readonly parentTransaction: string,
  ) {
    super(EventType.StateUpdate, shardId, receiverAddress);
  }
}

export class ExecutedTransactionParser {
  public parseTransactionPayload(payloadBase64: string, isEvent: boolean, shardId?: string, from?: string): ParsedEventData {
    const payload: Buffer = Buffer.from(payloadBase64, "base64");

    if (isEvent) {
      const parentTransaction = payload.subarray(eventPreHeaderLength, eventPreHeaderLength + hashLength).toString("hex");
      const shardId = `Shard${payload
        .subarray(eventPreShardLength, eventPreShardLength + 1)
        .readUInt8()
        .toString(16)}`;
      const typeId = payload.subarray(preTypeLength, preTypeLength + 1).readUInt8();
      switch (typeId) {
        case 2: {
          const subtype = payload.subarray(responsePreSubtypeLength, responsePreSubtypeLength + 1).readUInt8();

          switch (subtype) {
            case 6: {
              const receiver = payload.subarray(responsePreReceiverLength, responsePreReceiverLength + addressLength).toString("hex");
              const rpcLength = payload?.subarray(responsePayloadLengthLength, responsePayloadLengthLength + 4).readUInt32BE();
              const data = payload.subarray(responsePayloadLengthLength + 4, responsePayloadLengthLength + 4 + rpcLength).toString("hex");
              const parentEvent = payload.subarray(responsePreParentCallLength, responsePreParentCallLength + hashLength).toString("hex");

              return new ParsedCallbackResponseData(shardId, receiver, parentEvent, data, parentTransaction);
            }
            case 3: {
              const txnReceiver = payload
                .subarray(responsePreReceiverLength + 1, responsePreReceiverLength + 1 + addressLength)
                .toString("hex");

              return new ParsedStateUpdateData(shardId, txnReceiver, parentTransaction);
            }
          }
          break;
        }
        case 1: {
          const receiver = payload.subarray(callbackPreReceiverLength, callbackPreReceiverLength + addressLength).toString("hex");
          const sender = payload.subarray(callbackPreSenderLength, callbackPreSenderLength + addressLength).toString("hex");

          const rpcLength = payload.subarray(callbackPayloadLengthLength, callbackPayloadLengthLength + 4).readUInt32BE();
          const data = payload.subarray(callbackPayloadLengthLength + 4, callbackPayloadLengthLength + 4 + rpcLength).toString("hex");

          return new ParsedCallbackCallData(shardId, receiver, sender, data, parentTransaction);
        }
        default: {
          const sender = payload.subarray(eventPreSenderLength, eventPreSenderLength + addressLength).toString("hex");
          const receiver = payload.subarray(eventPreReceiverLength, eventPreReceiverLength + addressLength).toString("hex");

          const rpcLength = payload.subarray(eventPrePayloadLengthLength, eventPrePayloadLengthLength + 4).readUInt32BE();
          const data = payload.subarray(eventPrePayloadLengthLength + 4, eventPrePayloadLengthLength + 4 + rpcLength).toString("hex");

          return new ParsedContractActionCallData(shardId, receiver, sender, data, parentTransaction);
        }
      }
    }

    const receiver = payload.subarray(transactionPreHeaderLength, transactionPreHeaderLength + addressLength).toString("hex");
    const rpcLength = payload
      .subarray(transactionPreHeaderLength + addressLength, transactionPreHeaderLength + headerLength)
      .readUInt32BE();
    const data = payload?.subarray(transactionPrePayloadLength, transactionPrePayloadLength + rpcLength).toString("hex");

    return new ParsedTransactionData(shardId!, receiver, from!, data);
  }
}