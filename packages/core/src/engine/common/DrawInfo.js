import { struct } from "../../api/Types";
import { i32 } from "../../api/Kernels";
export class DrawInfo {
    indexCount;
    instanceCount;
    firstIndex;
    baseVertex;
    firstInstance;
    constructor(indexCount = 0, instanceCount = 0, firstIndex = 0, baseVertex = 0, firstInstance = 0) {
        this.indexCount = indexCount;
        this.instanceCount = instanceCount;
        this.firstIndex = firstIndex;
        this.baseVertex = baseVertex;
        this.firstInstance = firstInstance;
    }
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
