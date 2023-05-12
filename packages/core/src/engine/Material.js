import { struct, vector } from "../api/Types";
import { f32, i32 } from "../api/Kernels";
export class MaterialAttribute {
    numComponents;
    value;
    texture;
    texcoordsSet;
    constructor(numComponents, value, texture = undefined, texcoordsSet = 0) {
        this.numComponents = numComponents;
        this.value = value;
        this.texture = texture;
        this.texcoordsSet = texcoordsSet;
    }
    getInfo() {
        return {
            value: this.value,
            hasTexture: this.texture !== undefined ? 1 : 0
        };
    }
    getInfoKernelType() {
        let valueType = vector(f32, this.numComponents);
        return struct({
            value: valueType,
            hasTexture: i32
        });
    }
}
export class Material {
    materialID;
    constructor(materialID) {
        this.materialID = materialID;
    }
    name = "";
    baseColor = new MaterialAttribute(4, [1, 1, 1, 1]);
    metallicRoughness = new MaterialAttribute(2, [0, 0]);
    emissive = new MaterialAttribute(3, [0, 0, 0]);
    normalMap = new MaterialAttribute(3, [0.5, 0.5, 1.0]);
    getInfo() {
        return {
            materialID: this.materialID,
            baseColor: this.baseColor.getInfo(),
            metallicRoughness: this.metallicRoughness.getInfo(),
            emissive: this.emissive.getInfo(),
            normalMap: this.normalMap.getInfo()
        };
    }
    getInfoKernelType() {
        return struct({
            materialID: i32,
            baseColor: this.baseColor.getInfoKernelType(),
            metallicRoughness: this.metallicRoughness.getInfoKernelType(),
            emissive: this.emissive.getInfoKernelType(),
            normalMap: this.normalMap.getInfoKernelType()
        });
    }
    hasTexture() {
        return this.baseColor.texture !== undefined;
    }
}
