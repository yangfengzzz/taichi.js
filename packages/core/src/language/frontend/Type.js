import { assert, error } from "../../utils/Logging";
export var PrimitiveType;
(function (PrimitiveType) {
    PrimitiveType["i32"] = "i32";
    PrimitiveType["f32"] = "f32";
})(PrimitiveType || (PrimitiveType = {}));
export var TypeCategory;
(function (TypeCategory) {
    TypeCategory["Scalar"] = "Scalar";
    TypeCategory["Vector"] = "Vector";
    TypeCategory["Matrix"] = "Matrix";
    TypeCategory["Struct"] = "Struct";
    TypeCategory["Pointer"] = "Pointer";
    TypeCategory["Void"] = "Void";
    TypeCategory["Function"] = "Function";
    TypeCategory["HostObjectReference"] = "HostObjectReference";
})(TypeCategory || (TypeCategory = {}));
export class Type {
    constructor() { }
    getCategory() {
        error("calling getCategory from Type2 base");
        return TypeCategory.Scalar;
    }
    equals(that) {
        error("calling equals from Type2 base");
        return false;
    }
    getPrimitivesList() {
        error("calling getPrimitivesList from Type base");
        return [];
    }
}
export class ScalarType extends Type {
    constructor(primitiveType) {
        super();
        this.primitiveType_ = primitiveType;
    }
    primitiveType_;
    getCategory() {
        return TypeCategory.Scalar;
    }
    getPrimitiveType() {
        return this.primitiveType_;
    }
    getPrimitivesList() {
        return [this.primitiveType_];
    }
    equals(that) {
        if (that.getCategory() != this.getCategory()) {
            return false;
        }
        return this.getPrimitiveType() === that.getPrimitiveType();
    }
}
export class VectorType extends Type {
    constructor(primitiveType, numRows) {
        super();
        this.primitiveType_ = primitiveType;
        this.numRows_ = numRows;
    }
    primitiveType_;
    numRows_;
    getCategory() {
        return TypeCategory.Vector;
    }
    getPrimitiveType() {
        return this.primitiveType_;
    }
    getNumRows() {
        return this.numRows_;
    }
    getPrimitivesList() {
        let primitives = [];
        for (let i = 0; i < this.getNumRows(); ++i) {
            primitives.push(this.primitiveType_);
        }
        return primitives;
    }
    equals(that) {
        if (that.getCategory() != this.getCategory()) {
            return false;
        }
        let thatVector = that;
        return this.getPrimitiveType() === thatVector.getPrimitiveType() && this.getNumRows() === thatVector.getNumRows();
    }
}
export class MatrixType extends Type {
    constructor(primitiveType, numRows, numCols) {
        super();
        this.primitiveType_ = primitiveType;
        this.numRows_ = numRows;
        this.numCols_ = numCols;
    }
    primitiveType_;
    numRows_;
    numCols_;
    getCategory() {
        return TypeCategory.Matrix;
    }
    getPrimitiveType() {
        return this.primitiveType_;
    }
    getNumRows() {
        return this.numRows_;
    }
    getNumCols() {
        return this.numCols_;
    }
    getPrimitivesList() {
        let primitives = [];
        for (let i = 0; i < this.getNumRows() * this.getNumCols(); ++i) {
            primitives.push(this.primitiveType_);
        }
        return primitives;
    }
    equals(that) {
        if (that.getCategory() != this.getCategory()) {
            return false;
        }
        let thatVector = that;
        return (this.getPrimitiveType() === thatVector.getPrimitiveType() &&
            this.getNumRows() === thatVector.getNumRows() &&
            this.getNumCols() === thatVector.getNumCols());
    }
}
export class PointerType extends Type {
    constructor(valueType, isGlobal) {
        super();
        this.valueType_ = valueType;
        this.isGlobal_ = isGlobal;
    }
    valueType_;
    isGlobal_;
    getValueType() {
        return this.valueType_;
    }
    getIsGlobal() {
        return this.isGlobal_;
    }
    getCategory() {
        return TypeCategory.Pointer;
    }
    equals(that) {
        if (that.getCategory() != this.getCategory()) {
            return false;
        }
        let thatPointer = that;
        return this.getValueType().equals(thatPointer.getValueType());
    }
    getPrimitivesList() {
        error("calling getPrimitivesList from PointerType");
        return [];
    }
}
export class StructType extends Type {
    constructor(membersMap) {
        super();
        this.keys_ = Object.keys(membersMap);
        this.memberTypes_ = new Map();
        for (let k of this.keys_) {
            let memberType = membersMap[k];
            if (memberType === PrimitiveType.f32 || memberType === PrimitiveType.i32) {
                memberType = new ScalarType(memberType);
            }
            this.memberTypes_.set(k, memberType);
        }
    }
    keys_; // ordered
    memberTypes_;
    getPropertyNames() {
        return this.keys_;
    }
    hasProperty(name) {
        return this.memberTypes_.has(name);
    }
    getPropertyType(name) {
        if (!this.memberTypes_.has(name)) {
            error(`property ${name} does not exist on this struct`);
        }
        return this.memberTypes_.get(name);
    }
    getPropertyPrimitiveOffset(name) {
        if (!this.memberTypes_.has(name)) {
            error(`property ${name} does not exist on this struct`);
        }
        let offset = 0;
        for (let k of this.keys_) {
            if (k !== name) {
                offset += this.getPropertyType(k).getPrimitivesList().length;
            }
            else {
                break;
            }
        }
        return offset;
    }
    getCategory() {
        return TypeCategory.Struct;
    }
    equals(that) {
        if (that.getCategory() != this.getCategory()) {
            return false;
        }
        let thatStruct = that;
        if (this.keys_.length !== thatStruct.keys_.length) {
            return false;
        }
        for (let i = 0; i < this.keys_.length; ++i) {
            if (this.keys_[i] !== thatStruct.keys_[i]) {
                return false;
            }
            let key = this.keys_[i];
            if (!this.memberTypes_.get(key).equals(thatStruct.memberTypes_.get(key))) {
                return false;
            }
        }
        return true;
    }
    getPrimitivesList() {
        let prims = [];
        for (let k of this.keys_) {
            prims = prims.concat(this.getPropertyType(k).getPrimitivesList());
        }
        return prims;
    }
}
export class VoidType extends Type {
    constructor() {
        super();
    }
    getCategory() {
        return TypeCategory.Void;
    }
    equals(that) {
        if (that.getCategory() != this.getCategory()) {
            return false;
        }
        return true;
    }
    getPrimitivesList() {
        return [];
    }
}
export class FunctionType extends Type {
    constructor() {
        super();
    }
    getCategory() {
        return TypeCategory.Function;
    }
    equals(that) {
        return false;
    }
    getPrimitivesList() {
        error(`getPrimitivesList() called on function type`);
        return [];
    }
}
export class HostObjectReferenceType extends Type {
    markedAsStatic;
    constructor(markedAsStatic) {
        super();
        this.markedAsStatic = markedAsStatic;
    }
    getCategory() {
        return TypeCategory.HostObjectReference;
    }
    equals(that) {
        return false;
    }
    getPrimitivesList() {
        error(`getPrimitivesList() called on HostObjectReferenceType type`);
        return [];
    }
}
export class TypeUtils {
    static isTensorType(type) {
        let cat = type.getCategory();
        return cat === TypeCategory.Scalar || cat === TypeCategory.Vector || cat === TypeCategory.Matrix;
    }
    static tensorTypeShapeMatch(type0, type1) {
        assert(TypeUtils.isTensorType(type0) && TypeUtils.isTensorType(type1), "[Compiler bug] tensorTypeShapeMatch() called on non-tensor type");
        if (type0.getCategory() !== type1.getCategory()) {
            return false;
        }
        if (type0.getCategory() === TypeCategory.Scalar) {
            return true;
        }
        else if (type0.getCategory() === TypeCategory.Vector) {
            let vec0 = type0;
            let vec1 = type1;
            return vec0.getNumRows() === vec1.getNumRows();
        }
        else {
            // if(type0.getCategory() === TypeCategory.Matrix)
            let mat0 = type0;
            let mat1 = type1;
            return mat0.getNumRows() === mat1.getNumRows() && mat0.getNumCols() === mat1.getNumCols();
        }
    }
    static getPrimitiveType(type) {
        assert(TypeUtils.isTensorType(type), "[Compiler bug] getPrimitiveType() called on non-tensor type");
        let cat = type.getCategory();
        if (cat === TypeCategory.Scalar) {
            return type.getPrimitiveType();
        }
        else if (cat === TypeCategory.Vector) {
            let vecType = type;
            return vecType.getPrimitiveType();
        }
        else {
            //if(cat ===  TypeCategory.Matrix)
            let matType = type;
            return matType.getPrimitiveType();
        }
    }
    static replacePrimitiveType(type, newPrimitiveType) {
        assert(TypeUtils.isTensorType(type), "[Compiler bug] replacePrimitiveType() called on non-tensor type");
        let cat = type.getCategory();
        if (cat === TypeCategory.Scalar) {
            return new ScalarType(newPrimitiveType);
        }
        else if (cat === TypeCategory.Vector) {
            let vecType = type;
            return new VectorType(newPrimitiveType, vecType.getNumRows());
        }
        else {
            // if(cat ===  TypeCategory.Matrix){
            let matType = type;
            return new MatrixType(newPrimitiveType, matType.getNumRows(), matType.getNumCols());
        }
    }
    static isPointerOfCategory(type, cat) {
        return type.getCategory() === TypeCategory.Pointer && type.getValueType().getCategory() === cat;
    }
    static isValueOrPointerOfCategory(type, cat) {
        return type.getCategory() === cat || TypeUtils.isPointerOfCategory(type, cat);
    }
    static isPointerOfTensorType(type) {
        return type.getCategory() === TypeCategory.Pointer && TypeUtils.isTensorType(type.getValueType());
    }
    static isValueOrPointerOfTensorType(type) {
        return TypeUtils.isTensorType(type) || TypeUtils.isPointerOfTensorType(type);
    }
}
export class TypeError {
    hasError;
    msg;
    constructor(hasError, msg = "") {
        this.hasError = hasError;
        this.msg = msg;
    }
    static createNoError() {
        return new TypeError(false);
    }
    static createError(msg) {
        return new TypeError(true, msg);
    }
}
