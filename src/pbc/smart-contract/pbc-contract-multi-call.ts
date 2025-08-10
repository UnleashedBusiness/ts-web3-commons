import {BasePBCSmartContract, BasePBCSmartContractInstance} from "./base-pbc.smart-contract.js";
import type {PBCMultiCallDelegate, PBCMultiCallDelegateWithTrees} from "../pbc.types.js";

export class PBCContractMultiCall<C extends BasePBCSmartContract> {
  private calls: PBCMultiCallDelegate[] = [];
  private trees: Set<number> = new Set<number>();
  private requireState: boolean = false;

  constructor(
    private readonly contractInstance: BasePBCSmartContractInstance<C>,
  ) {
  }

  public add(needState: boolean, call: PBCMultiCallDelegateWithTrees): this {
    this.calls.push(call[0]);
    for (let treeId of call[1]) {
      this.trees.add(treeId);
    }

    if (needState) {
      this.requireState = true;
    }

    return this;
  }

  public async execute(): Promise<void> {
    return this.contractInstance.multiCall(
      this.calls,
      this.requireState,
      Array.from(this.trees)
    );
  }
}
