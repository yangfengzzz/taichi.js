export { init } from "./api/Init";
export { WrapMode } from "./data/Texture";
export * from "./api/Kernels";
export * from "./api/Fields";
export { texture, canvasTexture, depthTexture } from "./api/Textures";
export { Canvas } from "./api/ui/Canvas";
export { Timer } from "./utils/Timer";
export * from "./api/KernelScopeBuiltin";
export * from "./utils/Logging";

import * as engine from "./engine/index";

export { engine };

import * as types from "./api/Types";

export { types };

import * as ti from "./index";

declare module globalThis {
  let ti: any;
}
globalThis.ti = ti;
