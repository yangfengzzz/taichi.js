import { struct } from "../../api/Types";
import { i32 } from "../../api/Kernels";

export class DrawInfo {
  constructor(
    public indexCount: number = 0,
    public instanceCount: number = 0,
    public firstIndex: number = 0,
    public baseVertex: number = 0,
    public firstInstance: number = 0
  ) {}

  static getKernelType() {
    return struct({
      indexCount: i32,
      instanceCount: i32,
      firstIndex: i32,
      baseVertex: i32,
      firstInstance: i32
    });
  }
}
