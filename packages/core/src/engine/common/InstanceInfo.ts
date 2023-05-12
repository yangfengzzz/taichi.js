import { struct } from "../../api/Types";
import { i32 } from "../../api/Kernels";

export class InstanceInfo {
  constructor(public nodeIndex: number = 0, public materialIndex: number = 0) {}
  static getKernelType() {
    return struct({
      nodeIndex: i32,
      materialIndex: i32
    });
  }
}
