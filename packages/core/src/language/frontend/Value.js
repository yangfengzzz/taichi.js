import { TypeCategory, ScalarType, VectorType, MatrixType, PointerType, TypeUtils, StructType, HostObjectReferenceType } from "./Type";
import { assert } from "../../utils/Logging";
export class Value {
    stmts;
    compileTimeConstants;
    constructor(type, stmts = [], // CHI IR Stmts
    compileTimeConstants = []) {
        this.stmts = stmts;
        this.compileTimeConstants = compileTimeConstants;
        this.type_ = type;
    }
    // only used when
    // type.getCategory() === TypeCategory.Function, in which case it is a ParsedFunction
    // type.getCategory() === TypeCategory.HostObjectReference, in which case it can be anything
    hostSideValue = undefined;
    type_;
    getType() {
        return this.type_;
    }
    isCompileTimeConstant() {
        return this.compileTimeConstants !== null && this.compileTimeConstants.length === this.stmts.length;
    }
}
export class ValueUtils {
    static makeScalar(stmt, primitiveType) {
        return new Value(new ScalarType(primitiveType), [stmt], []);
    }
    static makeConstantScalar(val, stmt, primitiveType) {
        return new Value(new ScalarType(primitiveType), [stmt], [val]);
    }
    static getVectorComponents(vec) {
        assert(TypeUtils.isValueOrPointerOfCategory(vec.getType(), TypeCategory.Vector));
        let isPointer = vec.getType().getCategory() === TypeCategory.Pointer;
        let primitiveType;
        let scalarType;
        if (isPointer) {
            let pointerType = vec.getType();
            primitiveType = TypeUtils.getPrimitiveType(pointerType.getValueType());
            scalarType = new ScalarType(primitiveType);
            scalarType = new PointerType(scalarType, pointerType.getIsGlobal());
        }
        else {
            primitiveType = TypeUtils.getPrimitiveType(vec.getType());
            scalarType = new ScalarType(primitiveType);
        }
        let result = [];
        for (let i = 0; i < vec.stmts.length; ++i) {
            let val = new Value(scalarType, [vec.stmts[i]], []);
            if (vec.isCompileTimeConstant()) {
                val.compileTimeConstants.push(vec.compileTimeConstants[i]);
            }
            result.push(val);
        }
        return result;
    }
    static getMatrixComponents(mat) {
        assert(TypeUtils.isValueOrPointerOfCategory(mat.getType(), TypeCategory.Matrix));
        let isPointer = mat.getType().getCategory() === TypeCategory.Pointer;
        let matType;
        let scalarType;
        if (isPointer) {
            let pointerType = mat.getType();
            matType = pointerType.getValueType();
            let primitiveType = TypeUtils.getPrimitiveType(matType);
            scalarType = new ScalarType(primitiveType);
            scalarType = new PointerType(scalarType, pointerType.getIsGlobal());
        }
        else {
            matType = mat.getType();
            let primitiveType = TypeUtils.getPrimitiveType(matType);
            scalarType = new ScalarType(primitiveType);
        }
        let result = [];
        for (let r = 0; r < matType.getNumRows(); ++r) {
            let thisRow = [];
            for (let c = 0; c < matType.getNumCols(); ++c) {
                let index = r * matType.getNumCols() + c;
                let val = new Value(scalarType, [mat.stmts[index]], []);
                if (mat.isCompileTimeConstant()) {
                    val.compileTimeConstants.push(mat.compileTimeConstants[index]);
                }
                thisRow.push(val);
            }
            result.push(thisRow);
        }
        return result;
    }
    static getMatrixRowVectors(mat) {
        assert(TypeUtils.isValueOrPointerOfCategory(mat.getType(), TypeCategory.Matrix));
        let components = ValueUtils.getMatrixComponents(mat);
        let rows = [];
        for (let row of components) {
            rows.push(ValueUtils.makeVectorFromScalars(row));
        }
        return rows;
    }
    static getMatrixColVectors(mat) {
        return ValueUtils.getMatrixRowVectors(ValueUtils.transposeMatrix(mat));
    }
    static makeVectorFromScalars(values) {
        let numRows = values.length;
        assert(numRows > 0);
        for (let val of values) {
            assert(TypeUtils.isValueOrPointerOfCategory(val.getType(), TypeCategory.Scalar));
        }
        let isPointer = values[0].getType().getCategory() === TypeCategory.Pointer;
        let resultType;
        if (isPointer) {
            let pointerType = values[0].getType();
            let primitiveType = TypeUtils.getPrimitiveType(pointerType.getValueType());
            for (let val of values) {
                let ptrType = val.getType();
                assert(TypeUtils.getPrimitiveType(ptrType.getValueType()) === primitiveType);
            }
            resultType = new VectorType(primitiveType, numRows);
            resultType = new PointerType(resultType, pointerType.getIsGlobal());
        }
        else {
            let primitiveType = TypeUtils.getPrimitiveType(values[0].getType());
            for (let val of values) {
                assert(TypeUtils.getPrimitiveType(val.getType()) === primitiveType);
            }
            resultType = new VectorType(primitiveType, numRows);
        }
        let result = new Value(resultType, [], []);
        let isCompileTimeConstant = true;
        for (let val of values) {
            isCompileTimeConstant &&= val.isCompileTimeConstant();
        }
        for (let val of values) {
            result.stmts.push(val.stmts[0]);
            if (isCompileTimeConstant) {
                result.compileTimeConstants.push(val.compileTimeConstants[0]);
            }
        }
        return result;
    }
    static makeMatrixFromVectorsAsRows(values) {
        let numRows = values.length;
        assert(numRows > 0);
        for (let val of values) {
            assert(TypeUtils.isValueOrPointerOfCategory(val.getType(), TypeCategory.Vector));
        }
        let isPointer = values[0].getType().getCategory() === TypeCategory.Pointer;
        let resultType;
        if (isPointer) {
            let pointerType = values[0].getType();
            let primitiveType = TypeUtils.getPrimitiveType(pointerType.getValueType());
            for (let val of values) {
                let ptrType = val.getType();
                assert(TypeUtils.getPrimitiveType(ptrType.getValueType()) === primitiveType);
            }
            let numCols = pointerType.getValueType().getNumRows();
            for (let val of values) {
                let ptrType = val.getType();
                assert(ptrType.getValueType().getNumRows() === numCols);
            }
            resultType = new MatrixType(primitiveType, numRows, numCols);
            resultType = new PointerType(resultType, pointerType.getIsGlobal());
        }
        else {
            let primitiveType = TypeUtils.getPrimitiveType(values[0].getType());
            for (let val of values) {
                assert(TypeUtils.getPrimitiveType(val.getType()) === primitiveType);
            }
            let numCols = values[0].getType().getNumRows();
            for (let val of values) {
                assert(val.getType().getNumRows() === numCols);
            }
            resultType = new MatrixType(primitiveType, numRows, numCols);
        }
        let result = new Value(resultType, [], []);
        let isCompileTimeConstant = true;
        for (let val of values) {
            isCompileTimeConstant &&= val.isCompileTimeConstant();
        }
        for (let val of values) {
            for (let i = 0; i < val.getType().getNumRows(); ++i) {
                result.stmts.push(val.stmts[i]);
                if (isCompileTimeConstant) {
                    result.compileTimeConstants.push(val.compileTimeConstants[i]);
                }
            }
        }
        return result;
    }
    static makeMatrixFromVectorsAsCols(values) {
        return ValueUtils.transposeMatrix(ValueUtils.makeMatrixFromVectorsAsRows(values));
    }
    static makeMatrixFromScalars(values) {
        let rows = [];
        for (let row of values) {
            rows.push(ValueUtils.makeVectorFromScalars(row));
        }
        return this.makeMatrixFromVectorsAsRows(rows);
    }
    static transposeMatrix(mat) {
        assert(TypeUtils.isValueOrPointerOfCategory(mat.getType(), TypeCategory.Matrix));
        let components = this.getMatrixComponents(mat);
        let numRows = components.length;
        let numCols = components[0].length;
        let transposedNumRows = numCols;
        let transposedNumCols = numRows;
        let transposedComponents = [];
        for (let r = 0; r < transposedNumRows; ++r) {
            let thisRow = [];
            for (let c = 0; c < transposedNumCols; ++c) {
                thisRow.push(components[c][r]);
            }
            transposedComponents.push(thisRow);
        }
        return ValueUtils.makeMatrixFromScalars(transposedComponents);
    }
    static addScalarToVector(vector, scalar) {
        assert(TypeUtils.isValueOrPointerOfCategory(vector.getType(), TypeCategory.Vector));
        assert(TypeUtils.isValueOrPointerOfCategory(scalar.getType(), TypeCategory.Scalar));
        let components = ValueUtils.getVectorComponents(vector);
        components.push(scalar);
        return ValueUtils.makeVectorFromScalars(components);
    }
    static concatVectors(v0, v1) {
        assert(TypeUtils.isValueOrPointerOfCategory(v0.getType(), TypeCategory.Vector));
        assert(TypeUtils.isValueOrPointerOfCategory(v1.getType(), TypeCategory.Vector));
        let components0 = ValueUtils.getVectorComponents(v0);
        let components1 = ValueUtils.getVectorComponents(v1);
        let components = components0.concat(components1);
        return ValueUtils.makeVectorFromScalars(components);
    }
    static concatMatrices(m0, m1) {
        assert(TypeUtils.isValueOrPointerOfCategory(m0.getType(), TypeCategory.Matrix));
        assert(TypeUtils.isValueOrPointerOfCategory(m1.getType(), TypeCategory.Matrix));
        let rows0 = ValueUtils.getMatrixRowVectors(m0);
        let rows1 = ValueUtils.getMatrixRowVectors(m1);
        let rows = rows0.concat(rows1);
        return ValueUtils.makeMatrixFromVectorsAsRows(rows);
    }
    static addRowVectorToMatrix(matrix, vector) {
        assert(TypeUtils.isValueOrPointerOfCategory(vector.getType(), TypeCategory.Vector));
        assert(TypeUtils.isValueOrPointerOfCategory(matrix.getType(), TypeCategory.Matrix));
        let rows = ValueUtils.getMatrixRowVectors(matrix);
        rows.push(vector);
        return ValueUtils.makeMatrixFromVectorsAsRows(rows);
    }
    static makeStruct(keys, valuesMap) {
        let memberTypes = {};
        for (let k of keys) {
            memberTypes[k] = valuesMap.get(k).getType();
        }
        let structType = new StructType(memberTypes);
        let result = new Value(structType, []);
        for (let k of keys) {
            let stmts = valuesMap.get(k).stmts;
            result.stmts = result.stmts.concat(stmts);
        }
        let isCompileTimeConstant = true;
        for (let k of keys) {
            if (!valuesMap.get(k).isCompileTimeConstant()) {
                isCompileTimeConstant = false;
            }
        }
        if (isCompileTimeConstant) {
            for (let k of keys) {
                let compileTimeConstants = valuesMap.get(k).compileTimeConstants;
                result.compileTimeConstants = result.compileTimeConstants.concat(compileTimeConstants);
            }
        }
        return result;
    }
    static getStructMembers(structValue) {
        assert(TypeUtils.isValueOrPointerOfCategory(structValue.getType(), TypeCategory.Struct));
        let isPointer = structValue.getType().getCategory() === TypeCategory.Pointer;
        let structType;
        if (isPointer) {
            structType = structValue.getType().getValueType();
        }
        else {
            structType = structValue.getType();
        }
        let keys = structType.getPropertyNames();
        let result = new Map();
        for (let k of keys) {
            let offset = structType.getPropertyPrimitiveOffset(k);
            let memberType;
            let numPrims;
            if (isPointer) {
                let memberValueType = structType.getPropertyType(k);
                memberType = new PointerType(memberValueType, structValue.getType().getIsGlobal());
                numPrims = memberValueType.getPrimitivesList().length;
            }
            else {
                memberType = structType.getPropertyType(k);
                numPrims = memberType.getPrimitivesList().length;
            }
            let stmts = structValue.stmts.slice(offset, offset + numPrims);
            let val = new Value(memberType, stmts);
            if (structValue.isCompileTimeConstant()) {
                val.compileTimeConstants = structValue.compileTimeConstants.slice(offset, offset + numPrims);
            }
            result.set(k, val);
        }
        return result;
    }
    static makeHostObjectReference(val, markedAsStatic = false) {
        let result = new Value(new HostObjectReferenceType(markedAsStatic));
        result.hostSideValue = val;
        return result;
    }
}
