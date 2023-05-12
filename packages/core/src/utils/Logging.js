export function log(...args) {
    console.log(...args);
}
export function error(...args) {
    console.error("FATAL ERROR: ", ...args);
    throw "Taichi JS ERROR ";
}
export function assert(val, ...args) {
    if (!val) {
        error("Assertion failed", args);
    }
}
