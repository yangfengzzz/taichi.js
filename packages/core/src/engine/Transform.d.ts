export declare class Transform {
    constructor(matrix?: number[][]);
    reset(): void;
    matrix: number[][];
    mul(other: Transform): Transform;
    static getKernelType(): import("../language/frontend/Type").StructType;
}
