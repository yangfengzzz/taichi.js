import { Guard } from "./Builder";
import { Block, IRModule } from "./Stmt";
import { IRVisitor } from "./Visitor";
export class IRTransformer extends IRVisitor {
    guards = [];
    module = new IRModule();
    transform(module) {
        this.module = module;
        this.visitBlock(module.block);
    }
    pushNewStmt(stmt) {
        this.guards.at(-1).block.stmts.push(stmt);
        return stmt;
    }
    addGuard(block) {
        let guard = new Guard(this, block);
        this.guards.push(guard);
        return guard;
    }
    visitBlock(block) {
        let result = new Block();
        let guard = this.addGuard(result);
        for (let s of block.stmts) {
            this.visit(s);
        }
        guard.delete();
        block.stmts = result.stmts;
    }
    visitConstStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitRangeForStmt(stmt) {
        this.pushNewStmt(stmt);
        this.visitBlock(stmt.body);
    }
    visitLoopIndexStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitAllocaStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitLocalLoadStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitLocalStoreStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitGlobalPtrStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitGlobalLoadStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitGlobalStoreStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitGlobalTemporaryStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitGlobalTemporaryLoadStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitGlobalTemporaryStoreStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitBinaryOpStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitUnaryOpStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitWhileStmt(stmt) {
        this.pushNewStmt(stmt);
        this.visitBlock(stmt.body);
    }
    visitIfStmt(stmt) {
        this.pushNewStmt(stmt);
        this.visitBlock(stmt.trueBranch);
        this.visitBlock(stmt.falseBranch);
    }
    visitWhileControlStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitContinueStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitArgLoadStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitRandStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitReturnStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitAtomicOpStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitAtomicLoadStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitAtomicStoreStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitVertexForStmt(stmt) {
        this.pushNewStmt(stmt);
        this.visitBlock(stmt.body);
    }
    visitFragmentForStmt(stmt) {
        this.pushNewStmt(stmt);
        this.visitBlock(stmt.body);
    }
    visitVertexInputStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitVertexOutputStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitFragmentInputStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitBuiltInOutputStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitBuiltInInputStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitFragmentDerivativeStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitDiscardStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitTextureFunctionStmt(stmt) {
        this.pushNewStmt(stmt);
    }
    visitCompositeExtractStmt(stmt) {
        this.pushNewStmt(stmt);
    }
}
