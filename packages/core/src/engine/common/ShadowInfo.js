import { add, lookAt, matmul, ortho } from "../../api/KernelScopeBuiltin";
export class ShadowInfo {
    physicalSize;
    maxDistance;
    shadowMapResolution;
    strength;
    constructor(physicalSize, maxDistance, shadowMapResolution = [1024, 1024], strength = 1.0) {
        this.physicalSize = physicalSize;
        this.maxDistance = maxDistance;
        this.shadowMapResolution = shadowMapResolution;
        this.strength = strength;
    }
    view = [];
    projection = [];
    viewProjection = [];
    static createIblShadowInfo(representativePosition, representativeDirection, physicalSize, maxDistance, shadowMapResolution = [1024, 1024], strength = 1.0) {
        let shadow = new ShadowInfo(physicalSize, maxDistance, shadowMapResolution, strength);
        shadow.view = lookAt(representativePosition, add(representativePosition, representativeDirection), [0.0, 1.0, 0.0]);
        let size = physicalSize;
        shadow.projection = ortho(-0.5 * size[0], 0.5 * size[0], -0.5 * size[1], 0.5 * size[0], 0.0, maxDistance);
        shadow.viewProjection = matmul(shadow.projection, shadow.view);
        return shadow;
    }
}
