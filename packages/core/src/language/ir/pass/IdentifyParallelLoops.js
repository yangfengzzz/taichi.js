import { IRVisitor } from "../Visitor";
class IdentifyParallelLoopsPass extends IRVisitor {
    visitModule(module) {
        for (let stmt of module.block.stmts) {
            this.visit(stmt);
        }
    }
    visitBlock(block) { }
    visitRangeForStmt(stmt) {
        stmt.isParallelFor = !stmt.strictlySerialize;
    }
}
export function identifyParallelLoops(module) {
    let pass = new IdentifyParallelLoopsPass();
    pass.visitModule(module);
}
