import * as ti from "../../";

export class InstanceInfo {
  constructor(public nodeIndex: number = 0, public materialIndex: number = 0) {}

  static getKernelType() {
    return ti.types.struct({
      nodeIndex: ti.i32,
      materialIndex: ti.i32
    });
  }
}
