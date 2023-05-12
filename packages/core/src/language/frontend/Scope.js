class Scope {
    constructor() { }
    obj = {};
    thisObj = {};
    hasStored(name) {
        return name in this.obj;
    }
    getStored(name) {
        return this.obj[name];
    }
    addStored(name, val) {
        this.obj[name] = val;
    }
    clearStored() {
        this.obj = {};
        this.thisObj = {};
    }
    canEvaluate(str) {
        return this.tryEvaluate(str) !== undefined;
    }
    tryEvaluate(str) {
        // magic.
        // https://stackoverflow.com/questions/9781285/specify-scope-for-eval-in-javascript
        let scopedEval = (context, expr) => {
            const evaluator = Function.apply(this.thisObj, [
                ...Object.keys(context),
                "expr",
                "return eval('expr = undefined;' + expr)"
            ]);
            return evaluator.apply(this.thisObj, [...Object.values(context), expr]);
        };
        try {
            return scopedEval(this.obj, str);
        }
        catch (e) {
            return undefined;
        }
    }
    clone() {
        let newObj = {};
        for (let k in this.obj) {
            newObj[k] = this.obj[k];
        }
        let result = new Scope();
        result.obj = newObj;
        result.thisObj = this.thisObj;
        return result;
    }
}
export { Scope };
