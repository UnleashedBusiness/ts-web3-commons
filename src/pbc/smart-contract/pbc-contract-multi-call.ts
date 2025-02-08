import {BasePBCSmartContract, BasePBCSmartContractInstance} from "./base-pbc.smart-contract.js";
import type {PBCMultiCallDelegate, PBCMultiCallDelegateWithTrees} from "../pbc.types.js";

export class PBCContractMultiCall<C extends BasePBCSmartContract> {
  private calls: PBCMultiCallDelegate[] = [];
  private trees: Set<number> = new Set<number>();
  private executed = false;

  constructor(
    private readonly contractInstance: BasePBCSmartContractInstance<C>,
  ) {
  }

  public add(call: PBCMultiCallDelegateWithTrees): this {
    this.calls.push(call[0]);
    for (let treeId of call[1]) {
      this.trees.add(treeId);
    }

    return this;
  }

  public async execute(): Promise<void> {
    if (this.executed) {
      throw new Error("Multi call already executed!");
    }

    let response = this.contractInstance.multiCall(
      this.calls,
      Array.from(this.trees)
    );

    this.calls = [];
    this.executed = true;

    return response;
  }
}
