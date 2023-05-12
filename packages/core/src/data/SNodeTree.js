import { Field } from "./Field";
import { nextPowerOf2 } from "../utils/Utils";
function numElements(dimensions, packed = false) {
    let result = 1;
    for (let d of dimensions) {
        if (packed) {
            result *= d;
        }
        else {
            result *= nextPowerOf2(d);
        }
    }
    return result;
}
class SNodeTree {
    treeId = 0;
    fields = [];
    size = 0;
    rootBuffer = null;
    fragmentShaderWritable = false;
    constructor() { }
    addNaiveDenseField(elementType, dimensionsArg) {
        let dimensions;
        if (typeof dimensionsArg === "number") {
            dimensions = [dimensionsArg];
        }
        else {
            dimensions = dimensionsArg;
        }
        let packed = true;
        let primitivesList = elementType.getPrimitivesList();
        let totalSize = 4 * primitivesList.length * numElements(dimensions, packed);
        let field = new Field(this, this.size, totalSize, dimensions, elementType);
        this.size += totalSize;
        this.fields.push(field);
        return field;
    }
}
export { SNodeTree };
