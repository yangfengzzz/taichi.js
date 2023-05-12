import { Program } from "../../program/Program";
import { assert, error } from "../../utils/Logging";
import { KernelCompiler } from "./Compiler";
import { ParsedFunction } from "./ParsedFunction";
import { PrimitiveType, ScalarType, Type } from "./Type";
// Similar to Python Taichi, Template is a dummy class whose sole purpose is for marking template arguments with ti.template()
export class Template {
}
export class TemplateKernel {
    instances = [];
    findInstance(templateArgs) {
        for (let instance of this.instances) {
            let match = true;
            let instanceArgs = instance[0];
            for (let name of instanceArgs.keys()) {
                if (!templateArgs.has(name) || templateArgs.get(name) !== instanceArgs.get(name)) {
                    match = false;
                }
            }
            if (match) {
                return instance[1];
            }
        }
        return null;
    }
}
export class KernelFactory {
    static templateKernelCache = new Map();
    static kernel(scope, argTypes, code) {
        let argsMapObj = {};
        code = code.toString();
        if (argTypes) {
            argsMapObj = argTypes;
        }
        let argTypesMap = new Map();
        let templateArgNamesSet = new Set();
        for (let k in argsMapObj) {
            let type = argsMapObj[k];
            if (type === PrimitiveType.f32 || type === PrimitiveType.i32) {
                type = new ScalarType(type);
                argTypesMap.set(k, type);
            }
            else if (type instanceof Type) {
                argTypesMap.set(k, type);
            }
            else if (type instanceof Template) {
                templateArgNamesSet.add(k);
            }
            else {
                error("Invalid argument type annotations");
            }
        }
        let codeString = code.toString();
        let program = Program.getCurrentProgram();
        let parsedFunction = ParsedFunction.makeFromCode(codeString);
        let argNames = parsedFunction.argNames;
        if (!KernelFactory.templateKernelCache.has(codeString)) {
            KernelFactory.templateKernelCache.set(codeString, new TemplateKernel());
        }
        let template = KernelFactory.templateKernelCache.get(codeString);
        if (templateArgNamesSet.size === 0) {
            program.materializeCurrentTree();
            let compiler = new KernelCompiler();
            let kernelParams = compiler.compileKernel(parsedFunction, scope, argTypesMap);
            let kernel = program.runtime.createKernel(kernelParams);
            let result = async (...args) => {
                return await program.runtime.launchKernel(kernel, ...args);
            };
            return result;
        }
        else {
            let result = async (...args) => {
                assert(args.length === argNames.length, `Kernel requires ${argNames.length} arguments, but ${args.length} is provided`);
                let templateArgs = new Map();
                let nonTemplateArgs = [];
                for (let i = 0; i < args.length; ++i) {
                    let name = argNames[i];
                    let val = args[i];
                    if (templateArgNamesSet.has(name)) {
                        templateArgs.set(name, val);
                    }
                    else {
                        nonTemplateArgs.push(val);
                    }
                }
                let existingInstance = template.findInstance(templateArgs);
                if (existingInstance !== null) {
                    return await program.runtime.launchKernel(existingInstance, ...nonTemplateArgs);
                }
                program.materializeCurrentTree();
                let compiler = new KernelCompiler();
                let kernelParams = compiler.compileKernel(parsedFunction, scope, argTypesMap, templateArgs);
                let kernel = program.runtime.createKernel(kernelParams);
                template.instances.push([templateArgs, kernel]);
                return await program.runtime.launchKernel(kernel, ...nonTemplateArgs);
            };
            return result;
        }
    }
}
