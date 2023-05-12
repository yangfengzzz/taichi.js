import { struct, vector } from "../../api/Types";
import { f32, i32 } from "../../api/Kernels";
export var LightType;
(function (LightType) {
    LightType[LightType["Point"] = 1] = "Point";
    LightType[LightType["Spot"] = 2] = "Spot";
    LightType[LightType["Directional"] = 3] = "Directional";
})(LightType || (LightType = {}));
export class LightInfo {
    type;
    brightness;
    color;
    influenceRadius;
    position;
    direction;
    innerConeAngle;
    outerConeAngle;
    castsShadow;
    shadow;
    constructor(type, brightness, color, influenceRadius, position = [0.0, 0.0, 0.0], // point and spot
    direction = [0.0, 0.0, 0.0], // spot and dir
    innerConeAngle = 0, outerConeAngle = Math.PI / 4, castsShadow = false, shadow = undefined) {
        this.type = type;
        this.brightness = brightness;
        this.color = color;
        this.influenceRadius = influenceRadius;
        this.position = position;
        this.direction = direction;
        this.innerConeAngle = innerConeAngle;
        this.outerConeAngle = outerConeAngle;
        this.castsShadow = castsShadow;
        this.shadow = shadow;
    }
    static getKernelType() {
        return struct({
            type: i32,
            brightness: f32,
            color: vector(f32, 3),
            influenceRadius: f32,
            position: vector(f32, 3),
            direction: vector(f32, 3),
            innerConeAngle: f32,
            outerConeAngle: f32,
            castsShadow: i32
        });
    }
}
export class PointLightInfo extends LightInfo {
    constructor(brightness, color, influenceRadius, position, castsShadow = false, shadow = undefined) {
        super(LightType.Point, brightness, color, influenceRadius, position, [0.0, 0.0, 0.0], 0.0, 0.0, castsShadow, shadow);
    }
}
export class SpotLightInfo extends LightInfo {
    innerConeAngle;
    outerConeAngle;
    constructor(brightness, color, influenceRadius, position, direction, // spot and dir
    innerConeAngle = 0, outerConeAngle = Math.PI / 4, castsShadow = false, shadow = undefined) {
        super(LightType.Spot, brightness, color, influenceRadius, position, direction, innerConeAngle, outerConeAngle, castsShadow, shadow);
        this.innerConeAngle = innerConeAngle;
        this.outerConeAngle = outerConeAngle;
    }
}
export class DirectionalLightInfo extends LightInfo {
    constructor(brightness, color, direction, // spot and dir
    castsShadow = false, shadowStartingPosition = [0.0, 0.0, 0.0], shadow = undefined) {
        super(LightType.Directional, brightness, color, 0.0, shadowStartingPosition, direction, 0.0, 0.0, castsShadow, shadow);
    }
}
