import { PrimitiveType, StructType, VoidType } from "../language/frontend/Type";
import { CanvasTexture, Texture } from "../data/Texture";
import { error } from "../utils/Logging";
var ResourceType;
(function (ResourceType) {
    ResourceType[ResourceType["Root"] = 0] = "Root";
    ResourceType[ResourceType["RootAtomic"] = 1] = "RootAtomic";
    ResourceType[ResourceType["GlobalTmps"] = 2] = "GlobalTmps";
    ResourceType[ResourceType["GlobalTmpsAtomic"] = 3] = "GlobalTmpsAtomic";
    ResourceType[ResourceType["Args"] = 4] = "Args";
    ResourceType[ResourceType["RandStates"] = 5] = "RandStates";
    ResourceType[ResourceType["Rets"] = 6] = "Rets";
    ResourceType[ResourceType["Texture"] = 7] = "Texture";
    ResourceType[ResourceType["Sampler"] = 8] = "Sampler";
    ResourceType[ResourceType["StorageTexture"] = 9] = "StorageTexture";
})(ResourceType || (ResourceType = {}));
class ResourceInfo {
    resourceType;
    resourceID;
    constructor(resourceType, resourceID) {
        this.resourceType = resourceType;
        this.resourceID = resourceID;
    }
    equals(that) {
        return this.resourceID === that.resourceID && this.resourceType === that.resourceType;
    }
}
class ResourceBinding {
    info;
    binding;
    constructor(info, binding) {
        this.info = info;
        this.binding = binding;
    }
    equals(that) {
        return this.info.equals(that.info) && this.binding === that.binding;
    }
}
// compute shader
class TaskParams {
    code;
    workgroupSize;
    numWorkgroups;
    bindings;
    constructor(code, workgroupSize, numWorkgroups, bindings = []) {
        this.code = code;
        this.workgroupSize = workgroupSize;
        this.numWorkgroups = numWorkgroups;
        this.bindings = bindings;
    }
}
class VertexShaderParams {
    code;
    bindings;
    constructor(code = "", bindings = []) {
        this.code = code;
        this.bindings = bindings;
    }
}
class FragmentShaderParams {
    code;
    bindings;
    constructor(code = "", bindings = []) {
        this.code = code;
        this.bindings = bindings;
    }
}
class RenderPipelineParams {
    vertex;
    fragment;
    interpolatedType;
    vertexBuffer;
    indexBuffer;
    indirectBuffer;
    constructor(vertex, fragment, interpolatedType = new StructType({}), vertexBuffer = null, indexBuffer = null, indirectBuffer = null) {
        this.vertex = vertex;
        this.fragment = fragment;
        this.interpolatedType = interpolatedType;
        this.vertexBuffer = vertexBuffer;
        this.indexBuffer = indexBuffer;
        this.indirectBuffer = indirectBuffer;
        this.bindings = this.getBindings();
    }
    bindings;
    indirectCount = 1;
    getBindings() {
        let bindings = [];
        let candidates = this.vertex.bindings.concat(this.fragment.bindings);
        for (let c of candidates) {
            let found = false;
            for (let b of bindings) {
                if (c.equals(b)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                bindings.push(c);
            }
        }
        return bindings;
    }
}
class KernelParams {
    tasksParams;
    argTypes;
    returnType;
    renderPassParams;
    constructor(tasksParams, argTypes, returnType, renderPassParams = null) {
        this.tasksParams = tasksParams;
        this.argTypes = argTypes;
        this.returnType = returnType;
        this.renderPassParams = renderPassParams;
    }
}
class CompiledTask {
    params;
    pipeline = null;
    bindGroup = null;
    constructor(params, runtime) {
        this.params = params;
        this.createPipeline(runtime);
    }
    createPipeline(runtime) {
        let code = this.params.code;
        this.pipeline = runtime.getGPUComputePipeline({
            compute: {
                module: runtime.getGPUShaderModule(code),
                entryPoint: "main"
            },
            layout: "auto"
        });
    }
}
class CompiledRenderPipeline {
    params;
    pipeline = null;
    bindGroup = null;
    constructor(params, renderPassParams, runtime) {
        this.params = params;
        this.createPipeline(runtime, renderPassParams);
    }
    getGPUVertexBufferStates() {
        let attrs = [];
        let vertexInputType = this.params.vertexBuffer.elementType;
        let prims = vertexInputType.getPrimitivesList();
        let getPrimFormat = (prim) => {
            if (prim === PrimitiveType.f32) {
                return "float32";
            }
            else if (prim === PrimitiveType.i32) {
                return "sint32";
            }
            else {
                error("unrecongnized prim");
                return "float32";
            }
        };
        for (let i = 0; i < prims.length; ++i) {
            attrs.push({
                shaderLocation: i,
                format: getPrimFormat(prims[i]),
                offset: i * 4
            });
        }
        return {
            arrayStride: prims.length * 4,
            attributes: attrs
        };
    }
    getGPUColorTargetStates(renderPassParams) {
        let result = [];
        for (let tex of renderPassParams.colorAttachments) {
            result.push({
                format: tex.texture.getGPUTextureFormat()
            });
        }
        return result;
    }
    getVertexCount() {
        if (this.params.indexBuffer) {
            return this.params.indexBuffer.dimensions[0];
        }
        else {
            return this.params.vertexBuffer.dimensions[0];
        }
    }
    createPipeline(runtime, renderPassParams) {
        let sampleCount = 1;
        if (renderPassParams.colorAttachments.length > 0) {
            sampleCount = renderPassParams.colorAttachments[0].texture.sampleCount;
        }
        else if (renderPassParams.depthAttachment !== null) {
            sampleCount = renderPassParams.depthAttachment.texture.sampleCount;
        }
        for (let attachment of renderPassParams.colorAttachments) {
            if (attachment.texture.sampleCount != sampleCount) {
                error("all render target attachments (color or depth) must have the same sample count");
            }
        }
        if (renderPassParams.depthAttachment !== null &&
            renderPassParams.depthAttachment.texture.sampleCount !== sampleCount) {
            error("all render target attachments (color or depth) must have the same sample count");
        }
        let desc = {
            vertex: {
                module: runtime.getGPUShaderModule(this.params.vertex.code),
                entryPoint: "main",
                buffers: [this.getGPUVertexBufferStates()]
            },
            fragment: {
                module: runtime.getGPUShaderModule(this.params.fragment.code),
                entryPoint: "main",
                targets: this.getGPUColorTargetStates(renderPassParams)
            },
            primitive: {
                topology: "triangle-list",
                cullMode: "none"
            },
            multisample: {
                count: sampleCount
            },
            layout: "auto"
        };
        if (renderPassParams.depthAttachment !== null) {
            let depthWrite = true;
            if (renderPassParams.depthAttachment.storeDepth === false) {
                depthWrite = false;
            }
            desc.depthStencil = {
                depthWriteEnabled: depthWrite,
                depthCompare: "less-equal",
                format: renderPassParams.depthAttachment.texture.getGPUTextureFormat()
            };
        }
        this.pipeline = runtime.getGPURenderPipeline(desc);
    }
}
class CompiledRenderPassInfo {
    params;
    constructor(params) {
        this.params = params;
    }
    getGPURenderPassDescriptor() {
        let colorAttachments = [];
        for (let attach of this.params.colorAttachments) {
            let view = attach.texture.getGPUTextureView();
            let resolveTarget = undefined;
            if (attach.texture.sampleCount > 1) {
                if (attach.texture instanceof CanvasTexture || attach.texture instanceof Texture) {
                    view = attach.texture.multiSampledRenderTexture.createView();
                    resolveTarget = attach.texture.getGPUTextureView();
                }
            }
            if (attach.clearColor === undefined) {
                colorAttachments.push({
                    view,
                    resolveTarget,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: "load",
                    storeOp: "store"
                });
            }
            else {
                let clearValue = {
                    r: attach.clearColor[0],
                    g: attach.clearColor[1],
                    b: attach.clearColor[2],
                    a: attach.clearColor[3]
                };
                colorAttachments.push({
                    view,
                    resolveTarget,
                    clearValue: clearValue,
                    loadOp: "clear",
                    storeOp: "store"
                });
            }
        }
        let depth = this.params.depthAttachment;
        if (depth === null) {
            return {
                colorAttachments
            };
        }
        let depthStencilAttachment = {
            view: depth.texture.getGPUTextureView(),
            depthClearValue: depth.clearDepth,
            depthLoadOp: depth.clearDepth === undefined ? "load" : "clear",
            depthStoreOp: depth.storeDepth === true ? "store" : "discard"
        };
        return {
            colorAttachments,
            depthStencilAttachment
        };
    }
}
class CompiledKernel {
    tasks;
    argTypes;
    returnType;
    renderPassInfo;
    constructor(tasks = [], argTypes = [], returnType = new VoidType(), renderPassInfo = null) {
        this.tasks = tasks;
        this.argTypes = argTypes;
        this.returnType = returnType;
        this.renderPassInfo = renderPassInfo;
    }
}
export { CompiledTask, CompiledKernel, TaskParams, ResourceType, ResourceInfo, ResourceBinding, KernelParams, VertexShaderParams, FragmentShaderParams, RenderPipelineParams, CompiledRenderPipeline, CompiledRenderPassInfo };
