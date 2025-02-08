import {BasePBCSmartContract, BasePBCSmartContractInstance} from "./base-pbc.smart-contract.js";
import type {PBCMultiCallDelegate} from "../pbc.types.js";

export class PBCContractMultiCall<C extends BasePBCSmartContract> {
  private calls: PBCMultiCallDelegate[] = [];
  private executed = false;

  constructor(
    private readonly contractInstance: BasePBCSmartContractInstance<C>,
  ) {
  }

  public add(call: PBCMultiCallDelegate): this {
    this.calls.push(call);

    return this;
  }

  public async execute(loadAvlTreeIndexes?: number[]): Promise<void> {
    if (this.executed) {
      throw new Error("Multi call already executed!");
    }

    let response = this.contractInstance.multiCall(
      this.calls,
      loadAvlTreeIndexes
    );

    this.calls = [];
    this.executed = true;

    return response;
  }
}
