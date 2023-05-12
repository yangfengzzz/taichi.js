import * as ts from "typescript";
import { assert } from "../../../utils/Logging";
class ASTVisitor {
    extractVisitorResult(result) {
        assert(result !== undefined, "Result is undefined");
        return result;
    }
    dispatchVisit(node) {
        switch (node.kind) {
            case ts.SyntaxKind.VariableDeclaration:
                return this.visitVariableDeclaration(node);
            case ts.SyntaxKind.VariableDeclarationList:
                return this.visitVariableDeclarationList(node);
            case ts.SyntaxKind.FunctionDeclaration:
                return this.visitFunctionDeclaration(node);
            case ts.SyntaxKind.ArrowFunction:
                return this.visitArrowFunction(node);
            case ts.SyntaxKind.VariableStatement:
                return this.visitVariableStatement(node);
            case ts.SyntaxKind.Identifier:
                return this.visitIdentifier(node);
            case ts.SyntaxKind.ForOfStatement:
                return this.visitForOfStatement(node);
            case ts.SyntaxKind.ForStatement:
                return this.visitForOfStatement(node);
            case ts.SyntaxKind.ForInStatement:
                return this.visitForInStatement(node);
            case ts.SyntaxKind.IfStatement:
                return this.visitIfStatement(node);
            case ts.SyntaxKind.WhileStatement:
                return this.visitWhileStatement(node);
            case ts.SyntaxKind.BreakStatement:
                return this.visitBreakStatement(node);
            case ts.SyntaxKind.ContinueStatement:
                return this.visitContinueStatement(node);
            case ts.SyntaxKind.ReturnStatement:
                return this.visitReturnStatement(node);
            case ts.SyntaxKind.Block:
                return this.visitBlock(node);
            case ts.SyntaxKind.NumericLiteral:
                return this.visitNumericLiteral(node);
            case ts.SyntaxKind.ExpressionStatement:
                return this.visitExpressionStatement(node);
            case ts.SyntaxKind.BinaryExpression:
                return this.visitBinaryExpression(node);
            case ts.SyntaxKind.PrefixUnaryExpression:
                return this.visitPrefixUnaryExpression(node);
            case ts.SyntaxKind.CallExpression:
                return this.visitCallExpression(node);
            case ts.SyntaxKind.PropertyAccessExpression:
                return this.visitPropertyAccessExpression(node);
            case ts.SyntaxKind.ElementAccessExpression:
                return this.visitElementAccessExpression(node);
            case ts.SyntaxKind.ParenthesizedExpression:
                return this.visitParenthesizedExpression(node);
            case ts.SyntaxKind.ArrayLiteralExpression:
                return this.visitArrayLiteralExpression(node);
            case ts.SyntaxKind.ObjectLiteralExpression:
                return this.visitObjectLiteralExpression(node);
            case ts.SyntaxKind.NonNullExpression:
                return this.visitNonNullExpression(node);
            case ts.SyntaxKind.AsExpression:
                return this.visitAsExpression(node);
            case ts.SyntaxKind.ThisKeyword:
                return this.visitThisKeyword();
            case ts.SyntaxKind.TrueKeyword:
                return this.visitTrueKeyword();
            case ts.SyntaxKind.FalseKeyword:
                return this.visitFalseKeyword();
            default:
                return this.visitUnknown(node);
        }
    }
    visitEachChild(node, combiner = null) {
        let results = [];
        node.forEachChild((node) => {
            let thisResult = this.dispatchVisit(node);
            results.push(thisResult);
        });
        if (combiner) {
            return combiner(results);
        }
    }
    visitUnknown(node) {
        return this.visitEachChild(node);
    }
    visitNumericLiteral(node) {
        return this.visitEachChild(node);
    }
    visitIdentifier(node) {
        return this.visitEachChild(node);
    }
    visitVariableDeclaration(node) {
        return this.visitEachChild(node);
    }
    visitVariableStatement(node) {
        return this.visitEachChild(node);
    }
    visitFunctionDeclaration(node) {
        return this.visitEachChild(node);
    }
    visitArrowFunction(node) {
        return this.visitEachChild(node);
    }
    visitVariableDeclarationList(node) {
        return this.visitEachChild(node);
    }
    visitForOfStatement(node) {
        return this.visitEachChild(node);
    }
    visitForInStatement(node) {
        return this.visitEachChild(node);
    }
    visitForStatement(node) {
        return this.visitEachChild(node);
    }
    visitIfStatement(node) {
        return this.visitEachChild(node);
    }
    visitWhileStatement(node) {
        return this.visitEachChild(node);
    }
    visitBreakStatement(node) {
        return this.visitEachChild(node);
    }
    visitContinueStatement(node) {
        return this.visitEachChild(node);
    }
    visitReturnStatement(node) {
        return this.visitEachChild(node);
    }
    visitBlock(node) {
        return this.visitEachChild(node);
    }
    visitExpressionStatement(node) {
        return this.visitEachChild(node);
    }
    visitBinaryExpression(node) {
        return this.visitEachChild(node);
    }
    visitPrefixUnaryExpression(node) {
        return this.visitEachChild(node);
    }
    visitCallExpression(node) {
        return this.visitEachChild(node);
    }
    visitPropertyAccessExpression(node) {
        return this.visitEachChild(node);
    }
    visitElementAccessExpression(node) {
        return this.visitEachChild(node);
    }
    visitParenthesizedExpression(node) {
        return this.visitEachChild(node);
    }
    visitArrayLiteralExpression(node) {
        return this.visitEachChild(node);
    }
    visitObjectLiteralExpression(node) {
        return this.visitEachChild(node);
    }
    visitNonNullExpression(node) {
        return this.visitEachChild(node);
    }
    visitAsExpression(node) {
        return this.visitEachChild(node);
    }
    visitThisKeyword() {
    }
    visitTrueKeyword() {
    }
    visitFalseKeyword() {
    }
}
export { ASTVisitor };
