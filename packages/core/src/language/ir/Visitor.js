import { error } from "../../utils/Logging";
import { StmtKind } from "./Stmt";
export class IRVisitor {
    visitModule(module) {
        this.visitBlock(module.block);
    }
    visitBlock(block) {
        for (let s of block.stmts) {
            this.visit(s);
        }
    }
    visit(stmt) {
        switch (stmt.getKind()) {
            case StmtKind.ConstStmt:
                this.visitConstStmt(stmt);
                break;
            case StmtKind.RangeForStmt:
                this.visitRangeForStmt(stmt);
                break;
            case StmtKind.LoopIndexStmt:
                this.visitLoopIndexStmt(stmt);
                break;
            case StmtKind.AllocaStmt:
                this.visitAllocaStmt(stmt);
                break;
            case StmtKind.LocalLoadStmt:
                this.visitLocalLoadStmt(stmt);
                break;
            case StmtKind.LocalStoreStmt:
                this.visitLocalStoreStmt(stmt);
                break;
            case StmtKind.GlobalPtrStmt:
                this.visitGlobalPtrStmt(stmt);
                break;
            case StmtKind.GlobalLoadStmt:
                this.visitGlobalLoadStmt(stmt);
                break;
            case StmtKind.GlobalStoreStmt:
                this.visitGlobalStoreStmt(stmt);
                break;
            case StmtKind.GlobalTemporaryStmt:
                this.visitGlobalTemporaryStmt(stmt);
                break;
            case StmtKind.GlobalTemporaryLoadStmt:
                this.visitGlobalTemporaryLoadStmt(stmt);
                break;
            case StmtKind.GlobalTemporaryStoreStmt:
                this.visitGlobalTemporaryStoreStmt(stmt);
                break;
            case StmtKind.BinaryOpStmt:
                this.visitBinaryOpStmt(stmt);
                break;
            case StmtKind.UnaryOpStmt:
                this.visitUnaryOpStmt(stmt);
                break;
            case StmtKind.WhileStmt:
                this.visitWhileStmt(stmt);
                break;
            case StmtKind.IfStmt:
                this.visitIfStmt(stmt);
                break;
            case StmtKind.WhileControlStmt:
                this.visitWhileControlStmt(stmt);
                break;
            case StmtKind.ContinueStmt:
                this.visitContinueStmt(stmt);
                break;
            case StmtKind.ArgLoadStmt:
                this.visitArgLoadStmt(stmt);
                break;
            case StmtKind.RandStmt:
                this.visitRandStmt(stmt);
                break;
            case StmtKind.ReturnStmt:
                this.visitReturnStmt(stmt);
                break;
            case StmtKind.AtomicOpStmt:
                this.visitAtomicOpStmt(stmt);
                break;
            case StmtKind.AtomicLoadStmt:
                this.visitAtomicLoadStmt(stmt);
                break;
            case StmtKind.AtomicStoreStmt:
                this.visitAtomicStoreStmt(stmt);
                break;
            case StmtKind.VertexForStmt:
                this.visitVertexForStmt(stmt);
                break;
            case StmtKind.FragmentForStmt:
                this.visitFragmentForStmt(stmt);
                break;
            case StmtKind.VertexInputStmt:
                this.visitVertexInputStmt(stmt);
                break;
            case StmtKind.VertexOutputStmt:
                this.visitVertexOutputStmt(stmt);
                break;
            case StmtKind.FragmentInputStmt:
                this.visitFragmentInputStmt(stmt);
                break;
            case StmtKind.BuiltInOutputStmt:
                this.visitBuiltInOutputStmt(stmt);
                break;
            case StmtKind.BuiltInInputStmt:
                this.visitBuiltInInputStmt(stmt);
                break;
            case StmtKind.FragmentDerivativeStmt:
                this.visitFragmentDerivativeStmt(stmt);
                break;
            case StmtKind.DiscardStmt:
                this.visitDiscardStmt(stmt);
                break;
            case StmtKind.TextureFunctionStmt:
                this.visitTextureFunctionStmt(stmt);
                break;
            case StmtKind.CompositeExtractStmt:
                this.visitCompositeExtractStmt(stmt);
                break;
            default:
                error("unrecognized stmt: ", stmt);
        }
    }
    visitConstStmt(stmt) { }
    visitRangeForStmt(stmt) {
        this.visitBlock(stmt.body);
    }
    visitLoopIndexStmt(stmt) { }
    visitAllocaStmt(stmt) { }
    visitLocalLoadStmt(stmt) { }
    visitLocalStoreStmt(stmt) { }
    visitGlobalPtrStmt(stmt) { }
    visitGlobalLoadStmt(stmt) { }
    visitGlobalStoreStmt(stmt) { }
    visitGlobalTemporaryStmt(stmt) { }
    visitGlobalTemporaryLoadStmt(stmt) { }
    visitGlobalTemporaryStoreStmt(stmt) { }
    visitBinaryOpStmt(stmt) { }
    visitUnaryOpStmt(stmt) { }
    visitWhileStmt(stmt) {
        this.visitBlock(stmt.body);
    }
    visitIfStmt(stmt) {
        this.visitBlock(stmt.trueBranch);
        this.visitBlock(stmt.falseBranch);
    }
    visitWhileControlStmt(stmt) { }
    visitContinueStmt(stmt) { }
    visitArgLoadStmt(stmt) { }
    visitRandStmt(stmt) { }
    visitReturnStmt(stmt) { }
    visitAtomicOpStmt(stmt) { }
    visitAtomicLoadStmt(stmt) { }
    visitAtomicStoreStmt(stmt) { }
    visitVertexForStmt(stmt) {
        this.visitBlock(stmt.body);
    }
    visitFragmentForStmt(stmt) {
        this.visitBlock(stmt.body);
    }
    visitVertexInputStmt(stmt) { }
    visitVertexOutputStmt(stmt) { }
    visitFragmentInputStmt(stmt) { }
    visitBuiltInOutputStmt(stmt) { }
    visitBuiltInInputStmt(stmt) { }
    visitFragmentDerivativeStmt(stmt) { }
    visitDiscardStmt(stmt) { }
    visitTextureFunctionStmt(stmt) { }
    visitCompositeExtractStmt(stmt) { }
}
