import { StmtKind } from "../Stmt";
import { IRTransformer } from "../Transformer";
import { IRVisitor } from "../Visitor";
class IdentifyUsefulInstructions extends IRVisitor {
    constructor() {
        super();
    }
    usefulInstructions = new Set();
    visit(stmt) {
        let kind = stmt.getKind();
        if ([
            StmtKind.GlobalStoreStmt,
            StmtKind.LocalStoreStmt,
            StmtKind.GlobalTemporaryStoreStmt,
            StmtKind.ReturnStmt,
            StmtKind.AtomicOpStmt,
            StmtKind.AtomicLoadStmt,
            StmtKind.AtomicStoreStmt,
            StmtKind.IfStmt,
            StmtKind.WhileStmt,
            StmtKind.RangeForStmt,
            StmtKind.FragmentForStmt,
            StmtKind.VertexForStmt,
            StmtKind.WhileControlStmt,
            StmtKind.ContinueStmt,
            StmtKind.DiscardStmt,
            StmtKind.VertexOutputStmt,
            StmtKind.BuiltInOutputStmt,
            StmtKind.TextureFunctionStmt
        ].includes(kind)) {
            this.usefulInstructions.add(stmt);
        }
        super.visit(stmt);
    }
    visitModule(module) {
        super.visitModule(module);
        let existingUseful = this.usefulInstructions;
        this.usefulInstructions = new Set();
        existingUseful.forEach((stmt) => {
            this.recursiveMarkUseful(stmt);
        });
    }
    recursiveMarkUseful(stmt) {
        if (this.usefulInstructions.has(stmt)) {
            return;
        }
        this.usefulInstructions.add(stmt);
        for (let operand of stmt.operands) {
            this.recursiveMarkUseful(operand);
        }
    }
}
class EliminatePass extends IRTransformer {
    usefulInstructions;
    constructor(usefulInstructions) {
        super();
        this.usefulInstructions = usefulInstructions;
    }
    visit(stmt) {
        if (!this.usefulInstructions.has(stmt)) {
            return;
        }
        super.visit(stmt);
    }
}
export function deadInstructionElimination(module) {
    let identify = new IdentifyUsefulInstructions();
    identify.visitModule(module);
    let useful = identify.usefulInstructions;
    let elim = new EliminatePass(useful);
    elim.transform(module);
}
