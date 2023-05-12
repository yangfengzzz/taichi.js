import { Field } from "../data/Field";
import { CanvasTexture, DepthTexture, Texture, WrapMode } from "../data/Texture";
import { assert } from "../utils/Logging";
import { BatchInfo } from "./common/BatchInfo";
import { Camera } from "./Camera";
import { DrawInfo } from "./common/DrawInfo";
import { InstanceInfo } from "./common/InstanceInfo";
import { LightType } from "./common/LightInfo";
import { Scene, SceneData } from "./Scene";
import { ShadowInfo } from "./common/ShadowInfo";
import { texture, depthTexture } from "../api/Textures";
import { field } from "../api/Fields";
import { classKernel, f32, func, FuncType, i32, KernelType, sync, template } from "../api/Kernels";
import { vector } from "../api/Types";
import { canvasTexture } from "../api/Textures";
import {
  add,
  clearColor,
  cross,
  discard,
  dot,
  dpdx,
  dpdy,
  getFragCoord,
  getInstanceIndex,
  inputFragments,
  inputVertices,
  inverse,
  lookAt,
  matmul,
  mergeStructs,
  ndrange,
  norm,
  normalized,
  ortho,
  outputColor,
  outputDepth,
  outputPosition,
  outputVertex,
  range,
  Static,
  textureLoad,
  textureSample,
  textureSampleCompare,
  textureSampleLod,
  textureStore,
  transpose,
  useDepth
} from "../api/KernelScopeBuiltin";
// import {canvasTexture} from "./ca"

export class Renderer {
  public constructor(public scene: Scene, public htmlCanvas: HTMLCanvasElement) {
    this.depthPrePassTexture = depthTexture([htmlCanvas.width, htmlCanvas.height], 1);
    this.depthTexture = depthTexture([htmlCanvas.width, htmlCanvas.height], 4);
    this.gNormalTexture = texture(4, [htmlCanvas.width, htmlCanvas.height], 4);
    this.gPositionTexture = texture(4, [htmlCanvas.width, htmlCanvas.height], 4);
    this.directLightingTexture = texture(4, [htmlCanvas.width, htmlCanvas.height], 4);
    this.environmentLightingTexture = texture(4, [htmlCanvas.width, htmlCanvas.height], 4);
    this.renderResultTexture = texture(4, [htmlCanvas.width, htmlCanvas.height], 4);
    this.ssaoTexture = texture(4, [htmlCanvas.width, htmlCanvas.height], 4);
    this.ssaoBlurredTexture = texture(4, [htmlCanvas.width, htmlCanvas.height], 1);
    this.canvasTexture = canvasTexture(htmlCanvas, 4);

    this.quadVBO = field(vector(f32, 2), 4);
    this.quadIBO = field(i32, 6);

    this.ssaoSamples = field(vector(f32, 3), [32, 5, 5]);
  }

  private depthPrePassTexture: DepthTexture;
  private depthTexture: DepthTexture;
  private gNormalTexture: Texture;
  private gPositionTexture: Texture;
  private directLightingTexture: Texture;
  private environmentLightingTexture: Texture;
  private ssaoTexture: Texture;
  private ssaoBlurredTexture: Texture;
  private renderResultTexture: Texture;
  private canvasTexture: CanvasTexture;

  private sceneData?: SceneData;

  private skyboxVBO?: Field;
  private skyboxIBO?: Field;

  private quadVBO: Field;
  private quadIBO: Field;

  private iblLambertianFiltered?: Texture;
  private iblGGXFiltered?: Texture;
  private LUT?: Texture;

  private ssaoSamples: Field;

  // batches based on materials
  private batchInfos: BatchInfo[] = [];
  private batchesDrawInfos: DrawInfo[][] = [];
  private batchesDrawInstanceInfos: InstanceInfo[][] = [];

  private batchesDrawInfoBuffers: Field[] = [];
  private batchesDrawInstanceInfoBuffers: Field[] = [];

  // shadow stuff
  private lightShadowMaps: (DepthTexture | undefined)[] = [];
  private iblShadowMaps: DepthTexture[] = [];

  private geometryOnlyDrawInfos: DrawInfo[] = [];
  private geometryOnlyDrawInstanceInfos: InstanceInfo[] = [];

  private geometryOnlyDrawInfoBuffer?: Field;
  private geometryOnlyDrawInstanceInfoBuffer?: Field;

  // funcs
  private uvToDir: FuncType = () => {};
  private dirToUV: FuncType = () => {};
  private tonemap: FuncType = () => {};
  private characteristic: FuncType = () => {};
  private ggxDistribution: FuncType = () => {};
  private getNormal: FuncType = () => {};
  private getLightBrightnessAndDir: FuncType = () => {};
  private lerp: FuncType = () => {};
  private linearTosRGB: FuncType = () => {};
  private sRGBToLinear: FuncType = () => {};
  private fresnel: FuncType = () => {};
  private evalSpecularBRDF: FuncType = () => {};
  private evalDiffuseBRDF: FuncType = () => {};
  private evalMetalBRDF: FuncType = () => {};
  private evalDielectricBRDF: FuncType = () => {};
  private evalBRDF: FuncType = () => {};
  private evalShadow: FuncType = () => {};
  private evalIBL: FuncType = () => {};
  private hammersley2d: FuncType = () => {};
  private generateTBN: FuncType = () => {};
  private cosineSampleHemisphere: FuncType = () => {};
  private cosineSampleHemispherePdf: FuncType = () => {};

  // classKernels
  private zPrePassKernel: KernelType = () => {};
  private gPrePassKernel: KernelType = () => {};
  private shadowKernel: KernelType = () => {};
  private renderKernel: KernelType = () => {};
  private ssaoKernel: KernelType = () => {};
  private ssaoBlurKernel: KernelType = () => {};
  private combineKernel: KernelType = () => {};
  private presentKernel: KernelType = () => {};

  async init() {
    this.sceneData = await this.scene.getKernelData();
    for (let light of this.scene.lights) {
      if (light.castsShadow) {
        assert(light.type === LightType.Directional, "only directional lights can be shadow casters");
        assert(light.shadow !== undefined, "expexcting shadow info");
        this.lightShadowMaps.push(depthTexture(light.shadow!.shadowMapResolution, 1));
        light.shadow!.view = lookAt(light.position, add(light.position, light.direction), [0.0, 1.0, 0.0]);
        let size = light.shadow!.physicalSize;
        light.shadow!.projection = ortho(
          -0.5 * size[0],
          0.5 * size[0],
          -0.5 * size[1],
          0.5 * size[0],
          0.0,
          light.shadow!.maxDistance
        );
        light.shadow!.viewProjection = matmul(light.shadow!.projection, light.shadow!.view);
      }
    }
    for (let iblShadow of this.scene.iblShadows) {
      this.iblShadowMaps.push(depthTexture(iblShadow.shadowMapResolution, 1));
    }

    await this.quadVBO.fromArray([
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1]
    ]);
    await this.quadIBO.fromArray([0, 1, 2, 1, 3, 2]);

    await this.computeDrawBatches();

    await this.initHelperFuncs();
    await this.initIBL();
    await this.initSSAO();
    await this.initKernels();
  }

  async initHelperFuncs() {
    this.uvToDir = func((uv: vector): vector => {
      let y = Math.cos((1.0 - uv[1]) * Math.PI);
      let phi = ((uv[0] - 0.5) * Math.PI) / 0.5;
      let absZOverX = Math.abs(Math.tan(phi));
      let xSquared = (1.0 - y * y) / (1.0 + absZOverX * absZOverX);
      let x = Math.sqrt(xSquared);
      let z = x * absZOverX;
      if (Math.abs(phi) >= Math.PI * 0.5) {
        x = -x;
      }
      if (phi < 0) {
        z = -z;
      }
      return [x, y, z];
    });

    this.dirToUV = func((dir: vector): vector => {
      return [0.5 + (0.5 * Math.atan2(dir[2], dir[0])) / Math.PI, 1.0 - Math.acos(dir[1]) / Math.PI];
    });

    this.tonemap = func((color: vector, exposure: number) => {
      let A = 2.51;
      let B = 0.03;
      let C = 2.43;
      let D = 0.59;
      let E = 0.14;
      //@ts-ignore
      let temp = color * exposure;
      temp = (temp * (A * temp + B)) / (temp * (C * temp + D) + E);
      return Math.max(0.0, Math.min(1.0, temp));
    });

    this.characteristic = func((x: number) => {
      let result = 1;
      if (x < 0) {
        result = 0;
      }
      return result;
    });

    this.ggxDistribution = func((NdotH: number, alpha: number) => {
      let numerator = alpha * alpha * this.characteristic(NdotH);
      let temp = NdotH * NdotH * (alpha * alpha - 1) + 1;
      let denominator = Math.PI * temp * temp;
      return numerator / denominator;
    });

    this.getLightBrightnessAndDir = func((light: any, fragPos: vector) => {
      let brightness: vector = [0.0, 0.0, 0.0];
      let lightDir: vector = [0.0, 0.0, 0.0];
      if (light.type === LightType.Point || light.type === LightType.Spot) {
        let fragToLight = light.position - fragPos;
        let distance = norm(fragToLight);
        let attenuation = 1.0 / Math.max(distance * distance, 0.01 * 0.01);
        let window = (1 - (distance / light.influenceRadius) ** 2) ** 4;
        //@ts-ignore
        brightness = light.brightness * attenuation * window;
        if (light.type === LightType.Spot) {
          let cosAngle = dot(-normalized(fragToLight), light.direction);
          let spotScale = 1.0 / Math.max(Math.cos(light.innerConeAngle) - Math.cos(light.outerConeAngle), 1e-4);
          let spotOffset = -Math.cos(light.outerConeAngle) * spotScale;
          let t = cosAngle * spotScale + spotOffset;
          t = Math.max(0.0, Math.min(1.0, t));
          //@ts-ignore
          brightness = brightness * t * t;
        }
        lightDir = normalized(fragToLight);
      } else if (light.type === LightType.Directional) {
        brightness = light.brightness;
        lightDir = -light.direction;
      }
      return {
        brightness,
        lightDir
      };
    });

    this.lerp = func((x: vector | number, y: vector | number, s: number): vector | number => {
      return x * (1.0 - s) + y * s;
    });

    this.linearTosRGB = func((x: vector | number): vector | number => {
      return Math.pow(x, 1.0 / 2.2);
    });

    this.sRGBToLinear = func((x: vector | number): vector | number => {
      return Math.pow(x, 2.2);
    });

    this.fresnel = func((F0: vector | number, directions: any) => {
      return F0 + (1.0 - F0) * (1.0 - Math.abs(directions.HdotV)) ** 5;
    });

    this.evalSpecularBRDF = func((alpha: number, Fr: vector | number, directions: any) => {
      let D = this.ggxDistribution(directions.NdotH, alpha);
      let NdotL = Math.abs(directions.NdotL);
      let NdotV = Math.abs(directions.NdotV);
      let G2_Over_4_NdotL_NdotV = 0.5 / this.lerp(2 * NdotL * NdotV, NdotL + NdotV, alpha);
      return (
        G2_Over_4_NdotL_NdotV * D * Fr * this.characteristic(directions.HdotL) * this.characteristic(directions.HdotV)
      );
    });

    this.evalDiffuseBRDF = func((albedo: any, directions: any) => {
      return albedo * (1.0 / Math.PI) * this.characteristic(directions.NdotL) * this.characteristic(directions.NdotV);
    });

    this.evalMetalBRDF = func((alpha: number, baseColor: vector, directions: any) => {
      let F0 = baseColor;
      let Fr = this.fresnel(F0, directions);
      return this.evalSpecularBRDF(alpha, Fr, directions);
    });

    this.evalDielectricBRDF = func((alpha: number, baseColor: vector, directions: any) => {
      let dielectricF0: vector = [0.04, 0.04, 0.04];
      let Fr = this.fresnel(dielectricF0, directions);
      let specular = this.evalSpecularBRDF(alpha, Fr, directions);
      let diffuse = this.evalDiffuseBRDF(baseColor, directions);
      return diffuse * (1 - Fr) + specular;
    });

    this.evalBRDF = func((material: any, normal: vector, lightDir: vector, viewDir: vector) => {
      let halfDir = normalized(viewDir + lightDir);
      let directions = {
        normal: normal,
        lightDir: lightDir,
        viewDir: viewDir,
        halfDir: halfDir,
        NdotH: dot(normal, halfDir),
        NdotV: dot(normal, viewDir),
        NdotL: dot(normal, lightDir),
        HdotV: dot(halfDir, viewDir),
        HdotL: dot(halfDir, lightDir)
      };
      let alpha = material.roughness * material.roughness;
      let metallicBRDF = this.evalMetalBRDF(alpha, material.baseColor.rgb, directions);
      let dielectricBRDF = this.evalDielectricBRDF(alpha, material.baseColor.rgb, directions);
      return material.metallic * metallicBRDF + (1.0 - material.metallic) * dielectricBRDF;
    });

    this.evalShadow = func((pos: vector, shadowMap: DepthTexture, shadowInfo: ShadowInfo) => {
      let vp = shadowInfo.viewProjection;
      let clipSpacePos = matmul(vp, pos.concat([1.0]));
      let depth = clipSpacePos.z / clipSpacePos.w;
      let coords: vector = (clipSpacePos.xy / clipSpacePos.w) * 0.5 + 0.5;
      coords.y = 1.0 - coords.y;
      let visibility = textureSampleCompare(shadowMap, coords, depth - 0.001);
      let contribution = 1.0 - (1.0 - visibility) * shadowInfo.strength;
      return contribution;
    });

    this.evalIBL = func((material: any, normal: vector, viewDir: vector, pos: vector) => {
      let dielectricF0: vector = [0.04, 0.04, 0.04];
      let result: vector = [0.0, 0.0, 0.0];
      if (Static(this.scene.ibl !== undefined)) {
        let diffuseColor = (1.0 - material.metallic) * (1.0 - dielectricF0) * material.baseColor.rgb;
        let normalUV = this.dirToUV(normal);
        let diffuseLight = textureSample(this.iblLambertianFiltered!, normalUV).rgb;
        let diffuse = diffuseColor * diffuseLight;

        let specularColor = (1.0 - material.metallic) * dielectricF0 + material.metallic * material.baseColor.rgb;
        let reflection = normalized(2.0 * normal * dot(normal, viewDir) - viewDir);
        let reflectionUV = this.dirToUV(reflection);
        let specularLight = textureSample(this.iblGGXFiltered!, reflectionUV.concat([material.roughness])).rgb;
        let NdotV = dot(normal, viewDir);
        let scaleBias = textureSample(this.LUT!, [NdotV, material.roughness]).rg;
        let specular = specularLight * (specularColor * scaleBias[0] + scaleBias[1]);

        result = specular + diffuse;
        for (let i of Static(range(this.scene.iblShadows.length))) {
          let contribution = this.evalShadow(pos, this.iblShadowMaps[i], this.scene.iblShadows[i]);
          result *= contribution;
        }
        result = result * this.scene.iblIntensity;
      }
      return result;
    });

    this.getNormal = func((normal: vector, normalMap: vector, texCoords: vector, position: vector) => {
      let uvDx: vector = dpdx(texCoords.concat([0.0]));
      let uvDy: vector = dpdy(texCoords.concat([0.0]));
      let posDx: vector = dpdx(position);
      let posDy: vector = dpdy(position);
      let denom = uvDx[0] * uvDy[1] - uvDy[0] * uvDx[1];
      let temp = (uvDy[1] * posDx - uvDx[1] * posDy) / denom;
      let tangent = temp - normal * dot(normal, temp);
      let tangentNorm = norm(tangent);
      let bitangent = cross(normal, tangent);
      let bitangentNorm = norm(bitangent);
      let mat = transpose([tangent / tangentNorm, bitangent / bitangentNorm, normal]);
      let normalMapValue = normalized(normalMap * 2.0 - 1.0);
      let result = normalized(matmul(mat, normalMapValue));
      if (denom === 0.0 || tangentNorm === 0.0 || bitangentNorm === 0.0) {
        result = normal;
      }
      return result;
    });

    this.hammersley2d = func((i: number, N: number) => {
      let radicalInverseVdC = (bits: number) => {
        bits = (bits << 16) | (bits >>> 16);
        bits = ((bits & 0x55555555) << 1) | ((bits & 0xaaaaaaaa) >>> 1);
        bits = ((bits & 0x33333333) << 2) | ((bits & 0xcccccccc) >>> 2);
        bits = ((bits & 0x0f0f0f0f) << 4) | ((bits & 0xf0f0f0f0) >>> 4);
        bits = ((bits & 0x00ff00ff) << 8) | ((bits & 0xff00ff00) >>> 8);
        //@ts-ignore
        let result = f32(bits) * 2.3283064365386963e-10;
        if (bits < 0) {
          //@ts-ignore
          result = 1.0 + f32(bits) * 2.3283064365386963e-10;
        }
        return result;
      };
      //@ts-ignore
      return [f32(i) / N, radicalInverseVdC(i32(i))];
    });

    this.generateTBN = func((normal: vector) => {
      let bitangent = [0.0, 1.0, 0.0];

      let NdotUp = dot(normal, [0.0, 1.0, 0.0]);
      let epsilon = 0.0000001;
      if (1.0 - Math.abs(NdotUp) <= epsilon) {
        // Sampling +Y or -Y, so we need a more robust bitangent.
        if (NdotUp > 0.0) {
          bitangent = [0.0, 0.0, 1.0];
        } else {
          bitangent = [0.0, 0.0, -1.0];
        }
      }

      let tangent = normalized(cross(bitangent, normal));
      bitangent = cross(normal, tangent);

      return transpose([tangent, bitangent, normal]);
    });

    this.cosineSampleHemisphere = func((randomSource: vector) => {
      let concentricSampleDisk = (randomSource: vector) => {
        let result: vector = [0.0, 0.0];
        let uOffset: vector = 2.0 * randomSource - 1.0;
        if (uOffset.x !== 0 || uOffset.y !== 0) {
          let theta = 0.0;
          let r = 0.0;
          if (Math.abs(uOffset.x) > Math.abs(uOffset.y)) {
            r = uOffset.x;
            theta = (Math.PI / 4.0) * (uOffset.y / uOffset.x);
          } else {
            r = uOffset.y;
            theta = Math.PI / 2.0 - (Math.PI / 4.0) * (uOffset.x / uOffset.y);
          }
          //@ts-ignore
          result = r * [Math.cos(theta), Math.sin(theta)];
        }
        return result;
      };
      let d = concentricSampleDisk(randomSource);
      let z = Math.sqrt(Math.max(0.0, 1 - d.x * d.x - d.y * d.y));
      return [d.x, d.y, z];
    });

    this.cosineSampleHemispherePdf = func((sampled: vector) => {
      let cosTheta = sampled.z;
      return cosTheta / Math.PI;
    });
  }

  async initKernels() {
    this.zPrePassKernel = classKernel(this, { camera: Camera.getKernelType() }, (camera: any) => {
      useDepth(this.depthPrePassTexture);
      for (let v of inputVertices(
        this.sceneData!.vertexBuffer,
        this.sceneData!.indexBuffer,
        Static(this.geometryOnlyDrawInfoBuffer),
        Static(this.geometryOnlyDrawInfoBuffer!.dimensions[0])
      )) {
        let instanceIndex = getInstanceIndex();
        //@ts-ignore
        let instanceInfo = this.geometryOnlyDrawInstanceInfoBuffer[instanceIndex];
        let nodeIndex = instanceInfo.nodeIndex;
        //@ts-ignore
        let modelMatrix = this.sceneData.nodesBuffer[nodeIndex].globalTransform.matrix;

        v.position = modelMatrix.matmul(v.position.concat([1.0])).xyz;
        let pos = matmul(camera.viewProjection, v.position.concat([1.0]));
        outputPosition(pos);
        outputVertex(v);
      }
      for (let f of inputFragments()) {
        //no-op
      }
    });
    this.gPrePassKernel = classKernel(this, { camera: Camera.getKernelType() }, (camera: any) => {
      useDepth(this.depthTexture);
      clearColor(this.gNormalTexture, [0.0, 0.0, 0.0, 0.0]);
      clearColor(this.gPositionTexture, [0.0, 0.0, 0.0, 0.0]);
      for (let v of inputVertices(
        this.sceneData!.vertexBuffer,
        this.sceneData!.indexBuffer,
        Static(this.geometryOnlyDrawInfoBuffer),
        Static(this.geometryOnlyDrawInfoBuffer!.dimensions[0])
      )) {
        let instanceIndex = getInstanceIndex();
        //@ts-ignore
        let instanceInfo = this.geometryOnlyDrawInstanceInfoBuffer[instanceIndex];
        let nodeIndex = instanceInfo.nodeIndex;
        //@ts-ignore
        let modelMatrix = this.sceneData.nodesBuffer[nodeIndex].globalTransform.matrix;
        v.normal = transpose(inverse(modelMatrix.slice([0, 0], [3, 3]))).matmul(v.normal);
        v.position = modelMatrix.matmul(v.position.concat([1.0])).xyz;
        let pos = matmul(camera.viewProjection, v.position.concat([1.0]));
        outputPosition(pos);
        outputVertex(v);
      }
      for (let f of inputFragments()) {
        let fragCoord = getFragCoord();
        //@ts-ignore
        if (fragCoord.z > textureLoad(this.depthPrePassTexture, i32(fragCoord.xy)) + 0.001) {
          discard();
        }
        let normal = normalized(f.normal);
        outputColor(this.gNormalTexture, normal.concat([1.0]));
        outputColor(this.gPositionTexture, f.position.concat([1.0]));
      }
    });
    this.renderKernel = classKernel(this, { camera: Camera.getKernelType() }, (camera: any) => {
      useDepth(this.depthTexture);
      clearColor(this.directLightingTexture, [0, 0, 0, 1]);
      clearColor(this.environmentLightingTexture, [0, 0, 0, 1]);

      for (let batchID of Static(range(this.batchesDrawInfoBuffers.length))) {
        let getMaterial = (fragment: any, materialID: number) => {
          //@ts-ignore
          let materialInfo = this.sceneData.materialInfoBuffer[materialID];
          let material = {
            baseColor: materialInfo.baseColor.value,
            metallic: materialInfo.metallicRoughness.value[0],
            roughness: materialInfo.metallicRoughness.value[1],
            emissive: materialInfo.emissive.value,
            normalMap: materialInfo.normalMap.value
          };
          if (Static(this.batchInfos[batchID].materialIndex != -1)) {
            let texCoords = fragment.texCoords0;
            let materialRef = this.scene.materials[this.batchInfos[batchID].materialIndex];
            if (Static(materialRef.baseColor.texture !== undefined)) {
              if (Static(materialRef.baseColor.texcoordsSet === 1)) {
                texCoords = fragment.texCoords1;
              }
              let sampledBaseColor = textureSample(materialRef.baseColor.texture!, texCoords);
              sampledBaseColor.rgb = this.sRGBToLinear(sampledBaseColor.rgb);
              material.baseColor *= sampledBaseColor;
            }
            if (Static(materialRef.metallicRoughness.texture !== undefined)) {
              if (Static(materialRef.metallicRoughness.texcoordsSet === 1)) {
                texCoords = fragment.texCoords1;
              }
              let metallicRoughness = textureSample(materialRef.metallicRoughness.texture!, texCoords);
              material.metallic *= metallicRoughness.b;
              material.roughness *= metallicRoughness.g;
            }
            if (Static(materialRef.emissive.texture !== undefined)) {
              if (Static(materialRef.emissive.texcoordsSet === 1)) {
                texCoords = fragment.texCoords1;
              }
              let sampledEmissive = textureSample(materialRef.emissive.texture!, texCoords).rgb;
              sampledEmissive = this.sRGBToLinear(sampledEmissive);
              material.emissive *= sampledEmissive;
            }
            if (Static(materialRef.normalMap.texture !== undefined)) {
              if (Static(materialRef.normalMap.texcoordsSet === 1)) {
                texCoords = fragment.texCoords1;
              }
              let sampledNormal = textureSample(materialRef.normalMap.texture!, texCoords).rgb;
              material.normalMap = sampledNormal;
            }
          }
          return material;
        };

        for (let v of inputVertices(
          this.sceneData!.vertexBuffer,
          this.sceneData!.indexBuffer,
          Static(this.batchesDrawInfoBuffers[batchID]),
          Static(this.batchesDrawInfoBuffers[batchID].dimensions[0])
        )) {
          let instanceIndex = getInstanceIndex();
          //@ts-ignore
          let instanceInfo = this.batchesDrawInstanceInfoBuffers[batchID][instanceIndex];
          let nodeIndex = instanceInfo.nodeIndex;
          let materialIndex = instanceInfo.materialIndex;
          //@ts-ignore
          let modelMatrix = this.sceneData.nodesBuffer[nodeIndex].globalTransform.matrix;

          v.normal = transpose(inverse(modelMatrix.slice([0, 0], [3, 3]))).matmul(v.normal);
          v.position = modelMatrix.matmul(v.position.concat([1.0])).xyz;
          let pos = camera.viewProjection.matmul(v.position.concat([1.0]));
          outputPosition(pos);
          let vertexOutput = mergeStructs(v, { materialIndex: materialIndex });
          outputVertex(vertexOutput);
        }
        for (let f of inputFragments()) {
          let fragCoord = getFragCoord();
          //@ts-ignore
          if (fragCoord.z > textureLoad(this.depthPrePassTexture, i32(fragCoord.xy)) + 0.001) {
            discard();
          }
          let materialID = f.materialIndex;
          let material = getMaterial(f, materialID);
          let normal = f.normal.normalized();
          normal = this.getNormal(normal, material.normalMap, f.texCoords0, f.position);
          let viewDir = normalized(camera.position - f.position);

          let directLighting: vector = [0.0, 0.0, 0.0];
          directLighting += material.emissive;

          let evalLight = (light: any) => {
            let brightnessAndDir = this.getLightBrightnessAndDir(light, f.position);
            let brdf = this.evalBRDF(material, normal, brightnessAndDir.lightDir, viewDir);
            return brightnessAndDir.brightness * brdf;
          };

          if (Static(this.scene.lights.length > 0)) {
            for (let i of range(this.scene.lights.length)) {
              //@ts-ignore
              let light = this.sceneData.lightsInfoBuffer[i];
              if (!light.castsShadow) {
                directLighting += evalLight(light);
              }
            }
            for (let i of Static(range(this.scene.lights.length))) {
              if (Static(this.scene.lights[i].castsShadow)) {
                directLighting +=
                  evalLight(this.scene.lights[i]) *
                  this.evalShadow(f.position, this.lightShadowMaps[i]!, this.scene.lights[i].shadow!);
              }
            }
          }

          let environmentLighting: vector = this.evalIBL(material, normal, viewDir, f.position);
          directLighting += environmentLighting;

          outputColor(this.directLightingTexture, directLighting.concat([1.0]));
          outputColor(this.environmentLightingTexture, environmentLighting.concat([1.0]));
        }
      }
      if (Static(this.scene.ibl !== undefined)) {
        for (let v of inputVertices(this.skyboxVBO!, this.skyboxIBO!)) {
          let pos = camera.viewProjection.matmul((v + camera.position).concat([1.0]));
          outputPosition(pos);
          outputVertex(v);
        }
        for (let f of inputFragments()) {
          let fragCoord = getFragCoord();
          //@ts-ignore
          if (1.0 > textureLoad(this.depthPrePassTexture, i32(fragCoord.xy))) {
            discard();
          }
          let dir = f.normalized();
          let uv = this.dirToUV(dir);
          let color = textureSample(this.iblGGXFiltered!, uv.concat([this.scene.iblBackgroundBlur]));
          //color *= this.scene.iblIntensity
          color.rgb = this.tonemap(color.rgb, this.scene.ibl!.exposure);
          color[3] = 1.0;
          outputColor(this.directLightingTexture, color);
          outputColor(this.environmentLightingTexture, [0.0, 0.0, 0.0, 0.0]);
          outputDepth(1.0);
        }
      }
    });
    this.ssaoKernel = classKernel(this, { camera: Camera.getKernelType() }, (camera: any) => {
      useDepth(this.depthTexture);
      clearColor(this.ssaoTexture, [0, 0, 0, 1]);

      for (let v of inputVertices(
        this.sceneData!.vertexBuffer,
        this.sceneData!.indexBuffer,
        Static(this.geometryOnlyDrawInfoBuffer),
        Static(this.geometryOnlyDrawInfoBuffer!.dimensions[0])
      )) {
        let instanceIndex = getInstanceIndex();
        //@ts-ignore
        let instanceInfo = this.geometryOnlyDrawInstanceInfoBuffer[instanceIndex];
        let nodeIndex = instanceInfo.nodeIndex;
        //@ts-ignore
        let modelMatrix = this.sceneData.nodesBuffer[nodeIndex].globalTransform.matrix;
        v.normal = transpose(inverse(modelMatrix.slice([0, 0], [3, 3]))).matmul(v.normal);
        v.position = modelMatrix.matmul(v.position.concat([1.0])).xyz;
        let pos = matmul(camera.viewProjection, v.position.concat([1.0]));
        outputPosition(pos);
        outputVertex(v);
      }
      for (let f of inputFragments()) {
        let fragCoord = getFragCoord();
        //@ts-ignore
        if (fragCoord.z > textureLoad(this.depthPrePassTexture, i32(fragCoord.xy)) + 0.001) {
          discard();
        }
        let normal = f.normal.normalized();
        let TBN = this.generateTBN(normal);

        let clipSpacePos = matmul(camera.viewProjection, f.position.concat([1.0]));
        let screenSpaceCoords: vector = (clipSpacePos.xy / clipSpacePos.w) * 0.5 + 0.5;
        //@ts-ignore
        let texelIndex = i32(
          //@ts-ignore
          [screenSpaceCoords.x, 1.0 - screenSpaceCoords.y] * ([this.htmlCanvas.width, this.htmlCanvas.height] - 1)
        );
        let indexInBlock: vector = [
          texelIndex.x % this.ssaoSamples.dimensions[1],
          texelIndex.y % this.ssaoSamples.dimensions[2]
        ];
        //@ts-ignore
        let numSamples = this.ssaoSamples.dimensions[0];
        let sampleRadius = norm(camera.position - f.position) * 0.05;

        let sumVisibility = 0.0;

        for (let i of range(numSamples)) {
          //@ts-ignore
          let ssaoSample = this.ssaoSamples[[i, indexInBlock.x, indexInBlock.y]];
          let deltaPos = matmul(TBN, ssaoSample) * sampleRadius;
          let sampledPoint = deltaPos + f.position;
          let sampledPointClipSpace = matmul(camera.viewProjection, sampledPoint.concat([1.0]));
          //@ts-ignore
          let sampledPointDepth = sampledPointClipSpace.z / sampledPointClipSpace.w;
          let sampledPointScreenSpace: vector = (sampledPointClipSpace.xy / sampledPointClipSpace.w) * 0.5 + 0.5;
          let texCoords = [sampledPointScreenSpace.x, 1.0 - sampledPointScreenSpace.y];

          let vis = 1.0;
          if (
            sampledPointDepth >=
            //@ts-ignore
            textureLoad(this.depthPrePassTexture, i32(texCoords * (this.depthPrePassTexture.dimensions - 1)))
          ) {
            vis = 0.0;
          }
          sumVisibility += vis; // should multiply by cosTheta here (see games 202 lecture), but this is cancelled by dividing the PDF
        }
        let meanVisibility = sumVisibility / numSamples;
        outputColor(this.ssaoTexture, [0.0, 0.0, 0.0, meanVisibility]);
        //outputColor(this.ssaoTexture, [1 - result.w, 1-result.w, 1-result.w, 1.0])
      }
    });

    this.ssaoBlurKernel = classKernel(this, () => {
      for (let I of ndrange(this.ssaoTexture.dimensions[0], this.ssaoTexture.dimensions[1])) {
        let ssaoSum: vector = [0.0, 0.0, 0.0, 0.0];
        for (let delta of ndrange(5, 5)) {
          let J: vector = I + delta - 1;
          //@ts-ignore
          J = Math.max(0, Math.min(this.ssaoTexture.dimensions - 1, J));
          let ssao = textureLoad(this.ssaoTexture, J);
          ssaoSum += ssao;
        }
        textureStore(this.ssaoBlurredTexture, I, ssaoSum / 25.0);
      }
    });
    this.shadowKernel = classKernel(
      this,
      { shadowMap: template(), shadowInfo: template() },
      (shadowMap: DepthTexture, shadowInfo: ShadowInfo) => {
        useDepth(shadowMap);
        for (let v of inputVertices(
          this.sceneData!.vertexBuffer,
          this.sceneData!.indexBuffer,
          Static(this.geometryOnlyDrawInfoBuffer),
          Static(this.geometryOnlyDrawInfoBuffer!.dimensions[0])
        )) {
          let instanceIndex = getInstanceIndex();
          //@ts-ignore
          let instanceInfo = this.geometryOnlyDrawInstanceInfoBuffer[instanceIndex];
          let nodeIndex = instanceInfo.nodeIndex;
          //@ts-ignore
          let modelMatrix = this.sceneData.nodesBuffer[nodeIndex].globalTransform.matrix;

          v.position = modelMatrix.matmul(v.position.concat([1.0])).xyz;
          let pos = matmul(shadowInfo.viewProjection, v.position.concat([1.0]));
          outputPosition(pos);
          outputVertex(v);
        }
        for (let f of inputFragments()) {
          //no-op
        }
      }
    );
    this.combineKernel = classKernel(this, {}, () => {
      clearColor(this.renderResultTexture, [0.0, 0.0, 0.0, 1]);
      for (let v of inputVertices(this.quadVBO, this.quadIBO)) {
        outputPosition([v.x, v.y, 0.0, 1.0]);
        outputVertex(v);
      }
      for (let f of inputFragments()) {
        let coord: vector = (f + 1) / 2.0;
        coord[1] = 1 - coord[1];

        let directLighting = textureSample(this.directLightingTexture, coord).rgb;
        let environmentLighting = textureSample(this.environmentLightingTexture, coord).rgb;
        let ssao = textureSample(this.ssaoBlurredTexture, coord);
        let occlusion = ssao[3];
        let color: vector = directLighting - environmentLighting * (1.0 - occlusion);
        color = this.linearTosRGB(this.tonemap(color, 1.0));
        //color = [occlusion, occlusion, occlusion]
        outputColor(this.renderResultTexture, color.concat([1.0]));
      }
    });
    this.presentKernel = classKernel(this, { presentedTexture: template() }, (presentedTexture: Texture) => {
      clearColor(this.canvasTexture, [0.0, 0.0, 0.0, 1]);
      for (let v of inputVertices(this.quadVBO, this.quadIBO)) {
        outputPosition([v.x, v.y, 0.0, 1.0]);
        outputVertex(v);
      }
      for (let f of inputFragments()) {
        let coord: vector = (f + 1) / 2.0;
        coord[1] = 1 - coord[1];

        let color = textureSample(presentedTexture, coord);
        color[3] = 1.0;
        outputColor(this.canvasTexture, color);
      }
    });
  }

  async initSSAO() {
    let generateSamples = classKernel(this, () => {
      let numSamples = this.ssaoSamples.dimensions[0];
      let blockSizeX = this.ssaoSamples.dimensions[1];
      let blockSizeY = this.ssaoSamples.dimensions[2];
      for (let I of ndrange(numSamples, blockSizeX, blockSizeY)) {
        let sampleId = I[0];
        let randomSource = this.hammersley2d(sampleId, numSamples);
        let sample = this.cosineSampleHemisphere(randomSource);
        let length = Math.random();
        length = this.lerp(0.1, 1.0, length);
        sample *= length;
        //@ts-ignore
        this.ssaoSamples[I] = sample;
      }
    });
    await generateSamples();
  }

  async initIBL() {
    if (this.scene.ibl) {
      this.iblLambertianFiltered = texture(4, this.scene.ibl.texture.dimensions);
      this.iblGGXFiltered = texture(4, this.scene.ibl.texture.dimensions.concat([16]), 1, {
        wrapModeW: WrapMode.ClampToEdge
      });
      this.LUT = texture(4, [512, 512], 1, {
        wrapModeU: WrapMode.ClampToEdge,
        wrapModeV: WrapMode.ClampToEdge
      });
      this.skyboxVBO = field(vector(f32, 3), 8);
      this.skyboxIBO = field(i32, 36);

      await this.skyboxVBO.fromArray([
        [-1, -1, -1],
        [-1, -1, 1],
        [-1, 1, -1],
        [-1, 1, 1],
        [1, -1, -1],
        [1, -1, 1],
        [1, 1, -1],
        [1, 1, 1]
      ]);
      await this.skyboxIBO.fromArray([
        0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 0, 2, 4, 2, 6, 4, 1, 3, 5, 3, 7, 5, 0, 1, 4, 1, 5, 4, 2, 3, 6, 3, 7, 6
      ]);

      let prefilterKernel = classKernel(
        this,
        () => {
          let kSampleCount = 1024;

          let computeLod = (pdf: number) => {
            return (
              (0.5 *
                Math.log(
                  (6.0 * this.scene.ibl!.texture.dimensions[0] * this.scene.ibl!.texture.dimensions[0]) /
                    (kSampleCount * pdf)
                )) /
              Math.log(2.0)
            );
          };

          let getLambertianImportanceSample = (normal: vector, xi: vector) => {
            let localSpaceDirection = this.cosineSampleHemisphere(xi);
            let pdf = this.cosineSampleHemispherePdf(localSpaceDirection);
            let TBN = this.generateTBN(normal);
            let direction = matmul(TBN, localSpaceDirection);
            return {
              pdf: pdf,
              direction: direction
            };
          };

          let filterLambertian = (normal: vector) => {
            let color: any = [0.0, 0.0, 0.0];
            for (let i of range(kSampleCount)) {
              let xi = this.hammersley2d(i, kSampleCount);
              let importanceSample = getLambertianImportanceSample(normal, xi);
              let halfDir = importanceSample.direction;
              let pdf = importanceSample.pdf;
              let lod = computeLod(pdf);
              let halfDirCoords = this.dirToUV(halfDir);
              let sampled = textureSampleLod(this.scene.ibl!.texture, halfDirCoords, lod);
              //@ts-ignore
              color += sampled.rgb / kSampleCount;
            }
            return color;
          };

          for (let I of ndrange(this.iblLambertianFiltered!.dimensions[0], this.iblLambertianFiltered!.dimensions[1])) {
            //@ts-ignore
            let uv = I / (this.iblLambertianFiltered.dimensions - [1.0, 1.0]);
            let dir = this.uvToDir(uv);
            let filtered = filterLambertian(dir);
            textureStore(this.iblLambertianFiltered!, I, filtered.concat([1.0]));
          }

          let saturate = (v: any) => {
            return Math.max(0.0, Math.min(1.0, v));
          };

          let getGGXImportanceSample = (normal: vector, roughness: number, xi: vector) => {
            let alpha = roughness * roughness;
            let cosTheta = saturate(Math.sqrt((1.0 - xi[1]) / (1.0 + (alpha * alpha - 1.0) * xi[1])));
            let sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);
            let phi = 2.0 * Math.PI * xi[0];

            let pdf = this.ggxDistribution(cosTheta, alpha) / 4.0;
            let localSpaceDirection = [sinTheta * Math.cos(phi), sinTheta * Math.sin(phi), cosTheta];
            let TBN = this.generateTBN(normal);
            let direction = matmul(TBN, localSpaceDirection);
            return {
              pdf: pdf,
              direction: direction
            };
          };

          let filterGGX = (normal: vector, roughness: number) => {
            let color = [0.0, 0.0, 0.0];
            for (let i of range(kSampleCount)) {
              let xi = this.hammersley2d(i, kSampleCount);
              let importanceSample = getGGXImportanceSample(normal, roughness, xi);
              let halfDir = importanceSample.direction;
              let pdf = importanceSample.pdf;
              let lod = computeLod(pdf);
              if (roughness == 0.0) {
                lod = 0.0;
              }
              let halfDirCoords = this.dirToUV(halfDir);
              let sampled = textureSampleLod(this.scene.ibl!.texture, halfDirCoords, lod);
              //@ts-ignore
              color += sampled.rgb / kSampleCount;
            }
            return color;
          };

          for (let I of ndrange(this.iblGGXFiltered!.dimensions[0], this.iblGGXFiltered!.dimensions[1])) {
            let numLevels = this.iblGGXFiltered!.dimensions[2];
            for (let level of range(numLevels)) {
              let roughness = level / (numLevels - 1);
              //@ts-ignore
              let uv = I / (this.iblGGXFiltered.dimensions.slice(0, 2) - [1.0, 1.0]);
              let dir = this.uvToDir(uv);
              let filtered = filterGGX(dir, roughness);
              textureStore(this.iblGGXFiltered!, I.concat([level]), filtered.concat([1.0]));
            }
          }

          let computeLUT = (NdotV: number, roughness: number): vector => {
            let V: any = [Math.sqrt(1.0 - NdotV * NdotV), 0.0, NdotV];
            let N = [0.0, 0.0, 1.0];

            let A = 0.0;
            let B = 0.0;
            let C = 0.0;

            for (let i of range(kSampleCount)) {
              let xi = this.hammersley2d(i, kSampleCount);
              let importanceSample = getGGXImportanceSample(N, roughness, xi);
              let H: any = importanceSample.direction;
              // float pdf = importanceSample.w;
              //@ts-ignore
              let L = normalized(2.0 * H * dot(H, V) - V);

              let NdotL = saturate(L[2]);
              let NdotH = saturate(H[2]);
              let VdotH = saturate(dot(V, H));

              if (NdotL > 0.0) {
                let a2 = Math.pow(roughness, 4.0);
                let GGXV = NdotL * Math.sqrt(NdotV * NdotV * (1.0 - a2) + a2);
                let GGXL = NdotV * Math.sqrt(NdotL * NdotL * (1.0 - a2) + a2);
                let V_pdf = ((0.5 / (GGXV + GGXL)) * VdotH * NdotL) / NdotH;
                let Fc = Math.pow(1.0 - VdotH, 5.0);
                A += (1.0 - Fc) * V_pdf;
                B += Fc * V_pdf;
                C += 0.0;
              }
            }
            //@ts-ignore
            return [4.0 * A, 4.0 * B, 4.0 * 2.0 * Math.PI * C] / kSampleCount;
          };

          for (let I of ndrange(this.LUT!.dimensions[0], this.LUT!.dimensions[1])) {
            //@ts-ignore
            let uv: vector = I / (this.LUT.dimensions - [1.0, 1.0]);
            let texel = computeLUT(uv[0], uv[1]);
            textureStore(this.LUT!, I, texel.concat([1.0]));
          }
        },
        undefined
      );
      await prefilterKernel();
    }
  }

  async computeDrawBatches() {
    this.batchesDrawInfos = [];
    this.batchesDrawInstanceInfos = [];

    let textureFreeBatchDrawInfo: DrawInfo[] = [];
    let textureFreeBatchInstanceInfo: InstanceInfo[] = [];

    for (let i = 0; i < this.scene.materials.length; ++i) {
      let material = this.scene.materials[i];
      let thisMaterialDrawInfo: DrawInfo[] = [];
      let thisMaterialInstanceInfo: InstanceInfo[] = [];
      for (let nodeIndex = 0; nodeIndex < this.scene.nodes.length; ++nodeIndex) {
        let node = this.scene.nodes[nodeIndex];
        if (node.mesh >= 0) {
          let mesh = this.scene.meshes[node.mesh];
          for (let prim of mesh.primitives) {
            if (prim.materialID === i) {
              let drawInfo = new DrawInfo(
                prim.indexCount,
                1,
                prim.firstIndex,
                0,
                -1 // firstInstance, we'll fill this later
              );
              thisMaterialDrawInfo.push(drawInfo);
              let instanceInfo = new InstanceInfo(nodeIndex, i);
              thisMaterialInstanceInfo.push(instanceInfo);
            }
          }
        }
      }
      if (material.hasTexture()) {
        this.batchesDrawInfos.push(thisMaterialDrawInfo);
        this.batchesDrawInstanceInfos.push(thisMaterialInstanceInfo);
        this.batchInfos.push(new BatchInfo(i));
      } else {
        textureFreeBatchDrawInfo = textureFreeBatchDrawInfo.concat(thisMaterialDrawInfo);
        textureFreeBatchInstanceInfo = textureFreeBatchInstanceInfo.concat(thisMaterialInstanceInfo);
      }
    }
    if (textureFreeBatchDrawInfo.length > 0 && textureFreeBatchInstanceInfo.length > 0) {
      this.batchesDrawInfos.push(textureFreeBatchDrawInfo);
      this.batchesDrawInstanceInfos.push(textureFreeBatchInstanceInfo);
      this.batchInfos.push(new BatchInfo(-1)); // -1 stands for "this batch contains more than one (texture-free) materials"
    }
    for (let batch of this.batchesDrawInfos) {
      for (let i = 0; i < batch.length; ++i) {
        batch[i].firstInstance = i;
      }
    }

    this.batchesDrawInfoBuffers = [];
    for (let drawInfos of this.batchesDrawInfos) {
      let buffer = field(DrawInfo.getKernelType(), drawInfos.length);
      await buffer.fromArray(drawInfos);
      this.batchesDrawInfoBuffers.push(buffer);
    }

    this.batchesDrawInstanceInfoBuffers = [];
    for (let drawInstanceInfos of this.batchesDrawInstanceInfos) {
      let buffer = field(InstanceInfo.getKernelType(), drawInstanceInfos.length);
      await buffer.fromArray(drawInstanceInfos);
      this.batchesDrawInstanceInfoBuffers.push(buffer);
    }

    // shadow pass instance infos
    this.geometryOnlyDrawInfos = [];
    this.geometryOnlyDrawInstanceInfos = [];

    for (let nodeIndex = 0; nodeIndex < this.scene.nodes.length; ++nodeIndex) {
      let node = this.scene.nodes[nodeIndex];
      if (node.mesh >= 0) {
        let mesh = this.scene.meshes[node.mesh];
        for (let prim of mesh.primitives) {
          let firstInstance = this.geometryOnlyDrawInstanceInfos.length;
          let drawInfo = new DrawInfo(prim.indexCount, 1, prim.firstIndex, 0, firstInstance);
          this.geometryOnlyDrawInfos.push(drawInfo);
          let instanceInfo = new InstanceInfo(nodeIndex, prim.materialID);
          this.geometryOnlyDrawInstanceInfos.push(instanceInfo);
        }
      }
    }
    this.geometryOnlyDrawInfoBuffer = field(DrawInfo.getKernelType(), this.geometryOnlyDrawInfos.length);
    await this.geometryOnlyDrawInfoBuffer.fromArray(this.geometryOnlyDrawInfos);
    this.geometryOnlyDrawInstanceInfoBuffer = field(
      InstanceInfo.getKernelType(),
      this.geometryOnlyDrawInstanceInfos.length
    );
    await this.geometryOnlyDrawInstanceInfoBuffer.fromArray(this.geometryOnlyDrawInstanceInfos);
  }

  async render(camera: Camera) {
    let aspectRatio = this.htmlCanvas.width / this.htmlCanvas.height;
    camera.computeMatrices(aspectRatio);
    for (let i = 0; i < this.scene.lights.length; ++i) {
      let light = this.scene.lights[i];
      if (light.castsShadow) {
        this.shadowKernel(this.lightShadowMaps[i], light.shadow!);
      }
    }
    for (let i = 0; i < this.scene.iblShadows.length; ++i) {
      this.shadowKernel(this.iblShadowMaps[i], this.scene.iblShadows[i]);
    }
    this.zPrePassKernel(camera);
    this.gPrePassKernel(camera);
    this.renderKernel(camera);
    this.ssaoKernel(camera);
    this.ssaoBlurKernel();
    this.combineKernel();
    this.presentKernel(this.renderResultTexture);
    await sync();
  }
}
