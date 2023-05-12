import { Transform } from "./Transform";
import { struct } from "../api/Types";

export class SceneNode {
  constructor() {}
  parent: number = -1;
  children: number[] = [];
  localTransform: Transform = new Transform();
  globalTransform: Transform = new Transform();
  mesh: number = -1;
  static getKernelType() {
    return struct({
      globalTransform: Transform.getKernelType()
    });
  }
}
