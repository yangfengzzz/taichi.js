import { matmul } from "../api/KernelScopeBuiltin";
import { matrix, struct } from "../api/Types";
import { f32 } from "../api/Kernels";

export class Transform {
  constructor(matrix?: number[][]) {
    this.reset();
    if (matrix) {
      this.matrix = matrix;
    }
  }
  reset() {
    this.matrix = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ];
  }
  matrix: number[][] = [];

  mul(other: Transform) {
    let result = new Transform();
    result.matrix = matmul(this.matrix, other.matrix) as number[][];
    return result;
  }

  static getKernelType() {
    return struct({
      matrix: matrix(f32, 4, 4)
    });
  }
}
