import { CanvasTexture, DepthTexture, Texture, TextureSamplingOptions } from "../data/Texture";

export let texture = (
  numComponents: number,
  dimensions: number[],
  sampleCount: number = 1,
  samplingOptions: TextureSamplingOptions = {}
) => {
  return new Texture(numComponents, dimensions, sampleCount, samplingOptions);
};

export let canvasTexture = (canvas: HTMLCanvasElement, sampleCount: number = 1) => {
  return new CanvasTexture(canvas, sampleCount);
};

export let depthTexture = (dimensions: number[], sampleCount: number = 1) => {
  return new DepthTexture(dimensions, sampleCount);
};
