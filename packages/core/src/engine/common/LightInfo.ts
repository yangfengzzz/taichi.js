import { ShadowInfo } from "./ShadowInfo";
import { struct, vector } from "../../api/Types";
import { f32, i32 } from "../../api/Kernels";

export enum LightType {
  Point = 1,
  Spot = 2,
  Directional = 3
}

export class LightInfo {
  constructor(
    public type: LightType,
    public brightness: number,
    public color: number[],
    public influenceRadius: number,
    public position: number[] = [0.0, 0.0, 0.0], // point and spot
    public direction: number[] = [0.0, 0.0, 0.0], // spot and dir
    public innerConeAngle: number = 0,
    public outerConeAngle: number = Math.PI / 4,
    public castsShadow: boolean = false,
    public shadow: ShadowInfo | undefined = undefined
  ) {}

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
  constructor(
    brightness: number,
    color: number[],
    influenceRadius: number,
    position: number[],
    castsShadow: boolean = false,
    shadow: ShadowInfo | undefined = undefined
  ) {
    super(
      LightType.Point,
      brightness,
      color,
      influenceRadius,
      position,
      [0.0, 0.0, 0.0],
      0.0,
      0.0,
      castsShadow,
      shadow
    );
  }
}
export class SpotLightInfo extends LightInfo {
  constructor(
    brightness: number,
    color: number[],
    influenceRadius: number,
    position: number[],
    direction: number[], // spot and dir
    castsShadow: boolean = false,
    shadow: ShadowInfo | undefined = undefined
  ) {
    super(LightType.Spot, brightness, color, influenceRadius, position, direction, 0, Math.PI / 4, castsShadow, shadow);
  }
}

export class DirectionalLightInfo extends LightInfo {
  constructor(
    brightness: number,
    color: number[],
    direction: number[], // spot and dir
    castsShadow: boolean = false,
    shadowStartingPosition: number[] = [0.0, 0.0, 0.0],
    shadow: ShadowInfo | undefined = undefined
  ) {
    super(
      LightType.Directional,
      brightness,
      color,
      0.0,
      shadowStartingPosition,
      direction,
      0.0,
      0.0,
      castsShadow,
      shadow
    );
  }
}
