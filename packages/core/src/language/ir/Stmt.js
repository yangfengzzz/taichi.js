import { PrimitiveType } from "../frontend/Type";
import { assert, error } from "../../utils/Logging";
// designed to have the same API as native taichi's IR
// which is why there're some camel_case and camelCase mash-ups
export var StmtKind;
(function (StmtKind) {
    StmtKind[StmtKind["ConstStmt"] = 0] = "ConstStmt";
    StmtKind[StmtKind["RangeForStmt"] = 1] = "RangeForStmt";
    StmtKind[StmtKind["LoopIndexStmt"] = 2] = "LoopIndexStmt";
    StmtKind[StmtKind["AllocaStmt"] = 3] = "AllocaStmt";
    StmtKind[StmtKind["LocalLoadStmt"] = 4] = "LocalLoadStmt";
    StmtKind[StmtKind["LocalStoreStmt"] = 5] = "LocalStoreStmt";
    StmtKind[StmtKind["GlobalPtrStmt"] = 6] = "GlobalPtrStmt";
    StmtKind[StmtKind["GlobalLoadStmt"] = 7] = "GlobalLoadStmt";
    StmtKind[StmtKind["GlobalStoreStmt"] = 8] = "GlobalStoreStmt";
    StmtKind[StmtKind["GlobalTemporaryStmt"] = 9] = "GlobalTemporaryStmt";
    StmtKind[StmtKind["GlobalTemporaryLoadStmt"] = 10] = "GlobalTemporaryLoadStmt";
    StmtKind[StmtKind["GlobalTemporaryStoreStmt"] = 11] = "GlobalTemporaryStoreStmt";
    StmtKind[StmtKind["BinaryOpStmt"] = 12] = "BinaryOpStmt";
    StmtKind[StmtKind["UnaryOpStmt"] = 13] = "UnaryOpStmt";
    StmtKind[StmtKind["WhileStmt"] = 14] = "WhileStmt";
    StmtKind[StmtKind["IfStmt"] = 15] = "IfStmt";
    StmtKind[StmtKind["WhileControlStmt"] = 16] = "WhileControlStmt";
    StmtKind[StmtKind["ContinueStmt"] = 17] = "ContinueStmt";
    StmtKind[StmtKind["ArgLoadStmt"] = 18] = "ArgLoadStmt";
    StmtKind[StmtKind["RandStmt"] = 19] = "RandStmt";
    StmtKind[StmtKind["ReturnStmt"] = 20] = "ReturnStmt";
    StmtKind[StmtKind["AtomicOpStmt"] = 21] = "AtomicOpStmt";
    StmtKind[StmtKind["AtomicLoadStmt"] = 22] = "AtomicLoadStmt";
    StmtKind[StmtKind["AtomicStoreStmt"] = 23] = "AtomicStoreStmt";
    StmtKind[StmtKind["VertexForStmt"] = 24] = "VertexForStmt";
    StmtKind[StmtKind["FragmentForStmt"] = 25] = "FragmentForStmt";
    StmtKind[StmtKind["VertexInputStmt"] = 26] = "VertexInputStmt";
    StmtKind[StmtKind["VertexOutputStmt"] = 27] = "VertexOutputStmt";
    StmtKind[StmtKind["FragmentInputStmt"] = 28] = "FragmentInputStmt";
    StmtKind[StmtKind["BuiltInOutputStmt"] = 29] = "BuiltInOutputStmt";
    StmtKind[StmtKind["BuiltInInputStmt"] = 30] = "BuiltInInputStmt";
    StmtKind[StmtKind["FragmentDerivativeStmt"] = 31] = "FragmentDerivativeStmt";
    StmtKind[StmtKind["DiscardStmt"] = 32] = "DiscardStmt";
    StmtKind[StmtKind["TextureFunctionStmt"] = 33] = "TextureFunctionStmt";
    StmtKind[StmtKind["CompositeExtractStmt"] = 34] = "CompositeExtractStmt";
})(StmtKind || (StmtKind = {}));
export class Stmt {
    id;
    returnType;
    nameHint;
    constructor(id, returnType, nameHint = "") {
        this.id = id;
        this.returnType = returnType;
        this.nameHint = nameHint;
    }
    getName() {
        return `_${this.id}_${this.nameHint}`;
    }
    getReturnType() {
        if (!this.returnType) {
            error("missing return type ", this);
        }
        return this.returnType;
    }
    operands = [];
}
export class ConstStmt extends Stmt {
    val;
    constructor(val, returntype, id, nameHint = "") {
        super(id, returntype, nameHint);
        this.val = val;
    }
    getKind() {
        return StmtKind.ConstStmt;
    }
}
export class RangeForStmt extends Stmt {
    strictlySerialize;
    body;
    constructor(range, strictlySerialize, body, id, nameHint = "") {
        super(id, undefined, nameHint);
        this.strictlySerialize = strictlySerialize;
        this.body = body;
        this.operands = [range];
    }
    isParallelFor = false;
    getRange() {
        return this.operands[0];
    }
    setRange(range) {
        this.operands[0] = range;
    }
    getKind() {
        return StmtKind.RangeForStmt;
    }
}
export class LoopIndexStmt extends Stmt {
    constructor(loop, id, nameHint = "") {
        super(id, PrimitiveType.i32, nameHint);
        this.operands = [loop];
    }
    getLoop() {
        return this.operands[0];
    }
    getKind() {
        return StmtKind.LoopIndexStmt;
    }
}
export class AllocaStmt extends Stmt {
    allocatedType;
    constructor(allocatedType, id, nameHint = "") {
        super(id, undefined, nameHint);
        this.allocatedType = allocatedType;
    }
    getKind() {
        return StmtKind.AllocaStmt;
    }
}
export class LocalLoadStmt extends Stmt {
    constructor(ptr, id, nameHint = "") {
        super(id, ptr.allocatedType, nameHint);
        this.operands = [ptr];
    }
    getPointer() {
        return this.operands[0];
    }
    getKind() {
        return StmtKind.LocalLoadStmt;
    }
}
export class LocalStoreStmt extends Stmt {
    constructor(ptr, value, id, nameHint = "") {
        super(id, undefined, nameHint);
        this.operands = [ptr, value];
    }
    getPointer() {
        return this.operands[0];
    }
    getValue() {
        return this.operands[1];
    }
    getKind() {
        return StmtKind.LocalStoreStmt;
    }
}
export class GlobalPtrStmt extends Stmt {
    field;
    offsetInElement;
    constructor(field, indices, offsetInElement, id, nameHint = "") {
        super(id, undefined, nameHint);
        this.field = field;
        this.offsetInElement = offsetInElement;
        this.operands = indices.slice();
    }
    getKind() {
        return StmtKind.GlobalPtrStmt;
    }
    getPointedType() {
        return this.field.elementType.getPrimitivesList()[this.offsetInElement];
    }
    getIndices() {
        return this.operands.slice();
    }
}
export class GlobalLoadStmt extends Stmt {
    ptr;
    constructor(ptr, id, nameHint = "") {
        let returnType = ptr.field.elementType.getPrimitivesList()[ptr.offsetInElement];
        super(id, returnType, nameHint);
        this.ptr = ptr;
        this.operands = [ptr];
    }
    getPointer() {
        return this.operands[0];
    }
    getKind() {
        return StmtKind.GlobalLoadStmt;
    }
}
export class GlobalStoreStmt extends Stmt {
    ptr;
    value;
    constructor(ptr, value, id, nameHint = "") {
        super(id, undefined, nameHint);
        this.ptr = ptr;
        this.value = value;
        this.operands = [ptr, value];
    }
    getPointer() {
        return this.operands[0];
    }
    getValue() {
        return this.operands[1];
    }
    getKind() {
        return StmtKind.GlobalStoreStmt;
    }
}
export class GlobalTemporaryStmt extends Stmt {
    type;
    offset;
    constructor(type, offset, id, nameHint = "") {
        super(id, undefined, nameHint);
        this.type = type;
        this.offset = offset;
    }
    getKind() {
        return StmtKind.GlobalTemporaryStmt;
    }
}
export class GlobalTemporaryLoadStmt extends Stmt {
    ptr;
    constructor(ptr, id, nameHint = "") {
        super(id, ptr.type, nameHint);
        this.ptr = ptr;
        this.operands = [ptr];
    }
    getPointer() {
        return this.operands[0];
    }
    getKind() {
        return StmtKind.GlobalTemporaryLoadStmt;
    }
}
export class GlobalTemporaryStoreStmt extends Stmt {
    ptr;
    value;
    constructor(ptr, value, id, nameHint = "") {
        super(id, undefined, nameHint);
        this.ptr = ptr;
        this.value = value;
        this.operands = [ptr, value];
    }
    getPointer() {
        return this.operands[0];
    }
    getValue() {
        return this.operands[1];
    }
    getKind() {
        return StmtKind.GlobalTemporaryStoreStmt;
    }
}
export function isPointerStmt(stmt) {
    return [StmtKind.AllocaStmt, StmtKind.GlobalPtrStmt, StmtKind.GlobalTemporaryStmt].includes(stmt.getKind());
}
export function getPointedType(ptr) {
    switch (ptr.getKind()) {
        case StmtKind.AllocaStmt:
            return ptr.allocatedType;
        case StmtKind.GlobalPtrStmt:
            return ptr.getPointedType();
        case StmtKind.GlobalTemporaryStmt:
            return ptr.type;
        default: {
            error("not a pointer type!");
            return PrimitiveType.i32;
        }
    }
}
export var BinaryOpType;
(function (BinaryOpType) {
    BinaryOpType[BinaryOpType["mul"] = 0] = "mul";
    BinaryOpType[BinaryOpType["add"] = 1] = "add";
    BinaryOpType[BinaryOpType["sub"] = 2] = "sub";
    BinaryOpType[BinaryOpType["truediv"] = 3] = "truediv";
    BinaryOpType[BinaryOpType["floordiv"] = 4] = "floordiv";
    BinaryOpType[BinaryOpType["mod"] = 5] = "mod";
    BinaryOpType[BinaryOpType["max"] = 6] = "max";
    BinaryOpType[BinaryOpType["min"] = 7] = "min";
    BinaryOpType[BinaryOpType["bit_and"] = 8] = "bit_and";
    BinaryOpType[BinaryOpType["bit_or"] = 9] = "bit_or";
    BinaryOpType[BinaryOpType["bit_xor"] = 10] = "bit_xor";
    BinaryOpType[BinaryOpType["bit_shl"] = 11] = "bit_shl";
    BinaryOpType[BinaryOpType["bit_shr"] = 12] = "bit_shr";
    BinaryOpType[BinaryOpType["bit_sar"] = 13] = "bit_sar";
    BinaryOpType[BinaryOpType["cmp_lt"] = 14] = "cmp_lt";
    BinaryOpType[BinaryOpType["cmp_le"] = 15] = "cmp_le";
    BinaryOpType[BinaryOpType["cmp_gt"] = 16] = "cmp_gt";
    BinaryOpType[BinaryOpType["cmp_ge"] = 17] = "cmp_ge";
    BinaryOpType[BinaryOpType["cmp_eq"] = 18] = "cmp_eq";
    BinaryOpType[BinaryOpType["cmp_ne"] = 19] = "cmp_ne";
    BinaryOpType[BinaryOpType["atan2"] = 20] = "atan2";
    BinaryOpType[BinaryOpType["pow"] = 21] = "pow";
    BinaryOpType[BinaryOpType["logical_or"] = 22] = "logical_or";
    BinaryOpType[BinaryOpType["logical_and"] = 23] = "logical_and";
})(BinaryOpType || (BinaryOpType = {}));
export function getBinaryOpReturnType(leftType, rightType, op) {
    switch (op) {
        case BinaryOpType.cmp_eq:
        case BinaryOpType.cmp_ge:
        case BinaryOpType.cmp_gt:
        case BinaryOpType.cmp_le:
        case BinaryOpType.cmp_lt:
        case BinaryOpType.cmp_ne:
            return PrimitiveType.i32;
        case BinaryOpType.logical_and:
        case BinaryOpType.logical_or:
        case BinaryOpType.bit_and:
        case BinaryOpType.bit_or:
        case BinaryOpType.bit_xor:
        case BinaryOpType.bit_shl:
        case BinaryOpType.bit_sar:
        case BinaryOpType.bit_shr: {
            if (leftType !== PrimitiveType.i32 || rightType !== PrimitiveType.i32) {
                return undefined;
            }
            return PrimitiveType.i32;
        }
        case BinaryOpType.truediv:
            return PrimitiveType.f32;
        case BinaryOpType.floordiv:
            return PrimitiveType.i32;
        default: {
            if (leftType == rightType) {
                return leftType;
            }
            return PrimitiveType.f32;
        }
    }
}
export class BinaryOpStmt extends Stmt {
    left;
    right;
    op;
    constructor(left, right, op, id, nameHint = "") {
        assert(left.returnType !== undefined && right.returnType !== undefined, "LHS and RHS of binary op must both have a valid return type", left, right);
        let returnType = getBinaryOpReturnType(left.getReturnType(), right.getReturnType(), op);
        super(id, returnType, nameHint);
        this.left = left;
        this.right = right;
        this.op = op;
        this.operands = [left, right];
    }
    getKind() {
        return StmtKind.BinaryOpStmt;
    }
    getLeft() {
        return this.operands[0];
    }
    getRight() {
        return this.operands[1];
    }
    setLeft(left) {
        this.operands[0] = left;
    }
    setRight(right) {
        this.operands[1] = right;
    }
}
export var UnaryOpType;
(function (UnaryOpType) {
    UnaryOpType[UnaryOpType["neg"] = 0] = "neg";
    UnaryOpType[UnaryOpType["sqrt"] = 1] = "sqrt";
    UnaryOpType[UnaryOpType["round"] = 2] = "round";
    UnaryOpType[UnaryOpType["floor"] = 3] = "floor";
    UnaryOpType[UnaryOpType["ceil"] = 4] = "ceil";
    UnaryOpType[UnaryOpType["cast_i32_value"] = 5] = "cast_i32_value";
    UnaryOpType[UnaryOpType["cast_f32_value"] = 6] = "cast_f32_value";
    UnaryOpType[UnaryOpType["cast_i32_bits"] = 7] = "cast_i32_bits";
    UnaryOpType[UnaryOpType["cast_f32_bits"] = 8] = "cast_f32_bits";
    UnaryOpType[UnaryOpType["abs"] = 9] = "abs";
    UnaryOpType[UnaryOpType["sgn"] = 10] = "sgn";
    UnaryOpType[UnaryOpType["sin"] = 11] = "sin";
    UnaryOpType[UnaryOpType["asin"] = 12] = "asin";
    UnaryOpType[UnaryOpType["cos"] = 13] = "cos";
    UnaryOpType[UnaryOpType["acos"] = 14] = "acos";
    UnaryOpType[UnaryOpType["tan"] = 15] = "tan";
    UnaryOpType[UnaryOpType["tanh"] = 16] = "tanh";
    UnaryOpType[UnaryOpType["inv"] = 17] = "inv";
    UnaryOpType[UnaryOpType["rcp"] = 18] = "rcp";
    UnaryOpType[UnaryOpType["exp"] = 19] = "exp";
    UnaryOpType[UnaryOpType["log"] = 20] = "log";
    UnaryOpType[UnaryOpType["rsqrt"] = 21] = "rsqrt";
    UnaryOpType[UnaryOpType["bit_not"] = 22] = "bit_not";
    UnaryOpType[UnaryOpType["logic_not"] = 23] = "logic_not";
})(UnaryOpType || (UnaryOpType = {}));
export function getUnaryOpReturnType(operandType, op) {
    switch (op) {
        case UnaryOpType.round:
        case UnaryOpType.floor:
        case UnaryOpType.ceil:
            return PrimitiveType.i32;
        case UnaryOpType.cast_i32_value:
        case UnaryOpType.cast_i32_bits:
            return PrimitiveType.i32;
        case UnaryOpType.cast_f32_value:
        case UnaryOpType.cast_f32_bits:
            return PrimitiveType.f32;
        case UnaryOpType.sgn:
            return PrimitiveType.i32;
        case UnaryOpType.bit_not:
        case UnaryOpType.logic_not:
            if (operandType !== PrimitiveType.i32) {
                return undefined;
            }
            return PrimitiveType.i32;
        case UnaryOpType.abs:
        case UnaryOpType.neg:
            return operandType;
        default:
            return PrimitiveType.f32;
    }
}
export class UnaryOpStmt extends Stmt {
    operand;
    op;
    constructor(operand, op, id, nameHint = "") {
        assert(operand.returnType !== undefined, "Unary op operand must have a valid return type");
        let returnType = getUnaryOpReturnType(operand.getReturnType(), op);
        super(id, returnType, nameHint);
        this.operand = operand;
        this.op = op;
        this.operands = [this.operand];
    }
    getKind() {
        return StmtKind.UnaryOpStmt;
    }
    getOperand() {
        return this.operands[0];
    }
}
export class WhileStmt extends Stmt {
    body;
    constructor(body, id, nameHint = "") {
        super(id, undefined, nameHint);
        this.body = body;
    }
    getKind() {
        return StmtKind.WhileStmt;
    }
}
export class IfStmt extends Stmt {
    trueBranch;
    falseBranch;
    constructor(cond, trueBranch, falseBranch, id, nameHint = "") {
        super(id, undefined, nameHint);
        this.trueBranch = trueBranch;
        this.falseBranch = falseBranch;
        this.operands = [cond];
    }
    getKind() {
        return StmtKind.IfStmt;
    }
    getCondition() {
        return this.operands[0];
    }
}
export class WhileControlStmt extends Stmt {
    constructor(id, nameHint = "") {
        super(id, undefined, nameHint);
    }
    getKind() {
        return StmtKind.WhileControlStmt;
    }
}
export class ContinueStmt extends Stmt {
    constructor(id, nameHint = "") {
        super(id, undefined, nameHint);
    }
    getKind() {
        return StmtKind.ContinueStmt;
    }
}
export class ArgLoadStmt extends Stmt {
    argId;
    constructor(argType, argId, id, nameHint = "") {
        super(id, argType, nameHint);
        this.argId = argId;
    }
    getKind() {
        return StmtKind.ArgLoadStmt;
    }
}
export class RandStmt extends Stmt {
    constructor(type, id, nameHint = "") {
        super(id, type, nameHint);
    }
    getKind() {
        return StmtKind.RandStmt;
    }
}
export class ReturnStmt extends Stmt {
    constructor(values, id, nameHint = "") {
        super(id, undefined, nameHint);
        this.operands = values.slice();
    }
    getKind() {
        return StmtKind.ReturnStmt;
    }
    getValues() {
        return this.operands.slice();
    }
}
export var AtomicOpType;
(function (AtomicOpType) {
    AtomicOpType[AtomicOpType["add"] = 0] = "add";
    AtomicOpType[AtomicOpType["sub"] = 1] = "sub";
    AtomicOpType[AtomicOpType["max"] = 2] = "max";
    AtomicOpType[AtomicOpType["min"] = 3] = "min";
    AtomicOpType[AtomicOpType["bit_and"] = 4] = "bit_and";
    AtomicOpType[AtomicOpType["bit_or"] = 5] = "bit_or";
    AtomicOpType[AtomicOpType["bit_xor"] = 6] = "bit_xor";
})(AtomicOpType || (AtomicOpType = {}));
export class AtomicOpStmt extends Stmt {
    op;
    constructor(dest, operand, op, id, nameHint = "") {
        super(id, getPointedType(dest), nameHint);
        this.op = op;
        this.operands = [dest, operand];
    }
    getKind() {
        return StmtKind.AtomicOpStmt;
    }
    getDestination() {
        return this.operands[0];
    }
    getOperand() {
        return this.operands[1];
    }
}
export class AtomicLoadStmt extends Stmt {
    ptr;
    constructor(ptr, id, nameHint = "") {
        let returnType = getPointedType(ptr);
        super(id, returnType, nameHint);
        this.ptr = ptr;
        this.operands = [ptr];
    }
    getPointer() {
        return this.operands[0];
    }
    getKind() {
        return StmtKind.AtomicLoadStmt;
    }
}
export class AtomicStoreStmt extends Stmt {
    ptr;
    value;
    constructor(ptr, value, id, nameHint = "") {
        super(id, undefined, nameHint);
        this.ptr = ptr;
        this.value = value;
        this.operands = [ptr, value];
    }
    getPointer() {
        return this.operands[0];
    }
    getValue() {
        return this.operands[1];
    }
    getKind() {
        return StmtKind.AtomicStoreStmt;
    }
}
export class VertexForStmt extends Stmt {
    body;
    constructor(body, id, nameHint = "") {
        super(id, undefined, nameHint);
        this.body = body;
    }
    getKind() {
        return StmtKind.VertexForStmt;
    }
}
export class FragmentForStmt extends Stmt {
    body;
    constructor(body, id, nameHint = "") {
        super(id, undefined, nameHint);
        this.body = body;
    }
    getKind() {
        return StmtKind.FragmentForStmt;
    }
}
export class VertexInputStmt extends Stmt {
    location;
    constructor(type, location, id, nameHint = "") {
        super(id, type, nameHint);
        this.location = location;
    }
    getKind() {
        return StmtKind.VertexInputStmt;
    }
}
export class VertexOutputStmt extends Stmt {
    location;
    constructor(value, location, id, nameHint = "") {
        super(id, undefined, nameHint);
        this.location = location;
        this.operands = [value];
    }
    getKind() {
        return StmtKind.VertexOutputStmt;
    }
    getValue() {
        return this.operands[0];
    }
}
export class FragmentInputStmt extends Stmt {
    location;
    constructor(type, location, id, nameHint = "") {
        super(id, type, nameHint);
        this.location = location;
    }
    getKind() {
        return StmtKind.FragmentInputStmt;
    }
}
export var BuiltInOutputKind;
(function (BuiltInOutputKind) {
    BuiltInOutputKind[BuiltInOutputKind["Position"] = 0] = "Position";
    BuiltInOutputKind[BuiltInOutputKind["Color"] = 1] = "Color";
    BuiltInOutputKind[BuiltInOutputKind["FragDepth"] = 2] = "FragDepth";
})(BuiltInOutputKind || (BuiltInOutputKind = {}));
export class BuiltInOutputStmt extends Stmt {
    builtinKind;
    location;
    constructor(values, builtinKind, location, id, nameHint = "") {
        super(id, undefined, nameHint);
        this.builtinKind = builtinKind;
        this.location = location;
        this.operands = values.slice();
    }
    getKind() {
        return StmtKind.BuiltInOutputStmt;
    }
    getValues() {
        return this.operands.slice();
    }
}
export var BuiltInInputKind;
(function (BuiltInInputKind) {
    BuiltInInputKind[BuiltInInputKind["VertexIndex"] = 0] = "VertexIndex";
    BuiltInInputKind[BuiltInInputKind["InstanceIndex"] = 1] = "InstanceIndex";
    BuiltInInputKind[BuiltInInputKind["FragCoord"] = 2] = "FragCoord";
})(BuiltInInputKind || (BuiltInInputKind = {}));
export function getBuiltinInputPrimitiveType(kind) {
    switch (kind) {
        case BuiltInInputKind.VertexIndex:
        case BuiltInInputKind.InstanceIndex:
            return PrimitiveType.i32;
        case BuiltInInputKind.FragCoord:
            return PrimitiveType.f32;
    }
}
export function getBuiltinInputComponentCount(kind) {
    switch (kind) {
        case BuiltInInputKind.VertexIndex:
        case BuiltInInputKind.InstanceIndex:
            return 1;
        case BuiltInInputKind.FragCoord:
            return 4;
    }
}
export class BuiltInInputStmt extends Stmt {
    builtinKind;
    constructor(builtinKind, id, nameHint = "") {
        super(id, getBuiltinInputPrimitiveType(builtinKind), nameHint);
        this.builtinKind = builtinKind;
    }
    getKind() {
        return StmtKind.BuiltInInputStmt;
    }
}
export var FragmentDerivativeDirection;
(function (FragmentDerivativeDirection) {
    FragmentDerivativeDirection[FragmentDerivativeDirection["x"] = 0] = "x";
    FragmentDerivativeDirection[FragmentDerivativeDirection["y"] = 1] = "y";
})(FragmentDerivativeDirection || (FragmentDerivativeDirection = {}));
export class FragmentDerivativeStmt extends Stmt {
    direction;
    constructor(direction, value, id, nameHint = "") {
        super(id, PrimitiveType.f32, nameHint);
        this.direction = direction;
        this.operands.push(value);
    }
    getKind() {
        return StmtKind.FragmentDerivativeStmt;
    }
    getValue() {
        return this.operands[0];
    }
}
export class DiscardStmt extends Stmt {
    constructor(id, nameHint = "") {
        super(id, undefined, nameHint);
    }
    getKind() {
        return StmtKind.DiscardStmt;
    }
}
export var TextureFunctionKind;
(function (TextureFunctionKind) {
    TextureFunctionKind[TextureFunctionKind["Sample"] = 0] = "Sample";
    TextureFunctionKind[TextureFunctionKind["SampleLod"] = 1] = "SampleLod";
    TextureFunctionKind[TextureFunctionKind["SampleCompare"] = 2] = "SampleCompare";
    TextureFunctionKind[TextureFunctionKind["Load"] = 3] = "Load";
    TextureFunctionKind[TextureFunctionKind["Store"] = 4] = "Store";
})(TextureFunctionKind || (TextureFunctionKind = {}));
export function getTextureFunctionResultType(func) {
    switch (func) {
        case TextureFunctionKind.Load:
        case TextureFunctionKind.SampleLod:
        case TextureFunctionKind.Sample:
        case TextureFunctionKind.SampleCompare:
            return PrimitiveType.f32;
        case TextureFunctionKind.Store:
            return undefined;
    }
}
export class TextureFunctionStmt extends Stmt {
    texture;
    func;
    constructor(texture, func, coordinates, additionalOperands, id, nameHint = "") {
        super(id, getTextureFunctionResultType(func), nameHint);
        this.texture = texture;
        this.func = func;
        this.additionalOperandsCount = additionalOperands.length;
        this.operands = coordinates.concat(additionalOperands);
    }
    additionalOperandsCount = 0;
    getKind() {
        return StmtKind.TextureFunctionStmt;
    }
    getCoordinates() {
        return this.operands.slice(0, this.operands.length - this.additionalOperandsCount);
    }
    getAdditionalOperands() {
        return this.operands.slice(-this.additionalOperandsCount);
    }
}
export class CompositeExtractStmt extends Stmt {
    elementIndex;
    constructor(composite, elementIndex, id, nameHint = "") {
        super(id, composite.returnType, nameHint);
        this.elementIndex = elementIndex;
        this.operands = [composite];
    }
    getKind() {
        return StmtKind.CompositeExtractStmt;
    }
    getComposite() {
        return this.operands[0];
    }
}
export class Block {
    stmts;
    constructor(stmts = []) {
        this.stmts = stmts;
    }
}
export class IRModule {
    constructor() { }
    block = new Block();
    idBound = 0;
    getNewId() {
        return this.idBound++;
    }
}
