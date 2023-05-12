import { error } from "../utils/Logging";
import { struct, vector } from "../api/Types";
import { f32, i32 } from "../api/Kernels";
export var VertexAttrib;
(function (VertexAttrib) {
    VertexAttrib[VertexAttrib["None"] = 0] = "None";
    VertexAttrib[VertexAttrib["Position"] = 1] = "Position";
    VertexAttrib[VertexAttrib["Normal"] = 2] = "Normal";
    VertexAttrib[VertexAttrib["Tangent"] = 4] = "Tangent";
    VertexAttrib[VertexAttrib["TexCoords0"] = 8] = "TexCoords0";
    VertexAttrib[VertexAttrib["TexCoords1"] = 16] = "TexCoords1";
    VertexAttrib[VertexAttrib["Color"] = 32] = "Color";
    VertexAttrib[VertexAttrib["Joints"] = 64] = "Joints";
    VertexAttrib[VertexAttrib["Weights"] = 128] = "Weights";
    VertexAttrib[VertexAttrib["Max"] = 129] = "Max";
    VertexAttrib[VertexAttrib["All"] = 127] = "All";
})(VertexAttrib || (VertexAttrib = {}));
export class VertexAttribSet {
    val;
    constructor(val) {
        this.val = val;
    }
    test(attrib) {
        return (this.val & attrib) != 0;
    }
    set(attrib) {
        this.val |= attrib;
    }
    foreach(f) {
        let curr = 1;
        while (curr < VertexAttrib.Max) {
            if (this.test(curr)) {
                f(curr);
            }
            curr = curr << 1;
        }
    }
}
export function getVertexAttribNumComponents(attrib) {
    switch (attrib) {
        case VertexAttrib.TexCoords0:
            return 2;
        case VertexAttrib.TexCoords1:
            return 2;
        case VertexAttrib.Position:
            return 3;
        case VertexAttrib.Normal:
            return 3;
        case VertexAttrib.Tangent:
            return 4;
        case VertexAttrib.Color:
            return 4;
        case VertexAttrib.Joints:
            return 4;
        case VertexAttrib.Weights:
            return 4;
        default:
            error("getVertexAttribNumComponents called on None or All ", attrib);
            return -1;
    }
}
export function getVertexAttribSetKernelType(attribs) {
    let typeObj = {};
    attribs.foreach((attr) => {
        let numComponents = getVertexAttribNumComponents(attr);
        let vecType = vector(f32, numComponents);
        switch (attr) {
            case VertexAttrib.Position:
                typeObj["position"] = vecType;
                break;
            case VertexAttrib.Normal:
                typeObj["normal"] = vecType;
                break;
            case VertexAttrib.Tangent:
                typeObj["tangent"] = vecType;
                break;
            case VertexAttrib.TexCoords0:
                typeObj["texCoords0"] = vecType;
                break;
            case VertexAttrib.TexCoords1:
                typeObj["texCoords1"] = vecType;
                break;
            case VertexAttrib.Color:
                typeObj["color"] = vecType;
                break;
            case VertexAttrib.Joints:
                typeObj["joints"] = vector(i32, numComponents);
                break;
            case VertexAttrib.Weights:
                typeObj["weights"] = vecType;
                break;
            default:
                error("vert attr is None or All");
        }
    });
    return struct(typeObj);
}
export class Vertex {
    attribs;
    constructor(attribs) {
        this.attribs = attribs;
        attribs.foreach((attr) => {
            this.ensureAttrib(attr);
        });
    }
    setAttribValue(attrib, value) {
        switch (attrib) {
            case VertexAttrib.Position: {
                this.position = value;
                break;
            }
            case VertexAttrib.Normal: {
                this.normal = value;
                break;
            }
            case VertexAttrib.Tangent: {
                this.tangent = value;
                break;
            }
            case VertexAttrib.TexCoords0: {
                this.texCoords0 = value;
                break;
            }
            case VertexAttrib.TexCoords1: {
                this.texCoords1 = value;
                break;
            }
            case VertexAttrib.Color: {
                this.color = value;
                break;
            }
            case VertexAttrib.Joints: {
                this.joints = value;
                break;
            }
            case VertexAttrib.Weights: {
                this.weights = value;
                break;
            }
            default:
                error("setAttribValue called on None or All");
        }
    }
    ensureAttrib(attrib) {
        let numComponents = getVertexAttribNumComponents(attrib);
        let zeros = Array(numComponents).fill(0);
        this.setAttribValue(attrib, zeros);
    }
    ensureAttribs(attribs) {
        attribs.foreach((attr) => this.ensureAttrib(attr));
    }
    position = null;
    normal = null;
    tangent = null;
    texCoords0 = null;
    texCoords1 = null;
    color = null;
    joints = null;
    weights = null;
}
