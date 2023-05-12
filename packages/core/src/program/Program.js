import { Runtime } from "../runtime/Runtime";
import { SNodeTree } from "../data/SNodeTree";
import { Scope } from "../language/frontend/Scope";
class Program {
    options = {
        printIR: false,
        printWGSL: false
    };
    async init(options) {
        if (options && options.printIR !== undefined) {
            this.options.printIR = options.printIR;
        }
        if (options && options.printWGSL !== undefined) {
            this.options.printWGSL = options.printWGSL;
        }
        await this.materializeRuntime();
    }
    runtime = null;
    partialTree;
    kernelScope;
    static instance;
    constructor() {
        this.partialTree = new SNodeTree();
        this.partialTree.treeId = 0;
        this.kernelScope = new Scope();
    }
    static getCurrentProgram() {
        if (!Program.instance) {
            Program.instance = new Program();
        }
        return Program.instance;
    }
    async materializeRuntime() {
        if (!this.runtime) {
            this.runtime = new Runtime();
            await this.runtime.init();
        }
    }
    materializeCurrentTree() {
        if (this.partialTree.size === 0) {
            return;
        }
        if (this.runtime == null) {
            this.materializeRuntime();
        }
        this.runtime.materializeTree(this.partialTree);
        let nextId = this.partialTree.treeId + 1;
        this.partialTree = new SNodeTree();
        this.partialTree.treeId = nextId;
    }
    addTexture(texture) {
        let id = this.runtime.textures.length;
        texture.textureId = id;
        this.runtime.addTexture(texture);
    }
    addToKernelScope(obj) {
        for (let name in obj) {
            this.kernelScope.addStored(name, obj[name]);
        }
    }
    clearKernelScope() {
        this.kernelScope = new Scope();
    }
    nextAnonymousKernel = 0;
    getAnonymousKernelName() {
        return "anonymous_" + (this.nextAnonymousKernel++).toString();
    }
    nextFunction = 0;
    getNextFunctionID() {
        return "anonymous_" + (this.nextAnonymousKernel++).toString();
    }
}
export { Program };
