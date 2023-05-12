import { IRTransformer } from "../Transformer";
class RemapIdsPass extends IRTransformer {
    transform(module) {
        super.transform(module);
        module.idBound = this.idBound;
    }
    pushNewStmt(stmt) {
        stmt.id = this.getNewId();
        return super.pushNewStmt(stmt);
    }
    idBound = 0;
    getNewId() {
        return this.idBound++;
    }
}
export function remapIds(module) {
    new RemapIdsPass().transform(module);
}
