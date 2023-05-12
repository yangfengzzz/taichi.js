import { add, lookAt, matmul, ortho } from "../../api/KernelScopeBuiltin";

export class ShadowInfo {
  constructor(
    public physicalSize: number[],
    public maxDistance: number,
    public shadowMapResolution: number[] = [1024, 1024],
    public strength = 1.0
  ) {}
  view: number[][] = [];
  projection: number[][] = [];
  viewProjection: number[][] = [];

  static createIblShadowInfo(
    representativePosition: number[],
    representativeDirection: number[],
    physicalSize: number[],
    maxDistance: number,
    shadowMapResolution: number[] = [1024, 1024],
    strength = 1.0
  ) {
    let shadow = new ShadowInfo(physicalSize, maxDistance, shadowMapResolution, strength);
    shadow.view = lookAt(representativePosition, add(representativePosition, representativeDirection), [0.0, 1.0, 0.0]);
    let size = physicalSize;
    shadow.projection = ortho(-0.5 * size[0], 0.5 * size[0], -0.5 * size[1], 0.5 * size[0], 0.0, maxDistance);
    shadow.viewProjection = matmul(shadow.projection, shadow.view);
    return shadow;
  }
}
