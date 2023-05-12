import { error } from "../../utils/Logging";
import { IRModule, StmtKind } from "../ir/Stmt";
import { IRTransformer } from "../ir/Transformer";
import { IRVisitor } from "../ir/Visitor";
export var OffloadType;
(function (OffloadType) {
    OffloadType[OffloadType["Serial"] = 0] = "Serial";
    OffloadType[OffloadType["Compute"] = 1] = "Compute";
    OffloadType[OffloadType["Vertex"] = 2] = "Vertex";
    OffloadType[OffloadType["Fragment"] = 3] = "Fragment";
})(OffloadType || (OffloadType = {}));
export class OffloadedModule extends IRModule {
    type;
    constructor(type) {
        super();
        this.type = type;
    }
}
export class SerialModule extends OffloadedModule {
    constructor() {
        super(OffloadType.Serial);
    }
}
export class ComputeModule extends OffloadedModule {
    rangeArg;
    hasConstRange;
    constructor(rangeArg, hasConstRange) {
        super(OffloadType.Compute);
        this.rangeArg = rangeArg;
        this.hasConstRange = hasConstRange;
    }
}
export class VertexModule extends OffloadedModule {
    constructor() {
        super(OffloadType.Vertex);
    }
}
export class FragmentModule extends OffloadedModule {
    constructor() {
        super(OffloadType.Fragment);
    }
}
class OffloadingPass extends IRTransformer {
    offloadedModules = [];
    currentOffloadType = OffloadType.Serial;
    transform(module) {
        this.resetTransformerState(new SerialModule());
        for (let s of module.block.stmts) {
            this.visit(s);
        }
    }
    resetTransformerState(module) {
        this.guards = [];
        this.module = module;
        this.addGuard(module.block);
        this.offloadedModules.push(module);
        this.currentOffloadType = module.type;
    }
    visitRangeForStmt(stmt) {
        if (stmt.isParallelFor) {
            let rangeArg = 0;
            let isConst = false;
            let range = stmt.getRange();
            if (range.getKind() === StmtKind.ConstStmt) {
                isConst = true;
                rangeArg = range.val;
            }
            else if (range.getKind() === StmtKind.GlobalTemporaryLoadStmt) {
                isConst = false;
                rangeArg = range.getPointer().offset;
            }
            else {
                error("InternalError: range of be const or global temp load");
            }
            let module = new ComputeModule(rangeArg, isConst);
            this.resetTransformerState(module);
            for (let s of stmt.body.stmts) {
                this.visit(s);
            }
            this.resetTransformerState(new SerialModule());
        }
        else {
            super.visitRangeForStmt(stmt);
        }
    }
    visitVertexForStmt(stmt) {
        let module = new VertexModule();
        this.resetTransformerState(module);
        for (let s of stmt.body.stmts) {
            this.visit(s);
        }
        this.resetTransformerState(new SerialModule());
    }
    visitFragmentForStmt(stmt) {
        let module = new FragmentModule();
        this.resetTransformerState(module);
        for (let s of stmt.body.stmts) {
            this.visit(s);
        }
        this.resetTransformerState(new SerialModule());
    }
}
class IdentifyTrivialSerialModule extends IRVisitor {
    constructor() {
        super();
    }
    isTrivial = true;
    visitGlobalTemporaryStoreStmt(stmt) {
        this.isTrivial = false;
    }
    visitGlobalStoreStmt(stmt) {
        this.isTrivial = false;
    }
    visitAtomicOpStmt(stmt) {
        this.isTrivial = false;
    }
    visitAtomicStoreStmt(stmt) {
        this.isTrivial = false;
    }
    visitReturnStmt(stmt) {
        this.isTrivial = false;
    }
}
export function offload(module) {
    let pass = new OffloadingPass();
    pass.transform(module);
    let modules = pass.offloadedModules;
    let nonTrivialModules = [];
    for (let m of modules) {
        if (m.type !== OffloadType.Serial) {
            nonTrivialModules.push(m);
            continue;
        }
        let pass = new IdentifyTrivialSerialModule();
        pass.visitModule(m);
        if (!pass.isTrivial) {
            nonTrivialModules.push(m);
        }
    }
    return nonTrivialModules;
}
