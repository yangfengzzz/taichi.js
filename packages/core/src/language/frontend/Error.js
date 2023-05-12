import { assert } from "../../utils/Logging";
class ResultOrError {
    isError;
    result;
    errorMessage;
    constructor(isError, result, errorMessage) {
        this.isError = isError;
        this.result = result;
        this.errorMessage = errorMessage;
        if (isError) {
            assert(result === null && errorMessage !== null);
        }
        else {
            assert(result !== null && errorMessage === null);
        }
    }
    static createResult(result) {
        return new ResultOrError(false, result, null);
    }
    static createError(msg) {
        return new ResultOrError(true, null, msg);
    }
}
export { ResultOrError };
