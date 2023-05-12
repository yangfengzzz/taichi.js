import { log } from "../../utils/Logging";
import * as ts from "typescript";
import { VirtualFileSystem } from "../../utils/VirtualFileSystem";
// reference: https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#customizing-module-resolution
/**
 * Implementation of CompilerHost that works with in-memory-only source files
 */
export class InMemoryHost {
    constructor() {
        this.fs = new VirtualFileSystem();
    }
    fs;
    getSourceFile(fileName, languageVersion, onError) {
        // log("getSourceFile ", fileName)
        let fileContent = null;
        if (this.fs.fileExists(fileName)) {
            fileContent = this.fs.readFile(fileName);
        }
        if (fileContent != null) {
            return ts.createSourceFile(fileName, this.fs.readFile(fileName), languageVersion);
        }
    }
    getDefaultLibFileName(options) {
        return "typescript.js";
    }
    writeFile(path, content) {
        this.fs.writeFile(path, content, true);
    }
    getCurrentDirectory() {
        const ret = ".";
        return ret;
    }
    getDirectories(path) {
        throw new Error("Method not implemented.");
    }
    getCanonicalFileName(fileName) {
        return fileName;
    }
    useCaseSensitiveFileNames() {
        return true;
    }
    getNewLine() {
        return "\n";
    }
    // public resolveModuleNames?(moduleNames: string[], containingFile: string): ts.ResolvedModule[] {
    // 	log(`resolveModuleNames(${moduleNames})`);
    // 	return moduleNames.map(moduleName => {
    // 		{ // try to use standard resolution
    // 			const result = ts.resolveModuleName(
    // 				moduleName, containingFile,
    // 				this.options,
    // 				{
    // 					fileExists: this.fileExists.bind(this),
    // 					readFile: this.readFile.bind(this),
    // 				},
    // 			);
    // 			if (result.resolvedModule) return result.resolvedModule;
    // 		}
    // 		try { // fall back to NodeJS resolution
    // 			const fileName = require.resolve(moduleName);
    // 			if (fileName === moduleName) return; // internal module
    // 			log(`resolved ${moduleName} => ${fileName}`);
    // 			return {
    // 				resolvedFileName: fileName,
    // 			} as ts.ResolvedModule;
    // 		} catch (e) {
    // 			/* Not found */
    // 		}
    // 	});
    // }
    fileExists(fileName) {
        log(`fileExists(${fileName})`);
        return this.fs.fileExists(fileName);
    }
    readFile(fileName) {
        log(`readFile(${fileName})`);
        return this.fs.readFile(fileName);
    }
}
