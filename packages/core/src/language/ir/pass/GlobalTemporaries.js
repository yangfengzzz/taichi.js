import { error } from "../../../utils/Logging";
import { PrimitiveType } from "../../frontend/Type";
import { AtomicOpStmt, StmtKind, GlobalTemporaryLoadStmt, GlobalTemporaryStmt, GlobalTemporaryStoreStmt, isPointerStmt, AtomicLoadStmt, AtomicStoreStmt } from "../Stmt";
import { IRTransformer } from "../Transformer";
import { IRVisitor } from "../Visitor";
import { DelayedStmtReplacer } from "./Replacer";
class IdentifyAllocasUsedInParallelForsPass extends IRVisitor {
    nextAvailableGtemp;
    inParallelLoop = false;
    thisOffloadSerialAllocas = new Set();
    maybeAllocateGtemp(alloca) {
        if (!this.thisOffloadSerialAllocas.has(alloca) && !this.gtempsAllocation.has(alloca)) {
            let offset = this.gtempsAllocation.size + this.nextAvailableGtemp;
            this.gtempsAllocation.set(alloca, offset);
        }
    }
    gtempsAllocation = new Map();
    constructor(nextAvailableGtemp) {
        super();
        this.nextAvailableGtemp = nextAvailableGtemp;
    }
    visitRangeForStmt(stmt) {
        if (stmt.isParallelFor) {
            this.inParallelLoop = true;
            this.thisOffloadSerialAllocas.clear();
        }
        super.visitRangeForStmt(stmt);
        if (stmt.isParallelFor) {
            this.inParallelLoop = false;
            this.thisOffloadSerialAllocas.clear();
        }
    }
    visitVertexForStmt(stmt) {
        this.inParallelLoop = true;
        this.thisOffloadSerialAllocas.clear();
        super.visitVertexForStmt(stmt);
        this.inParallelLoop = false;
        this.thisOffloadSerialAllocas.clear();
    }
    visitFragmentForStmt(stmt) {
        this.inParallelLoop = true;
        this.thisOffloadSerialAllocas.clear();
        super.visitFragmentForStmt(stmt);
        this.inParallelLoop = false;
        this.thisOffloadSerialAllocas.clear();
    }
    visitAllocaStmt(stmt) {
        this.thisOffloadSerialAllocas.add(stmt);
    }
    visitLocalLoadStmt(stmt) {
        this.maybeAllocateGtemp(stmt.getPointer());
    }
    visitLocalStoreStmt(stmt) {
        this.maybeAllocateGtemp(stmt.getPointer());
    }
    visitAtomicOpStmt(stmt) {
        if (stmt.getDestination().getKind() === StmtKind.AllocaStmt) {
            this.maybeAllocateGtemp(stmt.getDestination());
        }
    }
    visitAtomicLoadStmt(stmt) {
        if (stmt.getPointer().getKind() === StmtKind.AllocaStmt) {
            this.maybeAllocateGtemp(stmt.getPointer());
        }
    }
    visitAtomicStoreStmt(stmt) {
        if (stmt.getPointer().getKind() === StmtKind.AllocaStmt) {
            this.maybeAllocateGtemp(stmt.getPointer());
        }
    }
}
class ReplaceAllocasUsedInParallelForsPass extends IRTransformer {
    gtempsAllocation;
    replacer = new DelayedStmtReplacer();
    constructor(gtempsAllocation) {
        super();
        this.gtempsAllocation = gtempsAllocation;
    }
    maybeGetReplacementGtemp(stmt) {
        if (this.gtempsAllocation.has(stmt)) {
            let gtempId = this.gtempsAllocation.get(stmt);
            let gtemp = new GlobalTemporaryStmt(stmt.allocatedType, gtempId, this.module.getNewId());
            return gtemp;
        }
        return undefined;
    }
    visitLocalLoadStmt(stmt) {
        let gtemp = this.maybeGetReplacementGtemp(stmt.getPointer());
        if (gtemp) {
            let gtempLoadStmt = new GlobalTemporaryLoadStmt(gtemp, this.module.getNewId());
            this.pushNewStmt(gtemp);
            this.pushNewStmt(gtempLoadStmt);
            this.replacer.markReplace(stmt, gtempLoadStmt);
        }
        else {
            this.pushNewStmt(stmt);
        }
    }
    visitLocalStoreStmt(stmt) {
        let gtemp = this.maybeGetReplacementGtemp(stmt.getPointer());
        if (gtemp) {
            let gtempStoreStmt = new GlobalTemporaryStoreStmt(gtemp, stmt.getValue(), this.module.getNewId());
            this.pushNewStmt(gtemp);
            this.pushNewStmt(gtempStoreStmt);
        }
        else {
            this.pushNewStmt(stmt);
        }
    }
    visitAtomicOpStmt(stmt) {
        if (stmt.getDestination().getKind() === StmtKind.AllocaStmt) {
            let alloca = stmt.getDestination();
            let gtemp = this.maybeGetReplacementGtemp(alloca);
            if (gtemp) {
                let atomicStmt = new AtomicOpStmt(gtemp, stmt.getOperand(), stmt.op, this.module.getNewId());
                this.pushNewStmt(gtemp);
                this.pushNewStmt(atomicStmt);
                this.replacer.markReplace(stmt, atomicStmt);
                return;
            }
        }
        this.pushNewStmt(stmt);
    }
    visitAtomicLoadStmt(stmt) {
        if (stmt.getPointer().getKind() === StmtKind.AllocaStmt) {
            let alloca = stmt.getPointer();
            let gtemp = this.maybeGetReplacementGtemp(alloca);
            if (gtemp) {
                let atomicStmt = new AtomicLoadStmt(gtemp, this.module.getNewId());
                this.pushNewStmt(gtemp);
                this.pushNewStmt(atomicStmt);
                this.replacer.markReplace(stmt, atomicStmt);
                return;
            }
        }
        this.pushNewStmt(stmt);
    }
    visitAtomicStoreStmt(stmt) {
        if (stmt.getPointer().getKind() === StmtKind.AllocaStmt) {
            let alloca = stmt.getPointer();
            let gtemp = this.maybeGetReplacementGtemp(alloca);
            if (gtemp) {
                let atomicStmt = new AtomicStoreStmt(gtemp, stmt.getValue(), this.module.getNewId());
                this.pushNewStmt(gtemp);
                this.pushNewStmt(atomicStmt);
                return;
            }
        }
        this.pushNewStmt(stmt);
    }
    transform(module) {
        super.transform(module);
        this.replacer.transform(module);
    }
}
class IdentifyValuesUsedInParallelForsPass extends IRVisitor {
    nextAvailableGtemp;
    inParallelLoop = false;
    serialValues = new Set();
    gtempsAllocation = new Map();
    constructor(nextAvailableGtemp) {
        super();
        this.nextAvailableGtemp = nextAvailableGtemp;
    }
    visitRangeForStmt(stmt) {
        if (stmt.isParallelFor) {
            this.inParallelLoop = true;
        }
        super.visitRangeForStmt(stmt);
        if (stmt.isParallelFor) {
            this.inParallelLoop = false;
        }
    }
    visitVertexForStmt(stmt) {
        this.inParallelLoop = true;
        super.visitVertexForStmt(stmt);
        this.inParallelLoop = false;
    }
    visitFragmentForStmt(stmt) {
        this.inParallelLoop = true;
        super.visitFragmentForStmt(stmt);
        this.inParallelLoop = false;
    }
    visit(stmt) {
        if (!this.inParallelLoop && !isPointerStmt(stmt) && stmt.returnType !== undefined) {
            this.serialValues.add(stmt);
        }
        if (this.inParallelLoop) {
            for (let op of stmt.operands) {
                if (this.serialValues.has(op) && !this.gtempsAllocation.has(op)) {
                    let offset = this.gtempsAllocation.size + this.nextAvailableGtemp;
                    this.gtempsAllocation.set(op, offset);
                }
            }
        }
        super.visit(stmt);
    }
}
class ReplaceValuesUsedInParallelForsPass extends IRTransformer {
    gtempsAllocation;
    inParallelLoop = false;
    constructor(gtempsAllocation) {
        super();
        this.gtempsAllocation = gtempsAllocation;
    }
    visitRangeForStmt(stmt) {
        if (stmt.isParallelFor) {
            this.inParallelLoop = true;
        }
        super.visitRangeForStmt(stmt);
        if (stmt.isParallelFor) {
            this.inParallelLoop = false;
        }
    }
    visitVertexForStmt(stmt) {
        this.inParallelLoop = true;
        super.visitVertexForStmt(stmt);
        this.inParallelLoop = false;
    }
    visitFragmentForStmt(stmt) {
        this.inParallelLoop = true;
        super.visitFragmentForStmt(stmt);
        this.inParallelLoop = false;
    }
    visit(stmt) {
        if (this.inParallelLoop) {
            for (let i = 0; i < stmt.operands.length; ++i) {
                if (this.gtempsAllocation.has(stmt.operands[i])) {
                    let offset = this.gtempsAllocation.get(stmt.operands[i]);
                    let gtemp = new GlobalTemporaryStmt(stmt.operands[i].getReturnType(), offset, this.module.getNewId());
                    this.pushNewStmt(gtemp);
                    let gtempLoad = new GlobalTemporaryLoadStmt(gtemp, this.module.getNewId());
                    this.pushNewStmt(gtempLoad);
                    stmt.operands[i] = gtempLoad;
                }
            }
        }
        super.visit(stmt);
        if (!this.inParallelLoop && this.gtempsAllocation.has(stmt)) {
            let offset = this.gtempsAllocation.get(stmt);
            let gtemp = new GlobalTemporaryStmt(stmt.getReturnType(), offset, this.module.getNewId());
            this.pushNewStmt(gtemp);
            let gtempStore = new GlobalTemporaryStoreStmt(gtemp, stmt, this.module.getNewId());
            this.pushNewStmt(gtempStore);
        }
    }
}
class LoopRangeGtempPass extends IRTransformer {
    nextGtempSlot;
    constructor(nextGtempSlot) {
        super();
        this.nextGtempSlot = nextGtempSlot;
    }
    visitRangeForStmt(stmt) {
        if (stmt.isParallelFor) {
            let range = stmt.getRange();
            if (range.returnType !== PrimitiveType.i32) {
                error("Internal Error: The range of a range-for must be an i32");
            }
            if (range.getKind() !== StmtKind.ConstStmt && range.getKind() !== StmtKind.GlobalTemporaryLoadStmt) {
                let slot = this.nextGtempSlot++;
                let gtemp = new GlobalTemporaryStmt(PrimitiveType.i32, slot, this.module.getNewId());
                let gtempStore = new GlobalTemporaryStoreStmt(gtemp, range, this.module.getNewId());
                let gtempLoad = new GlobalTemporaryLoadStmt(gtemp, this.module.getNewId());
                this.pushNewStmt(gtemp);
                this.pushNewStmt(gtempStore);
                this.pushNewStmt(gtempLoad);
                stmt.setRange(gtempLoad);
            }
        }
        super.visitRangeForStmt(stmt);
    }
    visitVertexForStmt(stmt) {
        if (stmt.isParallelFor) {
            let range = stmt.getRange();
            if (range.returnType !== PrimitiveType.i32) {
                error("Internal Error: The range of a range-for must be an i32");
            }
            if (range.getKind() !== StmtKind.ConstStmt && range.getKind() !== StmtKind.GlobalTemporaryLoadStmt) {
                let slot = this.nextGtempSlot++;
                let gtemp = new GlobalTemporaryStmt(PrimitiveType.i32, slot, this.module.getNewId());
                let gtempStore = new GlobalTemporaryStoreStmt(gtemp, range, this.module.getNewId());
                let gtempLoad = new GlobalTemporaryLoadStmt(gtemp, this.module.getNewId());
                this.pushNewStmt(gtemp);
                this.pushNewStmt(gtempStore);
                this.pushNewStmt(gtempLoad);
                stmt.setRange(gtempLoad);
            }
        }
        super.visitRangeForStmt(stmt);
    }
}
export function insertGlobalTemporaries(module) {
    let nextAvailableGtemp = 0;
    let identifyAllocasUsedInParallelFors = new IdentifyAllocasUsedInParallelForsPass(nextAvailableGtemp);
    identifyAllocasUsedInParallelFors.visitModule(module);
    let allocations = identifyAllocasUsedInParallelFors.gtempsAllocation;
    new ReplaceAllocasUsedInParallelForsPass(allocations).transform(module);
    nextAvailableGtemp += allocations.size;
    let identifyValuesUsedInParallelFors = new IdentifyValuesUsedInParallelForsPass(nextAvailableGtemp);
    identifyValuesUsedInParallelFors.visitModule(module);
    allocations = identifyValuesUsedInParallelFors.gtempsAllocation;
    new ReplaceValuesUsedInParallelForsPass(allocations).transform(module);
    nextAvailableGtemp += allocations.size;
    let loopRange = new LoopRangeGtempPass(nextAvailableGtemp);
    loopRange.transform(module);
}
