export class MeshPrimitive {
    firstIndex;
    indexCount;
    materialID;
    constructor(firstIndex, indexCount, materialID) {
        this.firstIndex = firstIndex;
        this.indexCount = indexCount;
        this.materialID = materialID;
    }
}
export class Mesh {
    primitives;
    constructor(primitives = []) {
        this.primitives = primitives;
    }
}
