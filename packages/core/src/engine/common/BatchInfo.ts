import * as ti from "../../";

export class BatchInfo {
  constructor(public materialIndex: number) {}

  static getKernelType() {
    return ti.types.struct({
      materialIndex: ti.i32
    });
  }
}
