import { Material } from "./Material";
import { getVertexAttribSetKernelType, VertexAttrib, VertexAttribSet } from "./Vertex";
import { SceneNode } from "./SceneNode";
import { Transform } from "./Transform";
import { LightInfo } from "./common/LightInfo";
import { GltfLoader } from "./loaders/GLTFLoader";
import { field } from "../api/Fields";
import { i32 } from "../api/Kernels";
export class Scene {
    constructor() {
        this.vertexAttribSet.set(VertexAttrib.Position);
        this.vertexAttribSet.set(VertexAttrib.Normal);
        this.vertexAttribSet.set(VertexAttrib.TexCoords0);
        this.nodes = [new SceneNode()];
        this.rootNode = 0;
    }
    vertices = [];
    indices = [];
    materials = [];
    nodes = [];
    rootNode;
    meshes = [];
    lights = [];
    ibl = undefined;
    iblIntensity = 1.0;
    iblShadows = [];
    iblBackgroundBlur = 0.0;
    vertexAttribSet = new VertexAttribSet(VertexAttrib.None);
    async getKernelData() {
        let vertexBuffer = field(getVertexAttribSetKernelType(this.vertexAttribSet), this.vertices.length);
        await vertexBuffer.fromArray(this.vertices);
        let indexBuffer = field(i32, this.indices.length);
        await indexBuffer.fromArray(this.indices);
        let materialInfoBuffer = field(new Material(0).getInfoKernelType(), this.materials.length);
        let infosHost = this.materials.map((mat) => mat.getInfo());
        await materialInfoBuffer.fromArray(infosHost);
        let nodesBuffer = field(SceneNode.getKernelType(), this.nodes.length);
        await nodesBuffer.fromArray(this.nodes);
        let lightsInfoBuffer = undefined;
        if (this.lights.length > 0) {
            lightsInfoBuffer = field(LightInfo.getKernelType(), this.lights.length);
            await lightsInfoBuffer.fromArray(this.lights);
        }
        return {
            vertexBuffer,
            indexBuffer,
            materialInfoBuffer,
            nodesBuffer,
            lightsInfoBuffer
        };
    }
    init() {
        this.computeGlobalTransforms();
    }
    computeGlobalTransforms() {
        let visit = (nodeIndex, parentGlobalTransform) => {
            let node = this.nodes[nodeIndex];
            node.globalTransform = parentGlobalTransform.mul(node.localTransform);
            for (let child of node.children) {
                visit(child, node.globalTransform);
            }
        };
        visit(this.rootNode, new Transform());
    }
    async add(scene, transform = new Transform()) {
        let nodeOffset = this.nodes.length;
        this.nodes = this.nodes.concat(scene.nodes);
        let vertexOffset = this.vertices.length;
        this.vertices = this.vertices.concat(scene.vertices);
        let indexOffset = this.indices.length;
        for (let i = 0; i < scene.indices.length; ++i) {
            scene.indices[i] += vertexOffset;
        }
        this.indices = this.indices.concat(scene.indices);
        let materialOffset = this.materials.length;
        this.materials = this.materials.concat(scene.materials);
        let meshOffset = this.meshes.length;
        this.meshes = this.meshes.concat(scene.meshes);
        scene.nodes[scene.rootNode].localTransform = transform;
        scene.nodes[scene.rootNode].parent = this.rootNode;
        let sceneRootCurrentId = scene.rootNode + nodeOffset;
        this.nodes[this.rootNode].children.push(sceneRootCurrentId);
        for (let node of scene.nodes) {
            if (node.parent !== -1) {
                node.parent = node.parent + nodeOffset;
            }
            node.children = node.children.map((id) => id + nodeOffset);
            if (node.mesh !== -1) {
                node.mesh += meshOffset;
            }
        }
        for (let mat of scene.materials) {
            mat.materialID += materialOffset;
        }
        for (let mesh of scene.meshes) {
            for (let prim of mesh.primitives) {
                prim.firstIndex += indexOffset;
                prim.materialID += materialOffset;
            }
        }
        this.init();
        return sceneRootCurrentId;
    }
    async addGLTF(url, transform = new Transform()) {
        let gltf = await GltfLoader.loadFromURL(url);
        return await this.add(gltf, transform);
    }
}
