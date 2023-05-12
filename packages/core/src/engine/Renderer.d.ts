import { Camera } from "./Camera";
import { Scene } from "./Scene";
export declare class Renderer {
    scene: Scene;
    htmlCanvas: HTMLCanvasElement;
    constructor(scene: Scene, htmlCanvas: HTMLCanvasElement);
    private depthPrePassTexture;
    private depthTexture;
    private gNormalTexture;
    private gPositionTexture;
    private directLightingTexture;
    private environmentLightingTexture;
    private ssaoTexture;
    private ssaoBlurredTexture;
    private renderResultTexture;
    private canvasTexture;
    private sceneData?;
    private skyboxVBO?;
    private skyboxIBO?;
    private quadVBO;
    private quadIBO;
    private iblLambertianFiltered?;
    private iblGGXFiltered?;
    private LUT?;
    private ssaoSamples;
    private batchInfos;
    private batchesDrawInfos;
    private batchesDrawInstanceInfos;
    private batchesDrawInfoBuffers;
    private batchesDrawInstanceInfoBuffers;
    private lightShadowMaps;
    private iblShadowMaps;
    private geometryOnlyDrawInfos;
    private geometryOnlyDrawInstanceInfos;
    private geometryOnlyDrawInfoBuffer?;
    private geometryOnlyDrawInstanceInfoBuffer?;
    private uvToDir;
    private dirToUV;
    private tonemap;
    private characteristic;
    private ggxDistribution;
    private getNormal;
    private getLightBrightnessAndDir;
    private lerp;
    private linearTosRGB;
    private sRGBToLinear;
    private fresnel;
    private evalSpecularBRDF;
    private evalDiffuseBRDF;
    private evalMetalBRDF;
    private evalDielectricBRDF;
    private evalBRDF;
    private evalShadow;
    private evalIBL;
    private hammersley2d;
    private generateTBN;
    private cosineSampleHemisphere;
    private cosineSampleHemispherePdf;
    private zPrePassKernel;
    private gPrePassKernel;
    private shadowKernel;
    private renderKernel;
    private ssaoKernel;
    private ssaoBlurKernel;
    private combineKernel;
    private presentKernel;
    init(): Promise<void>;
    initHelperFuncs(): Promise<void>;
    initKernels(): Promise<void>;
    initSSAO(): Promise<void>;
    initIBL(): Promise<void>;
    computeDrawBatches(): Promise<void>;
    render(camera: Camera): Promise<void>;
}
