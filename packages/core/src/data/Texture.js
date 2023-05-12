import { Program } from "../program/Program";
import { assert, error } from "../utils/Logging";
export var TextureDimensionality;
(function (TextureDimensionality) {
    TextureDimensionality[TextureDimensionality["Dim2d"] = 0] = "Dim2d";
    TextureDimensionality[TextureDimensionality["Dim3d"] = 1] = "Dim3d";
    TextureDimensionality[TextureDimensionality["DimCube"] = 2] = "DimCube";
})(TextureDimensionality || (TextureDimensionality = {}));
export function getTextureCoordsNumComponents(dim) {
    switch (dim) {
        case TextureDimensionality.Dim2d: {
            return 2;
        }
        case TextureDimensionality.DimCube: {
            return 3;
        }
        case TextureDimensionality.Dim3d: {
            return 3;
        }
        default: {
            error("unrecognized dimensionality");
            return 2;
        }
    }
}
export class TextureBase {
    textureId = -1;
    sampleCount = 1;
}
export var WrapMode;
(function (WrapMode) {
    WrapMode["Repeat"] = "repeat";
    WrapMode["ClampToEdge"] = "clamp-to-edge";
    WrapMode["MirrorRepeat"] = "mirror-repeat";
})(WrapMode || (WrapMode = {}));
export class Texture extends TextureBase {
    numComponents;
    dimensions;
    samplingOptions;
    constructor(numComponents, dimensions, sampleCount, samplingOptions) {
        super();
        this.numComponents = numComponents;
        this.dimensions = dimensions;
        this.samplingOptions = samplingOptions;
        this.sampleCount = sampleCount;
        assert(dimensions.length <= 3 && dimensions.length >= 1, "texture dimensions must be >= 1 and <= 3");
        assert(numComponents === 1 || numComponents === 2 || numComponents === 4, "texture dimensions must be 1, 2, or 4");
        this.texture = Program.getCurrentProgram().runtime.createGPUTexture(dimensions, this.getTextureDimensionality(), this.getGPUTextureFormat(), this.canUseAsRengerTarget(), true, 1);
        if (this.sampleCount > 1) {
            this.multiSampledRenderTexture = Program.getCurrentProgram().runtime.createGPUTexture(dimensions, this.getTextureDimensionality(), this.getGPUTextureFormat(), this.canUseAsRengerTarget(), false, sampleCount);
        }
        Program.getCurrentProgram().addTexture(this);
        this.textureView = this.texture.createView();
        this.sampler = Program.getCurrentProgram().runtime.createGPUSampler(false, samplingOptions);
    }
    texture;
    textureView;
    sampler;
    multiSampledRenderTexture = null;
    getGPUTextureFormat() {
        switch (this.numComponents) {
            // 32bit float types cannot be filtered (and thus sampled)
            case 1:
                return "r16float";
            case 2:
                return "rg16float";
            case 4:
                return "rgba16float";
            default:
                error("unsupported component count");
                return "rgba16float";
        }
    }
    canUseAsRengerTarget() {
        return true;
    }
    getGPUTexture() {
        return this.texture;
    }
    getGPUTextureView() {
        return this.textureView;
    }
    getGPUSampler() {
        return this.sampler;
    }
    getTextureDimensionality() {
        switch (this.dimensions.length) {
            case 2:
                return TextureDimensionality.Dim2d;
            case 3:
                return TextureDimensionality.Dim3d;
            default:
                error("unsupported dimensionality");
                return TextureDimensionality.Dim2d;
        }
    }
    async copyFrom(src) {
        assert(this.getTextureDimensionality() === src.getTextureDimensionality(), "texture dimensionality mismatch");
        for (let i = 0; i < this.dimensions.length; ++i) {
            assert(this.dimensions[i] === src.dimensions[i], "texture shape mismatch");
        }
        await Program.getCurrentProgram().runtime.copyTextureToTexture(src.getGPUTexture(), this.getGPUTexture(), this.dimensions);
    }
    static async createFromBitmap(bitmap) {
        let dimensions = [bitmap.width, bitmap.height];
        let texture = new Texture(4, dimensions, 1, {});
        await Program.getCurrentProgram().runtime.copyImageBitmapToTexture(bitmap, texture.getGPUTexture());
        return texture;
    }
    static async createFromHtmlImage(image) {
        let bitmap = await createImageBitmap(image);
        return await this.createFromBitmap(bitmap);
    }
    static async createFromURL(url) {
        let img = new Image();
        img.src = url;
        await img.decode();
        return await this.createFromHtmlImage(img);
    }
}
export class CanvasTexture extends TextureBase {
    htmlCanvas;
    constructor(htmlCanvas, sampleCount) {
        super();
        this.htmlCanvas = htmlCanvas;
        let contextAndFormat = Program.getCurrentProgram().runtime.createGPUCanvasContext(htmlCanvas);
        this.context = contextAndFormat[0];
        this.format = contextAndFormat[1];
        Program.getCurrentProgram().addTexture(this);
        this.sampler = Program.getCurrentProgram().runtime.createGPUSampler(false, {});
        this.sampleCount = sampleCount;
        if (this.sampleCount > 1) {
            this.multiSampledRenderTexture = Program.getCurrentProgram().runtime.createGPUTexture([htmlCanvas.width, htmlCanvas.height], this.getTextureDimensionality(), this.getGPUTextureFormat(), this.canUseAsRengerTarget(), false, sampleCount);
        }
    }
    multiSampledRenderTexture = null;
    context;
    format;
    sampler;
    getGPUTextureFormat() {
        return this.format;
    }
    canUseAsRengerTarget() {
        return true;
    }
    getGPUTexture() {
        return this.context.getCurrentTexture();
    }
    getGPUTextureView() {
        return this.context.getCurrentTexture().createView();
    }
    getGPUSampler() {
        return this.sampler;
    }
    getTextureDimensionality() {
        return TextureDimensionality.Dim2d;
    }
}
export class DepthTexture extends TextureBase {
    dimensions;
    constructor(dimensions, sampleCount) {
        super();
        this.dimensions = dimensions;
        assert(dimensions.length === 2, "depth texture must be 2D");
        this.texture = Program.getCurrentProgram().runtime.createGPUTexture(dimensions, this.getTextureDimensionality(), this.getGPUTextureFormat(), this.canUseAsRengerTarget(), false, sampleCount);
        Program.getCurrentProgram().addTexture(this);
        this.textureView = this.texture.createView();
        this.sampler = Program.getCurrentProgram().runtime.createGPUSampler(true, {});
        this.sampleCount = sampleCount;
    }
    texture;
    textureView;
    sampler;
    getGPUTextureFormat() {
        return "depth32float";
    }
    canUseAsRengerTarget() {
        return true;
    }
    getGPUTexture() {
        return this.texture;
    }
    getTextureDimensionality() {
        return TextureDimensionality.Dim2d;
    }
    getGPUTextureView() {
        return this.textureView;
    }
    getGPUSampler() {
        return this.sampler;
    }
}
export class CubeTexture extends TextureBase {
    dimensions;
    constructor(dimensions) {
        super();
        this.dimensions = dimensions;
        assert(dimensions.length === 2, "cube texture must be 2D");
        this.texture = Program.getCurrentProgram().runtime.createGPUTexture(dimensions, this.getTextureDimensionality(), this.getGPUTextureFormat(), this.canUseAsRengerTarget(), false, 1);
        Program.getCurrentProgram().addTexture(this);
        this.textureView = this.texture.createView({ dimension: "cube" });
        this.sampler = Program.getCurrentProgram().runtime.createGPUSampler(false, {});
        this.sampleCount = 1;
    }
    texture;
    textureView;
    sampler;
    getGPUTextureFormat() {
        return "rgba16float";
    }
    canUseAsRengerTarget() {
        return true;
    }
    getGPUTexture() {
        return this.texture;
    }
    getTextureDimensionality() {
        return TextureDimensionality.DimCube;
    }
    getGPUTextureView() {
        return this.textureView;
    }
    getGPUSampler() {
        return this.sampler;
    }
    static async createFromBitmap(bitmaps) {
        for (let bitmap of bitmaps) {
            assert(bitmap.width === bitmaps[0].width && bitmap.height === bitmaps[0].height, "all 6 images in a cube texture must have identical dimensions");
        }
        let dimensions = [bitmaps[0].width, bitmaps[0].height];
        let texture = new CubeTexture(dimensions);
        await Program.getCurrentProgram().runtime.copyImageBitmapsToCubeTexture(bitmaps, texture.getGPUTexture());
        return texture;
    }
    static async createFromHtmlImage(images) {
        let bitmaps = [];
        for (let img of images) {
            bitmaps.push(await createImageBitmap(img));
        }
        return await this.createFromBitmap(bitmaps);
    }
    static async createFromURL(urls) {
        let imgs = [];
        for (let url of urls) {
            let img = new Image();
            img.src = url;
            await img.decode();
            imgs.push(img);
        }
        return await this.createFromHtmlImage(imgs);
    }
}
export function isTexture(x) {
    return x instanceof Texture || x instanceof CanvasTexture || x instanceof DepthTexture || x instanceof CubeTexture;
}
