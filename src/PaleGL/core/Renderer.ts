import {
    ActorTypes,
    BlendTypes,
    LightTypes,
    MAX_POINT_LIGHT_COUNT,
    MAX_SPOT_LIGHT_COUNT,
    PostProcessPassType,
    RenderQueueType,
    RenderTargetTypes,
    TextureDepthPrecisionType,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import { Stats } from '@/PaleGL/utilities/Stats';
import { Light } from '@/PaleGL/actors/Light';
import { Mesh } from '@/PaleGL/actors/Mesh';
import { Scene } from '@/PaleGL/core/Scene';
import { Camera, CameraRenderTargetType } from '@/PaleGL/actors/Camera';
import { Material } from '@/PaleGL/materials/Material';
import { Geometry } from '@/PaleGL/geometries/Geometry';
import { PostProcess } from '@/PaleGL/postprocess/PostProcess';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { GBufferRenderTargets } from '@/PaleGL/core/GBufferRenderTargets';
import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
import { Skybox } from '@/PaleGL/actors/Skybox';
import { DeferredShadingPass } from '@/PaleGL/postprocess/DeferredShadingPass';
import { SSAOPass } from '@/PaleGL/postprocess/SSAOPass';
import { SSRPass } from '@/PaleGL/postprocess/SSRPass';
import { ToneMappingPass } from '@/PaleGL/postprocess/ToneMappingPass';
import { BloomPass, BloomPassParameters } from '@/PaleGL/postprocess/BloomPass';
import { DepthOfFieldPass } from '@/PaleGL/postprocess/DepthOfFieldPass';
import { LightShaftPass } from '@/PaleGL/postprocess/LightShaftPass.ts';
import { VolumetricLightPass } from '@/PaleGL/postprocess/VolumetricLightPass.ts';
import { FogPass } from '@/PaleGL/postprocess/FogPass.ts';
import { DirectionalLight } from '@/PaleGL/actors/DirectionalLight.ts';
import { SpotLight } from '@/PaleGL/actors/SpotLight.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { Shader } from '@/PaleGL/core/Shader.ts';
import globalUniformBufferObjectVertexShader from '@/PaleGL/shaders/global-uniform-buffer-object-vertex.glsl';
import globalUniformBufferObjectFragmentShader from '@/PaleGL/shaders/global-uniform-buffer-object-fragment.glsl';
import { UniformBufferObject } from '@/PaleGL/core/UniformBufferObject.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import {
    UniformBufferObjectBlockData,
    UniformBufferObjectElementValueArray,
    UniformBufferObjectElementValueNoNeedsPadding,
    UniformBufferObjectStructArrayValue,
    UniformBufferObjectStructValue,
    UniformBufferObjectValue,
} from '@/PaleGL/core/Uniforms.ts';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { ChromaticAberrationPass } from '@/PaleGL/postprocess/ChromaticAberrationPass.ts';
import { VignettePass } from '@/PaleGL/postprocess/VignettePass.ts';
import { StreakPass } from '@/PaleGL/postprocess/StreakPass.ts';
import { FXAAPass } from '@/PaleGL/postprocess/FXAAPass.ts';
import { ScreenSpaceShadowPass } from '@/PaleGL/postprocess/ScreenSpaceShadowPass.ts';
import { PointLight } from '@/PaleGL/actors/PointLight.ts';
import { Texture } from '@/PaleGL/core/Texture.ts';
import { PostProcessVolume } from '@/PaleGL/actors/PostProcessVolume.ts';
import { GlitchPass } from '@/PaleGL/postprocess/GlitchPass.ts';
import { isDevelopment } from '@/PaleGL/utilities/envUtilities.ts';

type RenderMeshInfo = { actor: Mesh; materialIndex: number; queue: RenderQueueType };

type RenderMeshInfoEachQueue = {
    [key in RenderQueueType]: RenderMeshInfo[];
};

export type LightActors = {
    directionalLight: DirectionalLight | null;
    spotLights: SpotLight[];
    pointLights: PointLight[];
};

/**
 * TODO: shadow 用のuniform設定も一緒にされちゃうので出し分けたい
 * TODO: 渡す uniform の値、キャッシュできる気がする
 * TODO: directional light がないとき、spot lightがないときの対応
 * @param targetMaterial
 * @param lightActors
 * @param fallbackTexture
 */
export function applyLightShadowMapUniformValues(
    targetMaterial: Material,
    lightActors: LightActors,
    fallbackTexture: Texture
) {
    // directional light
    targetMaterial.uniforms.setValue(
        UniformNames.DirectionalLightShadowMap,
        lightActors.directionalLight && lightActors.directionalLight.shadowMap
            ? lightActors.directionalLight.shadowMap.read.depthTexture
            : fallbackTexture
    );

    // spotlights
    const spotLightShadowMaps = maton.range(MAX_SPOT_LIGHT_COUNT).map((i) => {
        const spotLight = lightActors.spotLights[i];
        return spotLight && spotLight.shadowMap ? spotLight.shadowMap.read.depthTexture : fallbackTexture;
    });
    targetMaterial.uniforms.setValue(UniformNames.SpotLightShadowMap, spotLightShadowMaps);
}

/**
 * post process volume の値を各passに適用
 * @param renderer
 * @param postProcessVolumeActor
 */
function applyPostProcessVolumeParameters(renderer: Renderer, postProcessVolumeActor: PostProcessVolume) {
    // bloom
    // renderer.bloomPass.updateParameters(postProcessVolumeActor.findParameter<BloomPassParameters>(PostProcessPassType.Bloom));
    const bloomParameter = postProcessVolumeActor.findParameter<BloomPassParameters>(PostProcessPassType.Bloom);
    if (bloomParameter) {
        renderer.bloomPass.updateParameters(bloomParameter);
    }
}

/**
 * 描画パイプライン的な役割
 * TODO: pass
 * - depth pre-pass
 * - g-buffer pass (color, normal, material info)
 * - ao pass
 * - shading pass
 * - post process pass
 * TODO:
 * - depth prepass 使わない場合。offscreen する時とか
 * TODO:
 * - offscreen rendering
 */
export class Renderer {
    // --------------------------------------------------------------
    // constructor
    // --------------------------------------------------------------

    /**
     *
     * @param gpu
     * @param canvas
     * @param pixelRatio
     */
    constructor({ gpu, canvas, pixelRatio = 1.5 }: { gpu: GPU; canvas: HTMLCanvasElement; pixelRatio: number }) {
        this.gpu = gpu;
        this.canvas = canvas;
        this.pixelRatio = pixelRatio;
        this._scenePostProcess = new PostProcess(this.screenQuadCamera);
        this._depthPrePassRenderTarget = new RenderTarget({
            gpu,
            type: RenderTargetTypes.Depth,
            width: 1,
            height: 1,
            name: 'depth pre-pass render target',
            depthPrecision: TextureDepthPrecisionType.High, // 低精度だとマッハバンドのような見た目になるので高精度にしておく
        });
        this._gBufferRenderTargets = new GBufferRenderTargets({
            gpu,
            width: 1,
            height: 1,
            name: 'g-buffer render target',
        });
        this._afterDeferredShadingRenderTarget = new RenderTarget({
            gpu,
            type: RenderTargetTypes.Empty,
            width: 1,
            height: 1,
            name: 'after g-buffer render target',
        });
        // console.log(this._afterDeferredShadingRenderTarget)
        this._copyDepthSourceRenderTarget = new RenderTarget({
            gpu,
            type: RenderTargetTypes.Empty,
            width: 1,
            height: 1,
            name: 'copy depth source render target',
            depthPrecision: TextureDepthPrecisionType.High, // 低精度だとマッハバンドのような見た目になるので高精度にしておく
        });
        this._copyDepthDestRenderTarget = new RenderTarget({
            gpu,
            type: RenderTargetTypes.Depth,
            width: 1,
            height: 1,
            name: 'copy depth dest render target',
            depthPrecision: TextureDepthPrecisionType.High, // 低精度だとマッハバンドのような見た目になるので高精度にしておく
        });

        this._screenSpaceShadowPass = new ScreenSpaceShadowPass({ gpu });
        this._ambientOcclusionPass = new SSAOPass({ gpu });
        this._deferredShadingPass = new DeferredShadingPass({ gpu });
        this._ssrPass = new SSRPass({ gpu });
        this._lightShaftPass = new LightShaftPass({ gpu });
        this._volumetricLightPass = new VolumetricLightPass({ gpu });
        this._fogPass = new FogPass({ gpu });

        this._depthOfFieldPass = new DepthOfFieldPass({ gpu });
        this._scenePostProcess.addPass(this._depthOfFieldPass);

        this._bloomPass = new BloomPass({
            gpu,
        });
        this._scenePostProcess.addPass(this._bloomPass);

        this._streakPass = new StreakPass({ gpu });
        this._scenePostProcess.addPass(this._streakPass);

        this._toneMappingPass = new ToneMappingPass({ gpu });
        this._scenePostProcess.addPass(this._toneMappingPass);

        this._chromaticAberrationPass = new ChromaticAberrationPass({ gpu });
        this._scenePostProcess.addPass(this._chromaticAberrationPass);

        this._vignettePass = new VignettePass({ gpu });
        this._scenePostProcess.addPass(this._vignettePass);

        this._glitchPass = new GlitchPass({ gpu });
        this._scenePostProcess.addPass(this._glitchPass);

        this._fxaaPass = new FXAAPass({ gpu });
        this._scenePostProcess.addPass(this._fxaaPass);

        //
        // initialize global uniform buffer objects
        //

        const uniformBufferObjectShader = new Shader({
            gpu,
            vertexShader: globalUniformBufferObjectVertexShader,
            fragmentShader: globalUniformBufferObjectFragmentShader,
        });

        const transformationsUniformBlockData = [
            {
                name: UniformNames.WorldMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.ViewMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.ProjectionMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.NormalMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.InverseWorldMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.ViewProjectionMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.InverseViewMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.InverseProjectionMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.InverseViewProjectionMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
            {
                name: UniformNames.TransposeInverseViewMatrix,
                type: UniformTypes.Matrix4,
                value: Matrix4.identity,
            },
        ];
        this.globalUniformBufferObjects.push({
            uniformBufferObject: this.gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.Transformations,
                transformationsUniformBlockData
            ),
            data: transformationsUniformBlockData,
        });

        const cameraUniformBufferData = [
            {
                name: UniformNames.ViewPosition,
                type: UniformTypes.Vector3,
                value: Vector3.zero,
            },
            {
                name: UniformNames.ViewDirection,
                type: UniformTypes.Vector3,
                value: Vector3.zero,
            },
            {
                name: UniformNames.CameraNear,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.CameraFar,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.CameraAspect,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.CameraFov,
                type: UniformTypes.Float,
                value: 0,
            },
        ];
        this.globalUniformBufferObjects.push({
            uniformBufferObject: this.gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.Camera,
                cameraUniformBufferData
            ),
            data: cameraUniformBufferData,
        });

        const directionalLightUniformBufferData = [
            {
                name: UniformNames.DirectionalLight,
                type: UniformTypes.Struct,
                value: [
                    {
                        name: UniformNames.LightDirection,
                        type: UniformTypes.Vector3,
                        value: Vector3.zero,
                    },
                    {
                        name: UniformNames.LightIntensity,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UniformNames.LightColor,
                        type: UniformTypes.Color,
                        value: Color.black,
                    },
                    {
                        name: UniformNames.ShadowMapProjectionMatrix,
                        type: UniformTypes.Matrix4,
                        value: Matrix4.identity,
                    },
                ],
            },
        ];
        this.globalUniformBufferObjects.push({
            uniformBufferObject: this.gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.DirectionalLight,
                directionalLightUniformBufferData
            ),
            data: directionalLightUniformBufferData,
        });

        const spotLightUniformBufferData = [
            {
                name: UniformNames.SpotLight,
                type: UniformTypes.StructArray,
                value: maton.range(MAX_SPOT_LIGHT_COUNT).map(() => [
                    {
                        name: UniformNames.LightColor,
                        type: UniformTypes.Color,
                        value: Color.black,
                    },
                    {
                        name: UniformNames.LightPosition,
                        type: UniformTypes.Vector3,
                        value: Vector3.zero,
                    },
                    {
                        name: UniformNames.LightDirection,
                        type: UniformTypes.Vector3,
                        value: Vector3.zero,
                    },
                    {
                        name: UniformNames.LightIntensity,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UniformNames.LightDistance,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UniformNames.LightAttenuation,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UniformNames.LightConeCos,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UniformNames.LightPenumbraCos,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UniformNames.ShadowMapProjectionMatrix,
                        type: UniformTypes.Matrix4,
                        value: Matrix4.identity,
                    },
                ]),
            },
        ];
        this.globalUniformBufferObjects.push({
            uniformBufferObject: this.gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.SpotLight,
                spotLightUniformBufferData
            ),
            data: spotLightUniformBufferData,
        });

        const pointLightUniformBufferData = [
            {
                name: UniformNames.PointLight,
                type: UniformTypes.StructArray,
                value: maton.range(MAX_POINT_LIGHT_COUNT).map(() => [
                    {
                        name: UniformNames.LightColor,
                        type: UniformTypes.Color,
                        value: Color.black,
                    },
                    {
                        name: UniformNames.LightPosition,
                        type: UniformTypes.Vector3,
                        value: Vector3.zero,
                    },
                    {
                        name: UniformNames.LightIntensity,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UniformNames.LightDistance,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UniformNames.LightAttenuation,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                ]),
            },
        ];
        this.globalUniformBufferObjects.push({
            uniformBufferObject: this.gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.PointLight,
                pointLightUniformBufferData
            ),
            data: pointLightUniformBufferData,
        });

        const timelineUniformBufferData = [
            {
                name: UniformNames.TimelineTime,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.TimelineDeltaTime,
                type: UniformTypes.Float,
                value: 0,
            },
        ];
        this.globalUniformBufferObjects.push({
            uniformBufferObject: this.gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.Timeline,
                timelineUniformBufferData
            ),
            data: timelineUniformBufferData,
        });

        const commonUniformBlockData = [
            {
                name: UniformNames.Time,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.DeltaTime,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: UniformNames.Viewport,
                type: UniformTypes.Vector4,
                value: Vector4.zero,
            },
        ];
        // TODO: 一番最初の要素としてpushするとなぜかエラーになる
        this.globalUniformBufferObjects.push({
            uniformBufferObject: this.gpu.createUniformBufferObject(
                uniformBufferObjectShader,
                UniformBlockNames.Common,
                commonUniformBlockData
            ),
            data: commonUniformBlockData,
        });

        // for debug
        console.log('===== global uniform buffer objects =====');
        console.log(this.globalUniformBufferObjects);
        console.log('=========================================');
    }

    // TODO: materialのstartの中でやりたい
    $checkNeedsBindUniformBufferObjectToMaterial(material: Material) {
        // mesh.materials.forEach((material) => {
        if (material.boundUniformBufferObjects) {
            return;
        }
        material.boundUniformBufferObjects = true;
        // for debug
        // console.log("[Renderer.$checkNeedsBindUniformBufferObjectToMaterial]", material.name)
        material.uniformBlockNames.forEach((blockName) => {
            const targetGlobalUniformBufferObject = this.globalUniformBufferObjects.find(
                ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
            );
            if (!targetGlobalUniformBufferObject) {
                return;
            }
            const blockIndex = this.gpu.bindUniformBlockAndGetBlockIndex(
                targetGlobalUniformBufferObject.uniformBufferObject,
                material.shader!,
                blockName
            );
            // for debug
            // console.log(
            //     material.name,
            //     'addUniformBlock',
            //     material.uniformBlockNames,
            //     targetUniformBufferObject.blockName,
            //     blockIndex
            // );
            material.uniforms.addUniformBlock(blockIndex, targetGlobalUniformBufferObject.uniformBufferObject, []);
        });
        // });
    }

    // --------------------------------------------------------------
    // public
    // --------------------------------------------------------------

    canvas;
    pixelRatio;
    globalUniformBufferObjects: { uniformBufferObject: UniformBufferObject; data: UniformBufferObjectBlockData }[] = [];

    get depthPrePassRenderTarget() {
        return this._depthPrePassRenderTarget;
    }

    get gBufferRenderTargets() {
        return this._gBufferRenderTargets;
    }

    get screenSpaceShadowPass() {
        return this._screenSpaceShadowPass;
    }

    get ambientOcclusionPass() {
        return this._ambientOcclusionPass;
    }

    get ssrPass() {
        return this._ssrPass;
    }

    get deferredShadingPass() {
        return this._deferredShadingPass;
    }

    get lightShaftPass() {
        return this._lightShaftPass;
    }

    get volumetricLightPass() {
        return this._volumetricLightPass;
    }

    get fogPass() {
        return this._fogPass;
    }

    get depthOfFieldPass() {
        return this._depthOfFieldPass;
    }

    get bloomPass() {
        return this._bloomPass;
    }

    get streakPass() {
        return this._streakPass;
    }

    get chromaticAberrationPass() {
        return this._chromaticAberrationPass;
    }

    get glitchPass() {
        return this._glitchPass;
    }

    get vignettePass() {
        return this._vignettePass;
    }

    get fxaaPass() {
        return this._fxaaPass;
    }

    /**
     *
     * @param realWidth
     * @param realHeight
     */
    setSize(realWidth: number, realHeight: number) {
        const w = Math.floor(realWidth);
        const h = Math.floor(realHeight);
        this.realWidth = w;
        this.realHeight = h;
        this.canvas.width = w;
        this.canvas.height = h;

        this.gpu.setSize(0, 0, w, h);

        // render targets
        this._depthPrePassRenderTarget.setSize(w, h);
        this._gBufferRenderTargets.setSize(w, h);
        this._afterDeferredShadingRenderTarget.setSize(w, h);
        this._copyDepthSourceRenderTarget.setSize(w, h);
        this._copyDepthDestRenderTarget.setSize(w, h);
        // passes
        this._screenSpaceShadowPass.setSize(w, h);
        this._ambientOcclusionPass.setSize(w, h);
        this._deferredShadingPass.setSize(w, h);
        this._ssrPass.setSize(w, h);
        this._lightShaftPass.setSize(w, h);
        this._volumetricLightPass.setSize(w, h);
        this._fogPass.setSize(w, h);
        this._depthOfFieldPass.setSize(w, h);
        this._bloomPass.setSize(w, h);
        this._streakPass.setSize(w, h);
        this._toneMappingPass.setSize(w, h);
        this._chromaticAberrationPass.setSize(w, h);
        this._glitchPass.setSize(w, h);
        this._vignettePass.setSize(w, h);
        this._fxaaPass.setSize(w, h);
    }

    renderTarget: CameraRenderTargetType | null = null;
    clearColorDirtyFlag = false;

    /**
     *
     * @param renderTarget
     * @param clearColor
     * @param clearDepth
     */
    // TODO: 本当はclearcolorの色も渡せるとよい
    setRenderTarget(renderTarget: CameraRenderTargetType, clearColor: boolean = false, clearDepth: boolean = false) {
        if (renderTarget) {
            this.renderTarget = renderTarget;
            this.gpu.setFramebuffer(renderTarget.framebuffer);
            this.gpu.setSize(0, 0, renderTarget.width, renderTarget.height);
        } else {
            this.renderTarget = null;
            this.gpu.setFramebuffer(null);
            this.gpu.setSize(0, 0, this.realWidth, this.realHeight);
        }
        if (clearColor) {
            this.gpu.clearColor(0, 0, 0, 0);
            this.clearColorDirtyFlag = true;
        } else {
            this.clearColorDirtyFlag = false;
        }
        if (clearDepth) {
            this.gpu.clearDepth(1, 1, 1, 1);
        }
    }

    /**
     *
     */
    flush() {
        this.gpu.flush();
    }

    /**
     *
     * @param r
     * @param g
     * @param b
     * @param a
     */
    // TODO: pass Color
    clearColor(r: number, g: number, b: number, a: number) {
        this.gpu.clearColor(r, g, b, a);
    }

    clearDepth(r: number, g: number, b: number, a: number) {
        this.gpu.clearDepth(r, g, b, a);
    }

    beforeRender(time: number, deltaTime: number) {
        this.updateCommonUniforms({ time, deltaTime });
    }

    /**
     *
     * @param scene
     * @param camera
     * @param time
     * @param deltaTime
     * @param onBeforePostProcess
     */
    // render(scene: Scene, camera: Camera, {useShadowPass = true, clearScene = true}) {
    render(
        scene: Scene,
        camera: Camera,
        {
            time,
            onBeforePostProcess,
        }: {
            time: number;
            timelineTime: number;
            timelineDeltaTime: number;
            onBeforePostProcess?: () => void;
        }
    ) {
        // ------------------------------------------------------------------------------
        // transform feedback
        // ------------------------------------------------------------------------------

        // ------------------------------------------------------------------------------
        // common uniform block object
        // ------------------------------------------------------------------------------

        // ------------------------------------------------------------------------------
        // setup render mesh infos
        // TODO: depth sort
        // ------------------------------------------------------------------------------

        const renderMeshInfoEachQueue: RenderMeshInfoEachQueue = {
            [RenderQueueType.Skybox]: [],
            [RenderQueueType.Opaque]: [],
            [RenderQueueType.AlphaTest]: [],
            [RenderQueueType.Transparent]: [],
        };
        const lightActors: LightActors = {
            directionalLight: null,
            spotLights: [],
            pointLights: [],
        };

        let postProcessVolumeActor: PostProcessVolume | null = null;

        // build render mesh info each queue
        scene.traverse((actor) => {
            switch (actor.type) {
                case ActorTypes.Skybox:
                    renderMeshInfoEachQueue[RenderQueueType.Skybox].push(
                        this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.Skybox)
                    );
                    // TODO: skyboxの中で処理したい
                    // actor.transform.parent = camera.transform;
                    return;
                case ActorTypes.Mesh:
                case ActorTypes.SkinnedMesh:
                    if (!(actor as Mesh).renderEnabled) {
                        // skip
                        return;
                    }
                    (actor as Mesh).materials.forEach((material, i) => {
                        // if (!material.canRender) {
                        //     return;
                        // }
                        if (material.alphaTest) {
                            renderMeshInfoEachQueue[RenderQueueType.AlphaTest].push(
                                this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.AlphaTest, i)
                            );
                            return;
                        }
                        switch (material.blendType) {
                            case BlendTypes.Opaque:
                                renderMeshInfoEachQueue[RenderQueueType.Opaque].push(
                                    this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.Opaque, i)
                                );
                                return;
                            case BlendTypes.Transparent:
                            case BlendTypes.Additive:
                                renderMeshInfoEachQueue[RenderQueueType.Transparent].push(
                                    this.buildRenderMeshInfo(actor as Mesh, RenderQueueType.Transparent, i)
                                );
                                return;
                            default:
                                console.error('[Renderer.render] invalid blend type');
                        }
                    });
                    break;

                case ActorTypes.Light:
                    if (actor.enabled) {
                        const light = actor as Light;
                        switch (light.lightType) {
                            case LightTypes.Directional:
                                lightActors.directionalLight = light as DirectionalLight;
                                break;
                            case LightTypes.Spot:
                                lightActors.spotLights.push(light as SpotLight);
                                break;
                            case LightTypes.Point:
                                lightActors.pointLights.push(light as PointLight);
                                break;
                        }
                    }
                    break;

                case ActorTypes.PostProcessVolume:
                    postProcessVolumeActor = actor as PostProcessVolume;
                    break;
            }
        });

        // sort by render queue
        const sortRenderQueueCompareFunc = (a: RenderMeshInfo, b: RenderMeshInfo) =>
            a.actor.materials[a.materialIndex].renderQueue - b.actor.materials[b.materialIndex].renderQueue;

        // all mesh infos
        const sortedRenderMeshInfos: RenderMeshInfo[] = Object.keys(renderMeshInfoEachQueue)
            .map((key) => {
                const renderQueueType = key as RenderQueueType;
                const info = renderMeshInfoEachQueue[renderQueueType];
                return info.sort(sortRenderQueueCompareFunc);
            })
            .flat()
            .filter(({ actor }) => actor.enabled);

        // override postprocess parameters
        if (postProcessVolumeActor) {
            applyPostProcessVolumeParameters(this, postProcessVolumeActor);
        }

        //
        // TODO: depth sort
        //

        // skybox
        const sortedSkyboxRenderMeshInfos: RenderMeshInfo[] = sortedRenderMeshInfos.filter((renderMeshInfo) => {
            return renderMeshInfo.queue === RenderQueueType.Skybox;
        });

        // base pass mesh infos
        const sortedBasePassRenderMeshInfos: RenderMeshInfo[] = sortedRenderMeshInfos.filter((renderMeshInfo) => {
            return (
                renderMeshInfo.queue === RenderQueueType.Skybox ||
                renderMeshInfo.queue === RenderQueueType.Opaque ||
                renderMeshInfo.queue === RenderQueueType.AlphaTest
            );
        });
        sortedBasePassRenderMeshInfos.sort((a, b) => {
            const al = Vector3.subVectors(camera.transform.position, a.actor.transform.position).magnitude;
            const bl = Vector3.subVectors(camera.transform.position, b.actor.transform.position).magnitude;
            return al < bl ? -1 : 1;
        })

        // transparent mesh infos
        const sortedTransparentRenderMeshInfos: RenderMeshInfo[] = sortedRenderMeshInfos.filter(
            (renderMeshInfo) => renderMeshInfo.queue === RenderQueueType.Transparent
        );
        sortedTransparentRenderMeshInfos.sort((a, b) => {
            const al = Vector3.subVectors(camera.transform.position, a.actor.transform.position).magnitude;
            const bl = Vector3.subVectors(camera.transform.position, b.actor.transform.position).magnitude;
            return al > bl ? -1 : 1;
        })

        // ------------------------------------------------------------------------------
        // update common uniforms
        // ------------------------------------------------------------------------------

        // this.updateCommonUniforms({ time, deltaTime });
        // TODO: このままだと directional-light がなくなったときも directional-light が残ることになる
        if (lightActors.directionalLight) {
            this.$updateDirectionalLightUniforms(lightActors.directionalLight);
        }
        // TODO: このままだと spot-light がなくなったときも spot-light が残ることになる
        if (lightActors.spotLights.length > 0) {
            this.$updateSpotLightsUniforms(lightActors.spotLights);
        }
        // TODO: このままだと point-light がなくなったときも point-light が残ることになる
        if (lightActors.pointLights.length > 0) {
            this.$updatePointLightsUniforms(lightActors.pointLights);
        }

        // ------------------------------------------------------------------------------
        // depth pre-pass
        // ------------------------------------------------------------------------------

        const depthPrePassRenderMeshInfos = sortedBasePassRenderMeshInfos.filter(({ actor }) => {
            if (actor.type === ActorTypes.Skybox) {
                return false;
            }
            return actor;
        });
        depthPrePassRenderMeshInfos.sort((a, b) => {
            const al = Vector3.subVectors(camera.transform.position, a.actor.transform.position).magnitude;
            const bl = Vector3.subVectors(camera.transform.position, b.actor.transform.position).magnitude;
            return al < bl ? -1 : 1;
        });
        this.depthPrePass(depthPrePassRenderMeshInfos, camera);

        // ------------------------------------------------------------------------------
        // g-buffer opaque pass
        // ------------------------------------------------------------------------------

        this.scenePass(sortedBasePassRenderMeshInfos, camera);

        // ------------------------------------------------------------------------------
        // shadow pass
        // ------------------------------------------------------------------------------

        // cast shadow 用のライト管理は配列にしちゃう
        const castShadowLightActors: Light[] = [];
        if (lightActors.directionalLight) {
            castShadowLightActors.push(lightActors.directionalLight);
        }
        lightActors.spotLights.forEach((light) => {
            if (light.castShadow) {
                castShadowLightActors.push(light);
            }
        });

        if (castShadowLightActors.length > 0) {
            const castShadowRenderMeshInfos = sortedBasePassRenderMeshInfos.filter(({ actor }) => {
                if (actor.type === ActorTypes.Skybox) {
                    return false;
                }
                return actor.castShadow;
            });
            this.shadowPass(castShadowLightActors, castShadowRenderMeshInfos);
        }

        // ------------------------------------------------------------------------------
        // screen space shadow pass
        // ------------------------------------------------------------------------------

        PostProcess.renderPass({
            pass: this._screenSpaceShadowPass,
            renderer: this,
            targetCamera: camera,
            gpu: this.gpu,
            camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: null,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });

        // ------------------------------------------------------------------------------
        // ambient occlusion pass
        // ------------------------------------------------------------------------------

        PostProcess.renderPass({
            pass: this._ambientOcclusionPass,
            renderer: this,
            targetCamera: camera,
            gpu: this.gpu,
            camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: null,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });

        // ------------------------------------------------------------------------------
        // deferred lighting pass
        // ------------------------------------------------------------------------------

        // update cubemap to deferred lighting pass
        // TODO: skyboxは一個だけ想定のいいはず
        sortedSkyboxRenderMeshInfos.forEach((skyboxRenderMeshInfo) => {
            const skyboxActor = skyboxRenderMeshInfo.actor as Skybox;
            this._deferredShadingPass.updateSkyboxUniforms(skyboxActor);
        });

        applyLightShadowMapUniformValues(this._deferredShadingPass.material, lightActors, this.gpu.dummyTextureBlack);

        // set sss texture
        this._deferredShadingPass.material.uniforms.setValue(
            'uScreenSpaceShadowTexture',
            this._screenSpaceShadowPass.renderTarget.read.texture
        );

        // set ao texture
        this._deferredShadingPass.material.uniforms.setValue(
            'uAmbientOcclusionTexture',
            this._ambientOcclusionPass.renderTarget.read.texture
        );

        PostProcess.renderPass({
            pass: this._deferredShadingPass,
            renderer: this,
            targetCamera: camera,
            gpu: this.gpu,
            camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: null,
            isLastPass: false,
            time, // TODO: engineから渡したい
            lightActors,
        });

        // ------------------------------------------------------------------------------
        // ssr pass
        // ------------------------------------------------------------------------------

        PostProcess.renderPass({
            pass: this._ssrPass,
            renderer: this,
            targetCamera: camera,
            gpu: this.gpu,
            camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            prevRenderTarget: this._deferredShadingPass.renderTarget,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });

        // ------------------------------------------------------------------------------
        // light shaft pass
        // ------------------------------------------------------------------------------

        // PostProcess.updatePassMaterial({
        //     pass: this._lightShaftPass,
        //     renderer: this,
        //     targetCamera: this._scenePostProcess.postProcessCamera,
        //     time,
        //     lightActors,
        // });

        // this._lightShaftPass.materials.forEach((mat) => {
        //     mat.updateUniform(
        //         UniformNames.DepthTexture,
        //         this._depthPrePassRenderTarget.depthTexture
        //         // this._copyDepthDestRenderTarget.depthTexture
        //     );
        // });

        if (lightActors.directionalLight) {
            this._lightShaftPass.setDirectionalLight(lightActors.directionalLight);
            PostProcess.renderPass({
                pass: this._lightShaftPass,
                renderer: this,
                targetCamera: camera,
                gpu: this.gpu,
                camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
                prevRenderTarget: this._deferredShadingPass.renderTarget,
                isLastPass: false,
                time, // TODO: engineから渡したい
            });
        } else {
            // TODO: directional light ないときの対応。黒く塗りたい
        }

        // ------------------------------------------------------------------------------
        // volumetric light pass
        // ------------------------------------------------------------------------------

        this._volumetricLightPass.setSpotLights(lightActors.spotLights);
        if (lightActors.spotLights.length > 0) {
            PostProcess.renderPass({
                pass: this._volumetricLightPass,
                renderer: this,
                targetCamera: camera,
                gpu: this.gpu,
                camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
                prevRenderTarget: this._deferredShadingPass.renderTarget,
                isLastPass: false,
                time, // TODO: engineから渡したい
                // lightActors,
            });
        } else {
            // TODO: spot light ないときの対応。黒く塗りたい
        }
        // return;

        // ------------------------------------------------------------------------------
        // height fog pass
        // ------------------------------------------------------------------------------

        this._fogPass.setLightShaftMap(this._lightShaftPass.renderTarget);
        this._fogPass.setVolumetricLightMap(this._volumetricLightPass.renderTarget);
        this._fogPass.setScreenSpaceShadowMap(this._screenSpaceShadowPass.renderTarget);

        PostProcess.renderPass({
            pass: this._fogPass,
            renderer: this,
            targetCamera: camera,
            gpu: this.gpu,
            camera: this._scenePostProcess.postProcessCamera, // TODO: いい感じにfullscreenquadなcameraを生成して渡したい
            // prevRenderTarget: this._deferredShadingPass.renderTarget,
            prevRenderTarget: this._ssrPass.renderTarget,
            isLastPass: false,
            time, // TODO: engineから渡したい
            // lightActors,
        });
        // return;

        // ------------------------------------------------------------------------------
        // transparent pass
        // ------------------------------------------------------------------------------

        // TODO: 直前のパスを明示的に指定する必要があるのはめんどうなのでうまいこと管理したい
        this._afterDeferredShadingRenderTarget.setTexture(this._fogPass.renderTarget.read.texture!);

        // pattern1: g-buffer depth
        // this._afterDeferredShadingRenderTarget.setDepthTexture(this._gBufferRenderTargets.depthTexture!);
        // pattern2: depth prepass
        this._afterDeferredShadingRenderTarget.setDepthTexture(this._depthPrePassRenderTarget.depthTexture!);

        this.copyDepthTexture();

        // TODO: set depth to transparent meshes
        sortedTransparentRenderMeshInfos.forEach((renderMeshInfo) => {
            renderMeshInfo.actor.material.uniforms.setValue(
                UniformNames.DepthTexture,
                this._copyDepthDestRenderTarget.depthTexture
            );
        });

        this.setRenderTarget(this._afterDeferredShadingRenderTarget.write);

        this.$transparentPass(sortedTransparentRenderMeshInfos, camera, lightActors);

        // ------------------------------------------------------------------------------
        // full screen pass
        // TODO: mainCameraかつcameraにpostProcessがあるときの対応
        // ------------------------------------------------------------------------------

        if (onBeforePostProcess) {
            onBeforePostProcess();
        }

        if (!this._scenePostProcess.hasEnabledPass) {
            // 何もenabledがないのはおかしい. tonemappingは最低限有効化されていないとおかしい(HDRなので)
            console.error('invalid postprocess');
        }

        // console.log("--------- postprocess pass ---------");

        let prevRenderTarget: RenderTarget = this._afterDeferredShadingRenderTarget;
        const isCameraLastPassAndHasNotPostProcess = !camera.renderTarget && !camera.hasEnabledPostProcessPass;
        this._scenePostProcess.update();
        this._scenePostProcess.render({
            gpu: this.gpu,
            renderer: this,
            prevRenderTarget,
            gBufferRenderTargets: this._gBufferRenderTargets,
            targetCamera: camera,
            time, // TODO: engineから渡したい
            isCameraLastPass: isCameraLastPassAndHasNotPostProcess,
            // lightActors,
        });

        if (isCameraLastPassAndHasNotPostProcess) {
            return;
        }

        prevRenderTarget = this._scenePostProcess.lastRenderTarget!;

        if (camera.hasEnabledPostProcessPass) {
            camera.postProcess?.update();
            camera.postProcess?.render({
                gpu: this.gpu,
                renderer: this,
                prevRenderTarget,
                // tone mapping 挟む場合
                // prevRenderTarget: this._toneMappingPass.renderTarget,
                gBufferRenderTargets: this._gBufferRenderTargets,
                targetCamera: camera,
                time, // TODO: engineから渡したい
                isCameraLastPass: !camera.renderTarget,
                lightActors,
            });
        }
    }

    /**
     *
     * @param geometry
     * @param material
     */
    renderMesh(geometry: Geometry, material: Material) {
        geometry.update();

        if (isDevelopment()) {
            if (this.stats) {
                this.stats.addDrawVertexCount(geometry);
                this.stats.incrementDrawCall();
            }
        }

        // vertex
        this.gpu.setVertexArrayObject(geometry.vertexArrayObject);
        // material
        if (!material.shader) {
            console.error('invalid material shader');
            return;
        }
        this.gpu.setShader(material.shader);
        // uniforms
        this.gpu.setUniforms(material.uniforms);

        // setup depth write (depth mask)
        let depthWrite;
        if (material.depthWrite !== null) {
            depthWrite = material.depthWrite;
        } else {
            switch (material.blendType) {
                case BlendTypes.Opaque:
                    depthWrite = true;
                    break;
                case BlendTypes.Transparent:
                case BlendTypes.Additive:
                    depthWrite = false;
                    break;
                default:
                    console.error('invalid depth write');
                    return;
            }
        }

        // setup depth test
        const depthTest = !!material.depthTest;

        // depth func type
        const depthFuncType = material.depthFuncType;

        // draw
        this.gpu.draw(
            geometry.drawCount,
            material.primitiveType,
            depthTest,
            depthWrite,
            depthFuncType,
            material.blendType,
            material.faceSide,
            geometry.instanceCount
        );
    }

    // --------------------------------------------------------------
    // private
    // --------------------------------------------------------------

    private gpu;
    realWidth: number = 1;
    realHeight: number = 1;
    stats: Stats | null = null;
    private _scenePostProcess: PostProcess;
    // internal cmmera
    private screenQuadCamera: Camera = OrthographicCamera.CreateFullQuadOrthographicCamera();
    // render targets
    private _depthPrePassRenderTarget: RenderTarget;
    private _gBufferRenderTargets: GBufferRenderTargets;
    // private _ambientOcclusionRenderTarget: RenderTarget;
    private _afterDeferredShadingRenderTarget: RenderTarget;
    private _copyDepthSourceRenderTarget: RenderTarget;
    private _copyDepthDestRenderTarget: RenderTarget;
    // pass
    private _screenSpaceShadowPass: ScreenSpaceShadowPass;
    private _ambientOcclusionPass: SSAOPass;
    private _deferredShadingPass: DeferredShadingPass;
    private _ssrPass: SSRPass;
    private _lightShaftPass: LightShaftPass;
    private _volumetricLightPass: VolumetricLightPass;
    private _fogPass: FogPass;
    private _depthOfFieldPass: DepthOfFieldPass;
    private _bloomPass: BloomPass;
    private _streakPass: StreakPass;

    private _toneMappingPass: ToneMappingPass;
    private _chromaticAberrationPass: ChromaticAberrationPass;
    private _glitchPass: GlitchPass;
    private _vignettePass: VignettePass;
    private _fxaaPass: FXAAPass;

    /**
     *
     * @param actor
     * @param materialIndex
     * @private
     */
    private buildRenderMeshInfo(actor: Mesh, queue: RenderQueueType, materialIndex: number = 0): RenderMeshInfo {
        return {
            actor,
            queue,
            materialIndex,
        };
    }

    // setUniformBlockData() {}

    /**
     * uniform block の変数を更新
     * @param blockName
     * @param uniformName
     * @param value
     * @private
     */
    private setUniformBlockValue(blockName: string, uniformName: string, value: UniformBufferObjectValue) {
        // private setUniformBlockData(blockName: string, uniformBufferObjectBlockData: UniformBufferObjectBlockData) {
        // private updateUniformBlock(blockName: string) {
        // const setUniformValueInternal = (type: UniformTypes, name: string, v: UniformValue) => {};

        // const a: UniformValue;

        // const targetUniformBufferObject = this.globalUniformBufferObjects.find((globalUniformBufferObject) => {
        //     return globalUniformBufferObject.blockName === blockName;
        // });

        // if (targetUniformBufferObject) {
        // }

        // if(typeof(value) === 'number') {
        //     console.log(blockName, uniformName, value);
        // }

        const targetGlobalUniformBufferObject = this.globalUniformBufferObjects.find(
            ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
        );
        if (!targetGlobalUniformBufferObject) {
            console.error(`[Renderer.setUniformBlockData] invalid uniform block object: ${blockName}`);
            return;
        }

        // const targetBlock = targetUbo.data.find((block) => block.name === uniformName);

        // if (!targetBlock) {
        //     console.error(`[Renderer.setUniformBlockData] invalid uniform block data: ${uniformName}`);
        //     return;
        // }

        const targetUbo = targetGlobalUniformBufferObject.uniformBufferObject;

        const targetUniformData = targetGlobalUniformBufferObject.data.find((d) => {
            return d.name === uniformName;
        });

        if (!targetUniformData) {
            console.error(`[Renderer.setUniformBlockData] invalid uniform name: ${uniformName}`);
            return;
        }

        targetUbo.updateUniformValue(uniformName, targetUniformData.type, value);

        // const getStructValue = (value: UniformStructValue) => {
        //     const data: number[] = [];
        //     value.forEach((v) => {
        //         switch (v.type) {
        //             case UniformTypes.Float:
        //             case UniformTypes.Int:
        //                 data.push(v.value as number);
        //                 data.push(0);
        //                 data.push(0);
        //                 data.push(0);
        //                 break;
        //             case UniformTypes.Bool:
        //                 data.push((v.value as boolean) ? 1 : 0);
        //                 data.push(0);
        //                 data.push(0);
        //                 data.push(0);
        //                 break;
        //             default:
        //                 data.push(...(v.value as Vector2 | Vector3 | Vector4 | Matrix4 | Color).e);
        //         }
        //     });
        //     return data;
        // };

        // // targetGlobalUniformBufferObject.data.forEach((targetBlock) => {
        // // const uniformName = targetBlock.name;
        // // const value = targetBlock.value;
        // // switch (targetBlock.type) {
        // switch (targetUniformData.type) {
        //     // TODO: update struct
        //     case UniformTypes.Struct:
        //     case UniformTypes.StructArray:
        //         if (Array.isArray(value)) {
        //             const data: number[] = [];
        //             value.forEach((v) => {
        //                 data.push(...getStructValue(v as UniformStructValue));
        //             });
        //             targetUbo.updateBufferData(uniformName, new Float32Array(data));
        //         } else {
        //             const data = getStructValue(value as unknown as UniformStructValue);
        //             targetUbo.updateBufferData(uniformName, new Float32Array(data));
        //         }
        //         break;
        //     default:
        //         if (Array.isArray(value)) {
        //             const data: number[] = [];
        //             value.forEach((v) => {
        //                 if (typeof v === 'number') {
        //                     data.push(v);
        //                     data.push(0);
        //                     data.push(0);
        //                     data.push(0);
        //                 } else {
        //                     data.push(...(v as Vector2 | Vector3 | Vector4 | Matrix4 | Color).e);
        //                 }
        //             });
        //             targetUbo.updateBufferData(uniformName, new Float32Array(data));
        //         } else {
        //             targetUbo.updateBufferData(
        //                 uniformName,
        //                 typeof value === 'number'
        //                     ? new Float32Array([value])
        //                     : (value as Vector2 | Vector3 | Vector4 | Matrix4 | Color).e
        //             );
        //         }
        //         break;
        // }
        // // });
    }

    /**
     *
     * @param actor
     * @param camera
     */
    // updateUniformBlockTransformations(actor: Actor, camera: Camera) {
    //     this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.WorldMatrix, actor.transform.worldMatrix);
    //     this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.ViewMatrix, camera.viewMatrix);
    //     this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.ProjectionMatrix, camera.projectionMatrix);
    //     // this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.NormalMatrix, actor.transform.inverseWorldMatrix);
    //     // this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.ViewPosition, camera.transform.worldMatrix.position);
    //     // depthMaterial.uniforms.setValue(UniformNames.ViewPosition, camera.transform.worldMatrix.position);
    // }

    /**
     *
     * @param depthPrePassRenderMeshInfos
     * @param camera
     * @private
     */
    private depthPrePass(depthPrePassRenderMeshInfos: RenderMeshInfo[], camera: Camera) {
        // console.log("--------- depth pre pass ---------");

        this.setRenderTarget(this._depthPrePassRenderTarget, false, true);
        // this.gpu.clearDepth(0, 0, 0, 1);

        // this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.ViewMatrix, camera.viewMatrix);
        // this.setUniformBlockValue(
        //     UniformBlockNames.Transformations,
        //     UniformNames.ProjectionMatrix,
        //     camera.projectionMatrix
        // );
        this.updateCameraUniforms(camera);

        depthPrePassRenderMeshInfos.forEach(({ actor }) => {
            this.updateActorTransformUniforms(actor);

            actor.depthMaterials.forEach((depthMaterial, i) => {
                if (!depthMaterial) {
                    console.error('[Renderer.depthPrePass] invalid depth material');
                    return;
                }

                if (!depthMaterial.canRender) {
                    return;
                }

                if (actor.materials[i].skipDepthPrePass) {
                    return;
                }

                this.renderMesh(actor.geometry, depthMaterial);

                if (isDevelopment()) {
                    if (this.stats) {
                        this.stats.addPassInfo('depth pre pass', actor.name, actor.geometry);
                    }
                }
            });
        });
    }

    /**
     *
     * @private
     */
    private copyDepthTexture() {
        this._copyDepthSourceRenderTarget.setDepthTexture(this._depthPrePassRenderTarget.depthTexture!);
        RenderTarget.blitDepth({
            gpu: this.gpu,
            sourceRenderTarget: this._copyDepthSourceRenderTarget,
            destRenderTarget: this._copyDepthDestRenderTarget,
            width: this.realWidth,
            height: this.realHeight,
        });
    }

    /**
     *
     * @param castShadowLightActors
     * @param castShadowRenderMeshInfos
     * @private
     */
    private shadowPass(castShadowLightActors: Light[], castShadowRenderMeshInfos: RenderMeshInfo[]) {
        // console.log("--------- shadow pass ---------");

        castShadowLightActors.forEach((lightActor) => {
            if (!lightActor.shadowMap) {
                console.error('invalid shadow pass');
                return;
            }
            if (!lightActor.shadowCamera) {
                console.error('invalid shadow camera');
                return;
            }
            this.setRenderTarget(lightActor.shadowMap.write, false, true);
            // this.clear(0, 0, 0, 1);
            // this.gpu.clearDepth(0, 0, 0, 1);

            if (castShadowRenderMeshInfos.length < 1) {
                return;
            }

            this.updateCameraUniforms(lightActor.shadowCamera);

            castShadowRenderMeshInfos.forEach(({ actor }) => {
                // TODO: material 側でやった方がよい？
                this.updateActorTransformUniforms(actor);

                actor.updateDepthMaterial({ camera: lightActor.shadowCamera! });

                actor.depthMaterials.forEach((depthMaterial) => {
                    // TODO: material 側でやった方がよい？
                    if (!depthMaterial) {
                        console.error('invalid target material');
                        return;
                    }

                    if (!depthMaterial.canRender) {
                        return;
                    }

                    depthMaterial.uniforms.setValue(
                        UniformNames.DepthTexture,
                        this._copyDepthDestRenderTarget.depthTexture
                    );

                    this.renderMesh(actor.geometry, depthMaterial);
                    if (isDevelopment()) {
                        if (this.stats) {
                            this.stats.addPassInfo('shadow pass', actor.name, actor.geometry);
                        }
                    }
                });
            });
        });
    }

    /**
     *
     * @param sortedRenderMeshInfos
     * @param camera
     * @private
     */
    private scenePass(
        sortedRenderMeshInfos: RenderMeshInfo[],
        camera: Camera
        // lightActors: LightActors
        // clear: boolean = true
    ) {
        // console.log("--------- scene pass ---------");

        // NOTE: DepthTextureはあるはず
        this._gBufferRenderTargets.setDepthTexture(this._depthPrePassRenderTarget.depthTexture!);

        this.setRenderTarget(this._gBufferRenderTargets.write, true);

        // TODO: depth prepass しない場合は必要
        // if (clear) {
        //     this.clear(camera.clearColor.x, camera.clearColor.y, camera.clearColor.z, camera.clearColor.w);
        // }

        this.updateCameraUniforms(camera);

        sortedRenderMeshInfos.forEach(({ actor, materialIndex }) => {
            switch (actor.type) {
                case ActorTypes.Skybox:
                    if (!(actor as Skybox).renderMesh) {
                        return;
                    }
                    // TODO: skyboxのupdateTransformが2回走っちゃうので、sceneかカメラに持たせて特別扱いさせたい
                    // TODO: engineでやるべき
                    actor.updateTransform(camera);
                    break;
            }
            
            const targetMaterial = actor.materials[materialIndex];
            
            if(!targetMaterial.canRender) {
                return;
            }

            // pre-passしてないmaterialの場合はdepthをcopy.
            // pre-passしてないmaterialが存在する度にdepthをcopyする必要があるので、使用は最小限にとどめる（raymarch以外では使わないなど）
            if (targetMaterial.skipDepthPrePass) {
                this.setRenderTarget(null, false, false);
                this.copyDepthTexture();
                this.setRenderTarget(this._gBufferRenderTargets.write, false, false);
            }
            
            // TODO: material 側でやった方がよい？
            this.updateActorTransformUniforms(actor);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            targetMaterial.uniforms.setValue(UniformNames.DepthTexture, this._copyDepthDestRenderTarget.depthTexture!);

            // TODO:
            // - light actor の中で lightの種類別に処理を分ける
            // - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意
            // lightActors.forEach((light) => {
            //     light.applyUniformsValues(targetMaterial);
            // });
            // TODO: g-bufferの時にはlightのuniformsを設定しなくて大丈夫になったのでいらないはず
            // applyLightShadowMapUniformValues(targetMaterial, lightActors);

            actor.updateMaterial({ camera });

            this.renderMesh(actor.geometry, targetMaterial);

            if (isDevelopment()) {
                if (this.stats) {
                    this.stats.addPassInfo('scene pass', actor.name, actor.geometry);
                }
            }
        });
    }

    /**
     *
     * @param actor
     */
    updateActorTransformUniforms(actor: Actor) {
        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.WorldMatrix,
            actor.transform.worldMatrix
        );
        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.InverseWorldMatrix,
            actor.transform.inverseWorldMatrix
        );
        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.NormalMatrix,
            actor.transform.normalMatrix
        );
    }

    /**
     *
     * @param camera
     */
    updateCameraUniforms(camera: Camera) {
        this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.ViewMatrix, camera.viewMatrix);
        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.ProjectionMatrix,
            camera.projectionMatrix
        );
        this.setUniformBlockValue(
            UniformBlockNames.Camera,
            UniformNames.ViewPosition,
            camera.transform.worldMatrix.position
        );
        this.setUniformBlockValue(UniformBlockNames.Camera, UniformNames.ViewDirection, camera.getWorldForward());
        this.setUniformBlockValue(UniformBlockNames.Camera, UniformNames.CameraNear, camera.near);
        this.setUniformBlockValue(UniformBlockNames.Camera, UniformNames.CameraFar, camera.far);
        this.setUniformBlockValue(
            UniformBlockNames.Camera,
            UniformNames.CameraAspect,
            camera.isPerspective() ? (camera as PerspectiveCamera).aspect : (camera as OrthographicCamera).aspect
        );
        this.setUniformBlockValue(
            UniformBlockNames.Camera,
            UniformNames.CameraFov,
            camera.isPerspective() ? (camera as PerspectiveCamera).fov : 0
        );

        // passMaterial.uniforms.setValue(UniformNames.ViewProjectionMatrix, targetCamera.viewProjectionMatrix);
        // passMaterial.uniforms.setValue(
        //     UniformNames.InverseViewProjectionMatrix,
        //     targetCamera.inverseViewProjectionMatrix
        // );
        // passMaterial.uniforms.setValue(UniformNames.InverseViewMatrix, targetCamera.inverseViewMatrix);
        // passMaterial.uniforms.setValue(UniformNames.InverseProjectionMatrix, targetCamera.inverseProjectionMatrix);
        // passMaterial.uniforms.setValue(
        //     UniformNames.TransposeInverseViewMatrix,
        //     targetCamera.viewMatrix.clone().invert().transpose()
        // );

        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.ViewProjectionMatrix,
            camera.viewProjectionMatrix
        );
        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.InverseViewMatrix,
            camera.inverseViewMatrix
        );
        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.InverseProjectionMatrix,
            camera.inverseProjectionMatrix
        );
        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.InverseViewProjectionMatrix,
            camera.inverseViewProjectionMatrix
        );
        this.setUniformBlockValue(
            UniformBlockNames.Transformations,
            UniformNames.TransposeInverseViewMatrix,
            camera.viewMatrix.clone().invert().transpose()
        );
    }

    /**
     *
     * @param blockName
     * @param uniformName
     * @param value
     */
    $updateUniformBlockValue(
        blockName: string,
        uniformName: string,
        value: UniformBufferObjectValue,
        showLog: boolean = false
    ) {
        const targetGlobalUniformBufferObject = this.globalUniformBufferObjects.find(
            ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
        );
        if (!targetGlobalUniformBufferObject) {
            console.error(`[Renderer.setUniformBlockData] invalid uniform block object: ${blockName}`);
            return;
        }

        // const targetBlock = targetUbo.data.find((block) => block.name === uniformName);

        // if (!targetBlock) {
        //     console.error(`[Renderer.setUniformBlockData] invalid uniform block data: ${uniformName}`);
        //     return;
        // }

        const targetUbo = targetGlobalUniformBufferObject.uniformBufferObject;

        const targetUniformData = targetGlobalUniformBufferObject.data.find((d) => {
            return d.name === uniformName;
        });

        if (!targetUniformData) {
            console.error(`[Renderer.setUniformBlockData] invalid uniform name: ${uniformName}`);
            return;
        }

        const getStructElementValue = (type: UniformTypes, value: UniformBufferObjectValue) => {
            const data: number[] = [];
            switch (type) {
                case UniformTypes.Float:
                case UniformTypes.Int:
                    data.push(value as number);
                    data.push(0);
                    data.push(0);
                    data.push(0);
                    break;
                case UniformTypes.Bool:
                    data.push((value as boolean) ? 1 : 0);
                    data.push(0);
                    data.push(0);
                    data.push(0);
                    break;
                case UniformTypes.Vector2:
                    data.push(...(value as Vector2).e);
                    data.push(0);
                    break;
                case UniformTypes.Vector3:
                    data.push(...(value as Vector3).e);
                    data.push(0);
                    break;
                case UniformTypes.Vector4:
                    data.push(...(value as Vector4).e);
                    break;
                case UniformTypes.Matrix4:
                    data.push(...(value as Matrix4).e);
                    break;
                case UniformTypes.Color:
                    data.push(...(value as Color).e);
                    break;
                default:
                    console.error(`invalid uniform type: ${type}`);
            }
            return data;
        };

        switch (targetUniformData.type) {
            // TODO: update struct
            case UniformTypes.Struct:
                (value as unknown as UniformBufferObjectStructValue).forEach((v) => {
                    const structElementName = `${uniformName}.${v.name}`;
                    const data: number[] = getStructElementValue(v.type, v.value);
                    targetUbo.updateBufferData(structElementName, new Float32Array(data));
                });
                break;
            case UniformTypes.StructArray:
                (value as UniformBufferObjectStructArrayValue).forEach((v, i) => {
                    v.forEach((vv) => {
                        const structElementName = `${uniformName}[${i}].${vv.name}`;
                        const data: number[] = getStructElementValue(vv.type, vv.value);
                        if (showLog) {
                            // console.log(structElementName, data);
                        }
                        targetUbo.updateBufferData(structElementName, new Float32Array(data), showLog);
                    });
                });
                break;
            default:
                if (Array.isArray(value)) {
                    const data: number[] = [];
                    (value as UniformBufferObjectElementValueArray).forEach((v) => {
                        if (typeof v === 'number') {
                            data.push(v);
                            data.push(0);
                            data.push(0);
                            data.push(0);
                        } else if (typeof v === 'boolean') {
                            data.push(v ? 1 : 0);
                            data.push(0);
                            data.push(0);
                            data.push(0);
                        } else {
                            data.push(...(v as UniformBufferObjectElementValueNoNeedsPadding).e);
                        }
                    });
                    targetUbo.updateBufferData(uniformName, new Float32Array(data));
                } else {
                    targetUbo.updateBufferData(
                        uniformName,
                        typeof value === 'number'
                            ? new Float32Array([value])
                            : (value as Vector2 | Vector3 | Vector4 | Matrix4 | Color).e
                    );
                }
                break;
        }
    }

    /**
     *
     * @param time
     */
    updateCommonUniforms({ time, deltaTime }: { time: number; deltaTime: number }) {
        // passMaterial.uniforms.setValue(UniformNames.Time, time);
        this.$updateUniformBlockValue(UniformBlockNames.Common, UniformNames.Time, time);
        this.$updateUniformBlockValue(UniformBlockNames.Common, UniformNames.DeltaTime, deltaTime);
        this.$updateUniformBlockValue(
            UniformBlockNames.Common,
            UniformNames.Viewport,
            new Vector4(this.realWidth, this.realHeight, this.realWidth / this.realHeight, 0)
        );
    }

    updateTimelineUniforms(timelineTime: number, timelineDeltaTime: number) {
        // passMaterial.uniforms.setValue(UniformNames.Time, time);
        this.$updateUniformBlockValue(UniformBlockNames.Timeline, UniformNames.TimelineTime, timelineTime);
        this.$updateUniformBlockValue(UniformBlockNames.Timeline, UniformNames.TimelineDeltaTime, timelineDeltaTime);
    }

    /**
     *
     * @param directionalLight
     */
    $updateDirectionalLightUniforms(directionalLight: DirectionalLight) {
        this.$updateUniformBlockValue(UniformBlockNames.DirectionalLight, UniformNames.DirectionalLight, [
            {
                name: UniformNames.LightDirection,
                type: UniformTypes.Vector3,
                // pattern3: normalizeし、光源の位置から降り注ぐとみなす
                value: directionalLight.transform.position.clone().negate().normalize(),
            },
            {
                name: UniformNames.LightIntensity,
                type: UniformTypes.Float,
                value: directionalLight.intensity,
            },
            {
                name: UniformNames.LightColor,
                type: UniformTypes.Color,
                value: directionalLight.color,
            },
            {
                // name: UniformNames.LightViewProjectionMatrix,
                name: UniformNames.ShadowMapProjectionMatrix,
                type: UniformTypes.Matrix4,
                value: directionalLight.shadowMapProjectionMatrix,
            },
        ]);
    }

    /**
     *
     * @param spotLights
     */
    $updateSpotLightsUniforms(spotLights: SpotLight[]) {
        this.$updateUniformBlockValue(
            UniformBlockNames.SpotLight,
            UniformNames.SpotLight,
            spotLights.map((spotLight) => {
                return [
                    {
                        name: UniformNames.LightColor,
                        type: UniformTypes.Color,
                        value: spotLight.color,
                    },
                    {
                        name: UniformNames.LightPosition,
                        type: UniformTypes.Vector3,
                        value: spotLight.transform.position,
                    },
                    {
                        name: UniformNames.LightDirection,
                        type: UniformTypes.Vector3,
                        value: spotLight.transform.worldForward.clone(),
                    },
                    {
                        name: UniformNames.LightIntensity,
                        type: UniformTypes.Float,
                        value: spotLight.intensity,
                    },
                    {
                        name: UniformNames.LightDistance,
                        type: UniformTypes.Float,
                        value: spotLight.distance,
                    },
                    {
                        name: UniformNames.LightAttenuation,
                        type: UniformTypes.Float,
                        value: spotLight.attenuation,
                    },
                    {
                        name: UniformNames.LightConeCos,
                        type: UniformTypes.Float,
                        value: spotLight.coneCos,
                    },
                    {
                        name: UniformNames.LightPenumbraCos,
                        type: UniformTypes.Float,
                        value: spotLight.penumbraCos,
                    },
                    {
                        name: UniformNames.ShadowMapProjectionMatrix,
                        type: UniformTypes.Matrix4,
                        value: spotLight.shadowMapProjectionMatrix,
                    },
                ];
            })
        );
    }

    /**
     *
     * @param pointLights
     */
    $updatePointLightsUniforms(pointLights: PointLight[]) {
        this.$updateUniformBlockValue(
            UniformBlockNames.PointLight,
            UniformNames.PointLight,
            pointLights.map((pointLight) => {
                return [
                    {
                        name: UniformNames.LightColor,
                        type: UniformTypes.Color,
                        value: pointLight.color,
                    },
                    {
                        name: UniformNames.LightPosition,
                        type: UniformTypes.Vector3,
                        value: pointLight.transform.position,
                    },
                    {
                        name: UniformNames.LightIntensity,
                        type: UniformTypes.Float,
                        value: pointLight.intensity,
                    },
                    {
                        name: UniformNames.LightDistance,
                        type: UniformTypes.Float,
                        value: pointLight.distance,
                    },
                    {
                        name: UniformNames.LightAttenuation,
                        type: UniformTypes.Float,
                        value: pointLight.attenuation,
                    },
                ];
            }),
            true
        );
    }

    $transparentPass(
        sortedRenderMeshInfos: RenderMeshInfo[],
        camera: Camera,
        lightActors: LightActors
        // clear: boolean
    ) {
        // console.log("--------- transparent pass ---------");

        // TODO: 常にclearしない、で良い気がする
        // if (clear) {
        //     // this.clear(camera.clearColor.x, camera.clearColor.y, camera.clearColor.z, camera.clearColor.w);
        //     this.gpu.clear(camera.clearColor.x, camera.clearColor.y, camera.clearColor.z, camera.clearColor.w);
        // }

        // this.setUniformBlockValue(UniformBlockNames.Transformations, UniformNames.ViewMatrix, camera.viewMatrix);
        // this.setUniformBlockValue(
        //     UniformBlockNames.Transformations,
        //     UniformNames.ProjectionMatrix,
        //     camera.projectionMatrix
        // );
        this.updateCameraUniforms(camera);

        sortedRenderMeshInfos.forEach(({ actor, materialIndex }) => {
            const targetMaterial = actor.materials[materialIndex];
            this.updateActorTransformUniforms(actor);

            // TODO:
            // - light actor の中で lightの種類別に処理を分ける
            // - lightActorsの順番が変わるとprojectionMatrixも変わっちゃうので注意
            // - opaqueと共通処理なのでまとめたい
            // lightActors.forEach((light) => {
            //     light.applyUniformsValues(targetMaterial);
            // });
            // TODO: transparentで必要？使わないことを強制してもいい気がする
            applyLightShadowMapUniformValues(targetMaterial, lightActors, this.gpu.dummyTextureBlack);

            this.renderMesh(actor.geometry, targetMaterial);

            if (isDevelopment()) {
                if (this.stats) {
                    this.stats.addPassInfo('transparent pass', actor.name, actor.geometry);
                }
            }
        });
    }
}
