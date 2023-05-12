import { PrimitiveType } from "../../frontend/Type";
import { UnaryOpStmt, UnaryOpType } from "../Stmt";
import { IRTransformer } from "../Transformer";
class FixOpTypesPass extends IRTransformer {
    visitBinaryOpStmt(stmt) {
        let LHS = stmt.getLeft();
        let RHS = stmt.getRight();
        if (LHS.getReturnType() === RHS.getReturnType()) {
            super.visitBinaryOpStmt(stmt);
            return;
        }
        // must be one i32 and one f32, needs to promote the i32
        if (LHS.getReturnType() === PrimitiveType.i32) {
            LHS = this.pushNewStmt(new UnaryOpStmt(LHS, UnaryOpType.cast_f32_value, this.module.getNewId()));
            stmt.setLeft(LHS);
        }
        else if (RHS.getReturnType() === PrimitiveType.i32) {
            RHS = this.pushNewStmt(new UnaryOpStmt(RHS, UnaryOpType.cast_f32_value, this.module.getNewId()));
            stmt.setRight(RHS);
        }
        this.pushNewStmt(stmt);
    }
}
export function fixOpTypes(module) {
    let pass = new FixOpTypesPass();
    pass.transform(module);
    return pass;
}
