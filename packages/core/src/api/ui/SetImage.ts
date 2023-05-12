import { Field } from "../../data/Field";
import { CanvasTexture, DepthTexture, Texture, TextureBase } from "../../data/Texture";
import { field, Vector } from "../Fields";
import { classKernel, f32, i32, template } from "../Kernels";
import { canvasTexture } from "../Textures";
import {
  clearColor,
  inputFragments,
  inputVertices,
  outputColor,
  outputPosition,
  outputVertex,
  textureLoad,
  textureSample
} from "../KernelScopeBuiltin";

export class SetImage {
  VBO: Field;
  IBO: Field;
  renderTarget: CanvasTexture;
  renderFieldKernel: (...args: any[]) => any;
  renderTextureKernel: (...args: any[]) => any;
  renderDepthTextureKernel: (...args: any[]) => any;

  constructor(public htmlCanvas: HTMLCanvasElement) {
    this.VBO = Vector.field(2, f32, [4]);
    this.IBO = field(i32, [6]);
    this.renderTarget = canvasTexture(htmlCanvas);
    this.VBO.fromArray([
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1]
    ]);
    this.IBO.fromArray([0, 1, 2, 1, 3, 2]);
    this.renderFieldKernel = classKernel(this, { image: template() }, (image: any) => {
      clearColor(this.renderTarget, [0.0, 0.0, 0.0, 1]);
      for (let v of inputVertices(this.VBO, this.IBO)) {
        outputPosition([v.x, v.y, 0.0, 1.0]);
        outputVertex(v);
      }
      for (let f of inputFragments()) {
        let coord = (f + 1) / 2.0;
        //@ts-ignore
        let texelIndex = ti.i32(coord * (image.dimensions - 1));
        let color = image[texelIndex].rgb;
        outputColor(this.renderTarget, color.concat([1.0]));
      }
    });
    this.renderTextureKernel = classKernel(this, { image: template() }, (image: TextureBase) => {
      clearColor(this.renderTarget, [0.0, 0.0, 0.0, 1]);
      for (let v of inputVertices(this.VBO, this.IBO)) {
        outputPosition([v.x, v.y, 0.0, 1.0]);
        outputVertex(v);
      }
      for (let f of inputFragments()) {
        let coord = (f + 1) / 2.0;
        let color = textureSample(image, coord);
        color[3] = 1.0;
        outputColor(this.renderTarget, color);
      }
    });
    this.renderDepthTextureKernel = classKernel(this, { image: template() }, (image: DepthTexture) => {
      clearColor(this.renderTarget, [0.0, 0.0, 0.0, 1]);
      for (let v of inputVertices(this.VBO, this.IBO)) {
        outputPosition([v.x, v.y, 0.0, 1.0]);
        outputVertex(v);
      }
      for (let f of inputFragments()) {
        let coord = (f + 1) / 2.0;
        //@ts-ignore
        let texelIndex = ti.i32(coord * (image.dimensions - 1));
        let depth = textureLoad(image, texelIndex);
        let color = [depth, depth, depth, 1.0];
        outputColor(this.renderTarget, color);
      }
    });
  }

  async render(image: Field | Texture | DepthTexture) {
    if (image instanceof Field) {
      await this.renderFieldKernel(image);
    } else if (image instanceof DepthTexture) {
      await this.renderDepthTextureKernel(image);
    } else {
      await this.renderTextureKernel(image);
    }
  }
}
