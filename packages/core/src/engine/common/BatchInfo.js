import { struct } from "../../api/Types";
import { i32 } from "../../api/Kernels";
export class BatchInfo {
    materialIndex;
    constructor(materialIndex) {
        this.materialIndex = materialIndex;
    }
    static getKernelType() {
        return struct({
            materialIndex: i32
        });
    }
}
