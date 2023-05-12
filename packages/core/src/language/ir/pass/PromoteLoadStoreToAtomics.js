import { AtomicLoadStmt, AtomicStoreStmt, StmtKind } from "../Stmt";
import { IRTransformer } from "../Transformer";
import { IRVisitor } from "../Visitor";
import { DelayedStmtReplacer } from "./Replacer";
// If a buffer is used atomically at any point, all accesses to this buffer must be atomic
class IdentifyAtomicResources extends IRVisitor {
    constructor() {
        super();
    }
    atomicTrees = new Set();
    atomicGtemps = false;
    maybeMarkAtomics(pointer) {
        if (pointer.getKind() == StmtKind.GlobalPtrStmt) {
            let gloablPtr = pointer;
            let treeId = gloablPtr.field.snodeTree.treeId;
            this.atomicTrees.add(treeId);
        }
        else if (pointer.getKind() == StmtKind.GlobalTemporaryStmt) {
            this.atomicGtemps = true;
        }
    }
    visitAtomicOpStmt(stmt) {
        let dest = stmt.getDestination();
        this.maybeMarkAtomics(dest);
    }
    visitAtomicLoadStmt(stmt) {
        let ptr = stmt.getPointer();
        this.maybeMarkAtomics(ptr);
    }
    visitAtomicStoreStmt(stmt) {
        let ptr = stmt.getPointer();
        this.maybeMarkAtomics(ptr);
    }
}
class PromoteLoadStores extends IRTransformer {
    atomicTrees;
    atomicGtemps;
    replacer = new DelayedStmtReplacer();
    constructor(atomicTrees, atomicGtemps) {
        super();
        this.atomicTrees = atomicTrees;
        this.atomicGtemps = atomicGtemps;
    }
    visitGlobalLoadStmt(stmt) {
        let ptr = stmt.getPointer();
        if (this.atomicTrees.has(ptr.field.snodeTree.treeId)) {
            let atomicLoad = this.pushNewStmt(new AtomicLoadStmt(ptr, this.module.getNewId()));
            this.replacer.markReplace(stmt, atomicLoad);
        }
        else {
            this.pushNewStmt(stmt);
        }
    }
    visitGlobalStoreStmt(stmt) {
        let ptr = stmt.getPointer();
        if (this.atomicTrees.has(ptr.field.snodeTree.treeId)) {
            this.pushNewStmt(new AtomicStoreStmt(ptr, stmt.getValue(), this.module.getNewId()));
        }
        else {
            this.pushNewStmt(stmt);
        }
    }
    visitGlobalTemporaryLoadStmt(stmt) {
        let ptr = stmt.getPointer();
        if (this.atomicGtemps) {
            let atomicLoad = this.pushNewStmt(new AtomicLoadStmt(ptr, this.module.getNewId()));
            this.replacer.markReplace(stmt, atomicLoad);
        }
        else {
            this.pushNewStmt(stmt);
        }
    }
    visitGlobalTemporaryStoreStmt(stmt) {
        let ptr = stmt.getPointer();
        if (this.atomicGtemps) {
            this.pushNewStmt(new AtomicStoreStmt(ptr, stmt.getValue(), this.module.getNewId()));
        }
        else {
            this.pushNewStmt(stmt);
        }
    }
    transform(module) {
        super.transform(module);
        this.replacer.transform(module);
    }
}
export function promoteLoadStoreToAtomics(module) {
    let identify = new IdentifyAtomicResources();
    identify.visitModule(module);
    let promote = new PromoteLoadStores(identify.atomicTrees, identify.atomicGtemps);
    promote.transform(module);
    return module;
}
