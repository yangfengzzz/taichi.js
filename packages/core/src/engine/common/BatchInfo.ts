import { struct } from "../../api/Types";
import { i32 } from "../../api/Kernels";

export class BatchInfo {
  constructor(public materialIndex: number) {}

  static getKernelType() {
    return struct({
      materialIndex: i32
    });
  }
}
