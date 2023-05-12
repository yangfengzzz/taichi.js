import { Transform } from "./Transform";
import { struct } from "../api/Types";
export class SceneNode {
    constructor() { }
    parent = -1;
    children = [];
    localTransform = new Transform();
    globalTransform = new Transform();
    mesh = -1;
    static getKernelType() {
        return struct({
            globalTransform: Transform.getKernelType()
        });
    }
}
