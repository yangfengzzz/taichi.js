import { struct } from "../../api/Types";
import { i32 } from "../../api/Kernels";
export class InstanceInfo {
    nodeIndex;
    materialIndex;
    constructor(nodeIndex = 0, materialIndex = 0) {
        this.nodeIndex = nodeIndex;
        this.materialIndex = materialIndex;
    }
    static getKernelType() {
        return struct({
            nodeIndex: i32,
            materialIndex: i32
        });
    }
}
