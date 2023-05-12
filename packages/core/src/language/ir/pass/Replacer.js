import { IRTransformer } from "../Transformer";
export class DelayedStmtReplacer extends IRTransformer {
    replaceMap = new Map();
    markReplace(a, b) {
        this.replaceMap.set(a, b);
    }
    pushNewStmt(stmt) {
        for (let i = 0; i < stmt.operands.length; ++i) {
            if (this.replaceMap.has(stmt.operands[i])) {
                stmt.operands[i] = this.replaceMap.get(stmt.operands[i]);
            }
        }
        return super.pushNewStmt(stmt);
    }
}
