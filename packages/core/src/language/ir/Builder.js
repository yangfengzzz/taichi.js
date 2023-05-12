import { PrimitiveType } from "../frontend/Type";
import { AllocaStmt, ArgLoadStmt, AtomicLoadStmt, AtomicOpStmt, AtomicStoreStmt, BinaryOpStmt, Block, BuiltInInputKind, BuiltInInputStmt, BuiltInOutputKind, BuiltInOutputStmt, CompositeExtractStmt, ConstStmt, ContinueStmt, DiscardStmt, FragmentDerivativeDirection, FragmentDerivativeStmt, FragmentForStmt, FragmentInputStmt, GlobalLoadStmt, GlobalPtrStmt, GlobalStoreStmt, GlobalTemporaryLoadStmt, GlobalTemporaryStmt, GlobalTemporaryStoreStmt, IfStmt, IRModule, LocalLoadStmt, LocalStoreStmt, LoopIndexStmt, RandStmt, RangeForStmt, ReturnStmt, TextureFunctionKind, TextureFunctionStmt, UnaryOpStmt, VertexForStmt, VertexInputStmt, VertexOutputStmt, WhileControlStmt, WhileStmt } from "./Stmt";
// designed to have the same API as native taichi's IRBuilder
// which is why there're some camel_case and camelCase mash-ups
export class IRBuilder {
    constructor() { }
    module = new IRModule();
    guards = [new Guard(this, this.module.block)];
    get_int32(val) {
        return this.pushNewStmt(new ConstStmt(val, PrimitiveType.i32, this.getNewId()));
    }
    get_float32(val) {
        return this.pushNewStmt(new ConstStmt(val, PrimitiveType.f32, this.getNewId()));
    }
    create_range_for(range, shouldStrictlySerialize) {
        return this.pushNewStmt(new RangeForStmt(range, shouldStrictlySerialize, new Block(), this.getNewId()));
    }
    get_loop_index(loop) {
        return this.pushNewStmt(new LoopIndexStmt(loop, this.getNewId()));
    }
    create_global_ptr(field, indices, elementOffset) {
        return this.pushNewStmt(new GlobalPtrStmt(field, indices, elementOffset, this.getNewId()));
    }
    create_global_load(ptr) {
        return this.pushNewStmt(new GlobalLoadStmt(ptr, this.getNewId()));
    }
    create_global_store(ptr, val) {
        return this.pushNewStmt(new GlobalStoreStmt(ptr, val, this.getNewId()));
    }
    create_global_temporary(type, offset) {
        return this.pushNewStmt(new GlobalTemporaryStmt(type, offset, this.getNewId()));
    }
    create_global_temporary_load(ptr) {
        return this.pushNewStmt(new GlobalTemporaryLoadStmt(ptr, this.getNewId()));
    }
    create_global_temporary_store(ptr, val) {
        return this.pushNewStmt(new GlobalTemporaryStoreStmt(ptr, val, this.getNewId()));
    }
    create_local_var(type) {
        return this.pushNewStmt(new AllocaStmt(type, this.getNewId()));
    }
    create_local_load(ptr) {
        return this.pushNewStmt(new LocalLoadStmt(ptr, this.getNewId()));
    }
    create_local_store(ptr, val) {
        return this.pushNewStmt(new LocalStoreStmt(ptr, val, this.getNewId()));
    }
    create_binary_op(lhs, rhs, op) {
        return this.pushNewStmt(new BinaryOpStmt(lhs, rhs, op, this.getNewId()));
    }
    create_unary_op(operand, op) {
        return this.pushNewStmt(new UnaryOpStmt(operand, op, this.getNewId()));
    }
    create_atomic_op(dest, val, op) {
        return this.pushNewStmt(new AtomicOpStmt(dest, val, op, this.getNewId()));
    }
    create_atomic_load(ptr) {
        return this.pushNewStmt(new AtomicLoadStmt(ptr, this.getNewId()));
    }
    create_atomic_store(ptr, value) {
        return this.pushNewStmt(new AtomicStoreStmt(ptr, value, this.getNewId()));
    }
    create_while_true() {
        return this.pushNewStmt(new WhileStmt(new Block(), this.getNewId()));
    }
    create_if(cond) {
        return this.pushNewStmt(new IfStmt(cond, new Block(), new Block(), this.getNewId()));
    }
    create_break() {
        return this.pushNewStmt(new WhileControlStmt(this.getNewId()));
    }
    create_continue() {
        return this.pushNewStmt(new ContinueStmt(this.getNewId()));
    }
    create_arg_load(type, argId) {
        return this.pushNewStmt(new ArgLoadStmt(type, argId, this.getNewId()));
    }
    create_rand(type) {
        return this.pushNewStmt(new RandStmt(type, this.getNewId()));
    }
    create_return(val) {
        return this.pushNewStmt(new ReturnStmt([val], this.getNewId()));
    }
    create_return_vec(vals) {
        return this.pushNewStmt(new ReturnStmt(vals, this.getNewId()));
    }
    create_vertex_input(location, type) {
        return this.pushNewStmt(new VertexInputStmt(type, location, this.getNewId()));
    }
    create_vertex_output(location, val) {
        return this.pushNewStmt(new VertexOutputStmt(val, location, this.getNewId()));
    }
    create_position_output(vals) {
        return this.pushNewStmt(new BuiltInOutputStmt(vals, BuiltInOutputKind.Position, undefined, this.getNewId()));
    }
    create_fragment_input(location, type) {
        return this.pushNewStmt(new FragmentInputStmt(type, location, this.getNewId()));
    }
    create_color_output(location, vals) {
        return this.pushNewStmt(new BuiltInOutputStmt(vals, BuiltInOutputKind.Color, location, this.getNewId()));
    }
    create_vertex_for() {
        return this.pushNewStmt(new VertexForStmt(new Block(), this.getNewId()));
    }
    create_fragment_for() {
        return this.pushNewStmt(new FragmentForStmt(new Block(), this.getNewId()));
    }
    create_discard() {
        return this.pushNewStmt(new DiscardStmt(this.getNewId()));
    }
    create_depth_output(val) {
        return this.pushNewStmt(new BuiltInOutputStmt([val], BuiltInOutputKind.FragDepth, undefined, this.getNewId()));
    }
    create_texture_sample(texture, coords) {
        return this.pushNewStmt(new TextureFunctionStmt(texture, TextureFunctionKind.Sample, coords, [], this.getNewId()));
    }
    create_texture_sample_lod(texture, coords, lod) {
        return this.pushNewStmt(new TextureFunctionStmt(texture, TextureFunctionKind.SampleLod, coords, [lod], this.getNewId()));
    }
    create_texture_sample_compare(texture, coords, depthRef) {
        return this.pushNewStmt(new TextureFunctionStmt(texture, TextureFunctionKind.SampleCompare, coords, [depthRef], this.getNewId()));
    }
    create_texture_load(texture, coords) {
        return this.pushNewStmt(new TextureFunctionStmt(texture, TextureFunctionKind.Load, coords, [], this.getNewId()));
    }
    create_texture_store(texture, coords, vals) {
        return this.pushNewStmt(new TextureFunctionStmt(texture, TextureFunctionKind.Store, coords, vals, this.getNewId()));
    }
    create_composite_extract(composite, index) {
        return this.pushNewStmt(new CompositeExtractStmt(composite, index, this.getNewId()));
    }
    create_vertex_index_input() {
        return this.pushNewStmt(new BuiltInInputStmt(BuiltInInputKind.VertexIndex, this.getNewId()));
    }
    create_instance_index_input() {
        return this.pushNewStmt(new BuiltInInputStmt(BuiltInInputKind.InstanceIndex, this.getNewId()));
    }
    create_frag_coord_input() {
        return this.pushNewStmt(new BuiltInInputStmt(BuiltInInputKind.FragCoord, this.getNewId()));
    }
    create_dpdx(val) {
        return this.pushNewStmt(new FragmentDerivativeStmt(FragmentDerivativeDirection.x, val, this.getNewId()));
    }
    create_dpdy(val) {
        return this.pushNewStmt(new FragmentDerivativeStmt(FragmentDerivativeDirection.y, val, this.getNewId()));
    }
    get_range_loop_guard(loop) {
        return this.addGuard(loop.body);
    }
    get_while_loop_guard(loop) {
        return this.addGuard(loop.body);
    }
    get_vertex_loop_guard(loop) {
        return this.addGuard(loop.body);
    }
    get_fragment_loop_guard(loop) {
        return this.addGuard(loop.body);
    }
    get_if_guard(stmt, branch) {
        if (branch) {
            return this.addGuard(stmt.trueBranch);
        }
        else {
            return this.addGuard(stmt.falseBranch);
        }
    }
    getNewId() {
        return this.module.getNewId();
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
}
export class Guard {
    parent;
    block;
    constructor(parent, block) {
        this.parent = parent;
        this.block = block;
    }
    delete() {
        this.parent.guards.pop();
    }
}
