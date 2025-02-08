import {BasePBCSmartContract, BasePBCSmartContractInstance} from "./base-pbc.smart-contract.js";
import type {ScValue} from "@partisiablockchain/abi-client";
import {NamedTypeSpec} from "@partisiablockchain/abi-client/target/main/types/Abi.js";
import type {AvlTreeBuilderMap} from "../utils/avl-tree.utils.js";

export class PBCContractMultiCall<C extends BasePBCSmartContract> {
  private calls: ((state: Record<string, ScValue>, trees: AvlTreeBuilderMap, namedTypes: Record<string, NamedTypeSpec>) => Promise<void>)[] = [];
  private executed = false;

  constructor(
    private readonly contractInstance: BasePBCSmartContractInstance<C>,
  ) {
  }

  public add(call: (state: Record<string, ScValue>, trees: AvlTreeBuilderMap, namedTypes: Record<string, NamedTypeSpec>) => Promise<void>): this {
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
