import * as ts from "typescript";
import { InMemoryHost } from "./InMemoryHost";
import { error } from "../../utils/Logging";
// A parsed JS function.
// The optional argument `parent` is a parent JS function whose scope this function resides in
export class ParsedFunction {
    static makeFromCode(code) {
        let parsedFunction = new ParsedFunction();
        let host = new InMemoryHost();
        let tempFileName = "temp.ts";
        host.writeFile(tempFileName, code);
        let tsOptions = {
            allowNonTsExtensions: true,
            target: ts.ScriptTarget.Latest,
            allowJs: true,
            strict: false,
            noImplicitUseStrict: true,
            alwaysStrict: false,
            strictFunctionTypes: false,
            checkJs: true
        };
        parsedFunction.tsProgram = ts.createProgram([tempFileName], tsOptions, host);
        parsedFunction.errorTsDiagnostics(parsedFunction.tsProgram.getSyntacticDiagnostics());
        parsedFunction.typeChecker = parsedFunction.tsProgram.getTypeChecker();
        let sourceFiles = parsedFunction.tsProgram.getSourceFiles();
        parsedFunction.assertNode(sourceFiles[0], sourceFiles.length === 1, "Expecting exactly 1 source file, got ", sourceFiles.length);
        let sourceFile = sourceFiles[0];
        let statements = sourceFile.statements;
        parsedFunction.assertNode(sourceFiles[0], statements.length === 1, "Expecting exactly 1 statement in ti.kernel (A single function or arrow function)");
        parsedFunction.registerFunctionNode(statements[0]);
        return parsedFunction;
    }
    // used for functions embedded in another parsed function
    static makeFromParsedNode(node, parentFunction) {
        let parsedFunction = new ParsedFunction();
        parentFunction.parent = parentFunction;
        parsedFunction.typeChecker = parentFunction.typeChecker;
        parsedFunction.tsProgram = parentFunction.tsProgram;
        parsedFunction.registerFunctionNode(node);
        return parsedFunction;
    }
    typeChecker = null;
    tsProgram = null;
    functionNode = null;
    parent = null;
    argNames = [];
    argNodes = [];
    registerFunctionNode(node) {
        if (node.kind === ts.SyntaxKind.FunctionDeclaration) {
            let funcDecl = node;
            if (funcDecl.name && funcDecl.name.getText().indexOf("$") !== -1) {
                this.errorNode(node, "function name cannot have $ in it");
            }
            this.functionNode = node;
            this.registerArguments(node.parameters);
        }
        else if (node.kind === ts.SyntaxKind.ExpressionStatement &&
            node.expression.kind === ts.SyntaxKind.ArrowFunction) {
            let func = node.expression;
            this.functionNode = func;
            this.registerArguments(func.parameters);
        }
        else if (node.kind === ts.SyntaxKind.ArrowFunction) {
            this.functionNode = node;
            this.registerArguments(node.parameters);
        }
        else {
            this.errorNode(node, "Expecting a function or an arrow function in kernel/function");
        }
    }
    registerArguments(args) {
        for (let a of args) {
            this.argNames.push(a.name.getText());
            this.argNodes.push(a);
        }
    }
    hasNodeSymbol(node) {
        return this.typeChecker.getSymbolAtLocation(node) !== undefined;
    }
    getNodeSymbol(node) {
        this.assertNode(node, this.hasNodeSymbol(node), "symbol not found for " + node.getText());
        return this.typeChecker.getSymbolAtLocation(node);
    }
    getSourceCodeAt(startPos, endPos) {
        let sourceFile = this.tsProgram.getSourceFiles()[0];
        let startLine = sourceFile.getLineAndCharacterOfPosition(startPos).line;
        let endLine = sourceFile.getLineAndCharacterOfPosition(endPos).line;
        let start = sourceFile.getLineStarts()[startLine];
        let end = sourceFile.getLineStarts()[endLine + 1];
        let code = sourceFile.getText().slice(start, end);
        return code;
    }
    errorTsDiagnostics(diags) {
        let message = "";
        for (let diag of diags) {
            if (diag.category === ts.DiagnosticCategory.Error) {
                let startPos = diag.start;
                let endPos = diag.start + diag.length;
                let code = this.getSourceCodeAt(startPos, endPos);
                message += `
                Syntax Error: ${diag.messageText}   
                at:  
                ${code}
                `;
            }
        }
        if (message !== "") {
            error("Kernel/function code cannot be parsed as Javascript: \n" + message);
        }
    }
    getNodeSourceCode(node) {
        let startPos = node.getStart();
        let endPos = node.getEnd();
        let code = this.getSourceCodeAt(startPos, endPos);
        return code;
    }
    errorNode(node, ...args) {
        let code = this.getNodeSourceCode(node);
        let errorMessage = "Error: ";
        for (let a of args) {
            errorMessage += String(a);
        }
        errorMessage += `\nat:\n ${code} `;
        error(errorMessage);
    }
    assertNode(node, condition, ...args) {
        if (!condition) {
            this.errorNode(node, ...args);
        }
    }
}
