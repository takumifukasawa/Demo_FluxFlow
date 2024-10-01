// actors
import { DirectionalLight } from '@/PaleGL/actors/DirectionalLight';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera';

// core
import { Engine } from '@/PaleGL/core/Engine';
import { Renderer } from '@/PaleGL/core/Renderer';
import { GPU } from '@/PaleGL/core/GPU';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { Scene } from '@/PaleGL/core/Scene';
// import { Texture } from '@/PaleGL/core/Texture';
// import { OrbitCameraController } from '@/PaleGL/core/OrbitCameraController';

// loaders

// materials

// math
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Vector4 } from '@/PaleGL/math/Vector4';

// postprocess
import { BufferVisualizerPass } from '@/PaleGL/postprocess/BufferVisualizerPass';

// inputs
import { TouchInputController } from '@/PaleGL/inputs/TouchInputController';
import { MouseInputController } from '@/PaleGL/inputs/MouseInputController';

// others
import {
    AttributeNames,
    AttributeUsageType,
    FaceSide,
    RenderTargetTypes,
    TextureDepthPrecisionType,
    TextureFilterTypes,
    UniformBlockNames,
    UniformTypes,
    // TextureFilterTypes,
    // TextureFilterTypes,
    // TextureFilterTypes, TextureWrapTypes,
} from '@/PaleGL/constants';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import sceneJsonUrl from '../assets/data/scene.json';

import { Camera } from '@/PaleGL/actors/Camera';
import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
import { PostProcess } from '@/PaleGL/postprocess/PostProcess.ts';
import soundVertexShader from '@/PaleGL/shaders/sound-vertex-demo.glsl';
import { wait } from '@/utilities/wait.ts';
import { createMarionetter } from '@/Marionetter/createMarionetter.ts';
// import { Mesh } from '@/PaleGL/actors/Mesh.ts';
import { SpotLight } from '@/PaleGL/actors/SpotLight.ts';
import {
    Marionetter,
    // MarionetterPlayableDirectorComponentInfo,
    MarionetterScene,
    MarionetterTimeline,
} from '@/Marionetter/types';
import { buildMarionetterScene } from '@/Marionetter/buildMarionetterScene.ts';
import { OrbitCameraController } from '@/PaleGL/core/OrbitCameraController.ts';
import { initDebugger } from './initDebugger.ts';
import { loadImg } from '@/PaleGL/loaders/loadImg.ts';
// import {loadImgArraybuffer} from '@/PaleGL/loaders/loadImg.ts';
import { Texture } from '@/PaleGL/core/Texture.ts';
import { TextAlignType, TextMesh } from '@/PaleGL/actors/TextMesh.ts';

// for default img
import fontAtlasImgUrl from '../assets/fonts/NotoSans-Bold/NotoSans-Bold-atlas-128_f-16_r-5_compress-256.png?url';
import fontAtlasJson from '../assets/fonts/NotoSans-Bold/NotoSans-Bold-atlas-128_f-16_r-5.json';
/*
// for gpu texture
import fontAtlasImgUrl from '../assets/fonts/NotoSans-Bold/NotoSans-Bold-atlas-128_f-16_r-5.dds?url';
import fontAtlasJson from '../assets/fonts/NotoSans-Bold/NotoSans-Bold-atlas-128_f-16_r-5.json';
*/

import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/ObjectSpaceRaymarchMesh.ts';

import litObjectSpaceRaymarchMetaMorphFrag from '@/PaleGL/shaders/lit-object-space-raymarch-meta-morph-fragment.glsl';
import gBufferObjectSpaceRaymarchMetaMorphDepthFrag from '@/PaleGL/shaders/gbuffer-object-space-raymarch-meta-morph-depth-fragment.glsl';
import demoMetaMorphTransformFeedbackVertex from '@/PaleGL/shaders/demo-meta-morph-transform-feedback-vertex.glsl';
import litScreenSpaceRaymarchFrag from '@/PaleGL/shaders/lit-screen-space-raymarch-fragment.glsl';
import gBufferScreenSpaceRaymarchDepthFrag from '@/PaleGL/shaders/gbuffer-screen-space-raymarch-depth-fragment.glsl';

import { maton } from '@/PaleGL/utilities/maton.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import { Attribute } from '@/PaleGL/core/Attribute.ts';
import { TransformFeedbackDoubleBuffer } from '@/PaleGL/core/TransformFeedbackDoubleBuffer.ts';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { clamp, saturate } from '@/PaleGL/utilities/mathUtilities.ts';
import { Mesh } from '@/PaleGL/actors/Mesh.ts';
import { BoxGeometry } from '@/PaleGL/geometries/BoxGeometry.ts';
import { UnlitMaterial } from '@/PaleGL/materials/UnlitMaterial.ts';
import { intersectRayWithPlane, Plane } from '@/PaleGL/math/Plane.ts';
import { ScreenSpaceRaymarchMesh } from '@/PaleGL/actors/ScreenSpaceRaymarchMesh.ts';
import { initGLSLSound } from './initGLSLSound.ts';
// import { Rotator } from '@/PaleGL/math/Rotator.ts';
// import { Quaternion } from '@/PaleGL/math/Quaternion.ts';

// const MAX_INSTANCE_NUM = 512;
const MAX_INSTANCE_NUM = 128;

const stylesText = `
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

body {
  overflow: hidden;
}

* {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
} 

#wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  background-color: black;
}

#w {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: black;
  z-index: 9999;
}
#o {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  width: 200px;
  height: 20px;
  box-sizing: border-box;
  border: 5px solid white;
}
#i {
  width: 0;
  height: 100%;
  box-sizing: border-box;
  background-color: white;
  position: absolute;
  border: 1px solid black;
  transition: width 1s ease-out;
}
#c {
  display: none;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  flex-direction: column;
}
#c button {
  display: block;
}
#p {
  margin-top: 1em;
}

`;
const styleElement = document.createElement('style');
styleElement.innerText = stylesText;
document.head.appendChild(styleElement);

let width: number, height: number;
let marionetterTimeline: MarionetterTimeline | null = null;
let bufferVisualizerPass: BufferVisualizerPass;
let attractorMesh: Mesh;

const marionetter: Marionetter = createMarionetter({ showLog: false });

const isSP = !!window.navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i);
const inputController = isSP ? new TouchInputController() : new MouseInputController();
inputController.start();

// const wrapperElement = document.getElementById("wrapper")!;
const wrapperElement = document.createElement('div');
document.body.appendChild(wrapperElement);
wrapperElement.setAttribute('id', 'wrapper');

// const canvasElement = document.getElementById("js-canvas")! as HTMLCanvasElement;
const canvasElement = document.createElement('canvas')!;
wrapperElement.appendChild(canvasElement);

const gl = canvasElement.getContext('webgl2', { antialias: false });

if (!gl) {
    throw 'invalid gl';
}

const gpu = new GPU({ gl });

const glslSoundWrapper = initGLSLSound(gpu, soundVertexShader, 144);

const captureScene = new Scene();

const pixelRatio = Math.min(window.devicePixelRatio, 1.5);

const renderer = new Renderer({
    gpu,
    canvas: canvasElement,
    pixelRatio,
});

const engine = new Engine({ gpu, renderer, updateFps: 60 });

engine.setScene(captureScene);

// const captureSceneCamera = new PerspectiveCamera(70, 1, 0.1, 50);
// captureScene.add(captureSceneCamera);
// // captureSceneCamera.mainCamera = true;
// captureSceneCamera.name = "Main Camera";

let captureSceneCamera: PerspectiveCamera | null;
// let orbitCameraController: OrbitCameraController | null;

const initMarionetter = () => {
    marionetter.connect();
};

const buildScene = (sceneJson: MarionetterScene) => {
    // const res = buildMarionetterScene(gpu, sceneJson, false);
    const res = buildMarionetterScene(gpu, sceneJson);
    const { actors } = res;
    marionetterTimeline = res.marionetterTimeline;

    for (let i = 0; i < actors.length; i++) {
        captureScene.add(actors[i]);
    }

    captureSceneCamera = captureScene.find('MainCamera') as PerspectiveCamera;
    const directionalLight = captureScene.find('DirectionalLight') as DirectionalLight;
    // const plane = captureScene.find('Plane') as Mesh;

    const orbitCameraController = new OrbitCameraController(captureSceneCamera);
    orbitCameraController.distance = isSP ? 15 : 15;
    orbitCameraController.attenuation = 0.01;
    orbitCameraController.dampingFactor = 0.2;
    orbitCameraController.azimuthSpeed = 100;
    orbitCameraController.altitudeSpeed = 100;
    orbitCameraController.deltaAzimuthPower = 2;
    orbitCameraController.deltaAltitudePower = 2;
    orbitCameraController.maxAltitude = 5;
    orbitCameraController.minAltitude = -45;
    orbitCameraController.maxAzimuth = 55;
    orbitCameraController.minAzimuth = -55;
    orbitCameraController.defaultAzimuth = 10;
    orbitCameraController.defaultAltitude = -10;
    orbitCameraController.lookAtTarget = new Vector3(0, 3, 0);
    orbitCameraController.start();
    orbitCameraController.enabled = true;

    // const orbitCameraController = new OrbitCameraController(captureSceneCamera);

    captureSceneCamera.subscribeOnStart(({ actor }) => {
        (actor as Camera).setClearColor(new Vector4(0, 0, 0, 1));
    });
    captureSceneCamera.onFixedUpdate = () => {
        // 1: fixed position
        // actor.transform.position = new Vector3(-7 * 1.1, 4.5 * 1.4, 11 * 1.2);
        // 2: orbit controls
        // if (inputController.isDown && debuggerStates.orbitControlsEnabled) {
        // if (inputController.isDown && orbitCameraController.enabled) {
        //     orbitCameraController.setDelta(inputController.deltaNormalizedInputPosition);
        // }
        if (inputController.isDown && orbitCameraController.enabled) {
            orbitCameraController.setDelta(inputController.deltaNormalizedInputPosition);
        }
        orbitCameraController.fixedUpdate();
    };

    const spotLight = captureScene.find('SpotLight') as SpotLight;
    if (spotLight && spotLight.shadowCamera) {
        spotLight.shadowCamera.visibleFrustum = true;
        spotLight.castShadow = true;
        spotLight.shadowCamera.near = 0.1;
        spotLight.shadowCamera.far = spotLight.distance;
        (spotLight.shadowCamera as PerspectiveCamera).setPerspectiveSize(1); // TODO: いらないかも
        spotLight.shadowMap = new RenderTarget({
            gpu,
            width: 1024,
            height: 1024,
            type: RenderTargetTypes.Depth,
            depthPrecision: TextureDepthPrecisionType.High,
        });
        // spotLight.transform.rotation = Rotator.fromRadian(0, 0, 0);
    }
    // spotLight.transform.rotation = spotLight.transform.rotation.invert();
    // spotLight.lastUpdate = () => {
    //     spotLight.transform.rotation = spotLight.transform.rotation.invert();
    //     // spotLight.transform.rotation = spotLight.transform.rotation;
    // };
    //spotLight.transform.position = new Vector3(0, 3, 0);
    //spotLight.transform.lookAt(new Vector3(0, 0, 0));
    //spotLight.transform.rotation = Rotator.fromRadian(-90, 0, 0);
    //console.log("rrr", spotLight.transform.rotation)

    // const plane = captureScene.find('Plane') as Mesh;
    // plane.transform.rotation = Rotator.fromDegree(0, 0, 0);
    // plane.material = new UnlitMaterial({emissiveColor: Color.fromRGB(255, 255, 255)});

    // const directionalLight = new DirectionalLight({
    //     name: 'DirectionalLight',
    //     intensity: 1.2,
    //     // color: Color.fromRGB(255, 210, 200),
    //     color: Color.white,
    // });

    // shadows
    // TODO: directional light は constructor で shadow camera を生成してるのでこのガードいらない
    if (directionalLight && directionalLight.shadowCamera) {
        // directionalLight.shadowCamera.visibleFrustum = true;
        directionalLight.castShadow = true;
        directionalLight.shadowCamera.near = 1;
        directionalLight.shadowCamera.far = 30;
        (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -12, 12, -12, 12);
        // (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -5, 5, -5, 5);
        // (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -7, 7, -7, 7);
        directionalLight.shadowMap = new RenderTarget({
            gpu,
            width: 1024,
            height: 1024,
            type: RenderTargetTypes.Depth,
        });

        directionalLight.subscribeOnStart(({ actor }) => {
            actor.transform.setTranslation(new Vector3(-8, 8, -2));
            actor.transform.lookAt(new Vector3(0, 0, 0));
            // const lightActor = actor as DirectionalLight;
            // lightActor.castShadow = true;
            // // lightActor.castShadow = false;
            // if (lightActor.shadowCamera) {
            //     lightActor.shadowCamera.near = 1;
            //     lightActor.shadowCamera.far = 30;
            //     (lightActor.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -10, 10, -10, 10);
            //     lightActor.shadowMap = new RenderTarget({gpu, width: 1024, height: 1024, type: RenderTargetTypes.Depth});
            // }
        });
        // captureScene.add(directionalLight);
    }

    const cameraPostProcess = new PostProcess();

    bufferVisualizerPass = new BufferVisualizerPass({
        gpu,
        // parameters: { fullViewTextureEnabled: true },
    });
    bufferVisualizerPass.parameters.enabled = false;
    cameraPostProcess.addPass(bufferVisualizerPass);

    cameraPostProcess.enabled = true;
    // TODO: set post process いらないかも
    captureSceneCamera.setPostProcess(cameraPostProcess);

    console.log('scene', actors);
};

// const parseScene = (sceneJson: MarionetterScene) => {
//     const playableDirectorComponentInfo = sceneJson.objects[0]
//         .components[0] as MarionetterPlayableDirectorComponentInfo;
//     marionetterTimeline = buildMarionetterTimeline(captureScene, playableDirectorComponentInfo);
// };

// TODO: この処理はビルド時には捨てたい
const initHotReloadAndParseScene = () => {
    const hotReloadScene = () => {
        console.log('hot reload scene...');
        void fetch('./assets/data/scene-hot-reload.json').then(async (res) => {
            const sceneJson = (await res.json()) as unknown as MarionetterScene;
            // TODO: reload hot timeline
            console.log(sceneJson);
            // parseScene(sceneJson);
        });
    };
    marionetter.setHotReloadCallback(() => {
        hotReloadScene();
    });
    hotReloadScene();
};

const startupWrapperElement = document.createElement('div');
startupWrapperElement.id = 'w';

const loadingContentElement = document.createElement('div');
loadingContentElement.id = 'o';
startupWrapperElement.appendChild(loadingContentElement);

const loadingGageElement = document.createElement('div');
loadingGageElement.id = 'i';
loadingContentElement.appendChild(loadingGageElement);

const menuContentElement = document.createElement('div');
menuContentElement.id = 'c';
startupWrapperElement.appendChild(menuContentElement);

const fullscreenButtonElement = document.createElement('button');
fullscreenButtonElement.id = 'f';
fullscreenButtonElement.textContent = 'FULL SCREEN';
menuContentElement.appendChild(fullscreenButtonElement);

const playButtonElement = document.createElement('button');
playButtonElement.id = 'p';
playButtonElement.textContent = 'PLAY';
menuContentElement.appendChild(playButtonElement);

document.body.appendChild(startupWrapperElement);

const hideLoading = () => {
    loadingContentElement.style.display = 'none';
};
const setLoadingPercentile = (percent: number) => {
    loadingGageElement.style.width = `${percent}%`;
};
const showMenu = () => {
    menuContentElement.style.display = 'flex';
};

const hideStartupWrapper = () => {
    startupWrapperElement.style.display = 'none';
};

let metaMorphMesh: ObjectSpaceRaymarchMesh;

const createInstanceUpdater = (instanceNum: number) => {
    //
    // begin create mesh
    //

    // const planeNum = 512;

    const initialPosition = new Float32Array(
        maton
            .range(instanceNum)
            .map(() => {
                const range = 10;
                return [
                    Math.random() * range - range * 0.5,
                    Math.random() * 4 + 2,
                    Math.random() * range - range * 0.5,
                ];
            })
            .flat()
    );

    const initialVelocity = new Float32Array(
        maton
            .range(instanceNum)
            .map(() => {
                return [0, 0, 0];
            })
            .flat()
    );

    const initialSeed = new Float32Array(
        maton
            .range(instanceNum, true)
            .map((i) => {
                return [
                    i,
                    i,
                    // i + Math.floor(Math.random() * 100000),
                    // // Math.floor(Math.random() * 10000),
                    // Math.floor(Math.random() * 100000)
                ];
            })
            .flat()
    );

    const transformFeedbackDoubleBuffer = new TransformFeedbackDoubleBuffer({
        gpu,
        attributes: [
            new Attribute({
                name: 'aPosition',
                data: initialPosition,
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: 'aVelocity',
                data: initialVelocity,
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: 'aSeed',
                data: initialSeed,
                size: 2,
                usageType: AttributeUsageType.StaticDraw,
            }),
        ],
        varyings: [
            {
                name: 'vPosition',
                data: new Float32Array(initialPosition),
            },
            {
                name: 'vVelocity',
                data: new Float32Array(initialVelocity),
            },
        ],
        vertexShader: demoMetaMorphTransformFeedbackVertex,
        //         vertexShader: `#version 300 es
        //
        //         precision highp float;
        //
        //         // TODO: ここ動的に構築してもいい
        //         layout(location = 0) in vec3 aPosition;
        //         layout(location = 1) in vec3 aVelocity;
        //         layout(location = 2) in vec2 aSeed;
        //
        //         out vec3 vPosition;
        //         // out mat4 vTransform;
        //         out vec3 vVelocity;
        //
        //
        // layout (std140) uniform ubCommon {
        //     float uTime;
        // };
        //
        //         // uniform float uTime;
        //         uniform vec2 uNormalizedInputPosition;
        //         uniform vec3 uAttractTargetPosition;
        //         uniform float uAttractRate;
        //
        //         // https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
        //         float noise(vec2 seed)
        //         {
        //             return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
        //         }
        //
        //         void main() {
        //             vPosition = aPosition + aVelocity;
        //             vec3 target = uAttractTargetPosition;
        //             vec2 seed = aSeed;
        //             float rand = noise(seed);
        //             target += vec3(
        //                 cos(uTime + rand * 100. + seed.x) * (2. + rand * 1.),
        //                 sin(uTime - rand * 400. + seed.x) * (1. + rand * 1.) + 1.,
        //                 cos(uTime - rand * 300. + seed.x) * (2. + rand * 1.)
        //             );
        //             vec3 v = target - vPosition;
        //             vec3 dir = normalize(v);
        //             vVelocity = mix(
        //                 aVelocity,
        //                 dir * (.1 + uAttractRate * .1),
        //                 .03 + sin(uTime * .2 + rand * 100.) * .02
        //             );
        //         }
        //         `,
        // fragmentShader: `#version 300 es

        // precision highp float;

        // void main() {
        // }
        // `,
        uniforms: [
            // {
            //     name: UniformNames.Time,
            //     type: UniformTypes.Float,
            //     value: 0,
            // },
            {
                name: 'uNormalizedInputPosition',
                type: UniformTypes.Vector2,
                value: Vector2.zero,
            },
            {
                name: 'uAttractTargetPosition',
                type: UniformTypes.Vector3,
                value: Vector3.zero,
            },
            {
                name: 'uAttractRate',
                type: UniformTypes.Float,
                value: 0,
            },
        ],
        uniformBlockNames: [UniformBlockNames.Common],
        drawCount: instanceNum,
    });

    // TODO: rendererかgpuでまとめたい
    transformFeedbackDoubleBuffer.uniformBlockNames.forEach((blockName) => {
        const targetGlobalUniformBufferObject = renderer.globalUniformBufferObjects.find(
            ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
        );
        if (!targetGlobalUniformBufferObject) {
            return;
        }
        const blockIndex = gpu.bindUniformBlockAndGetBlockIndex(
            targetGlobalUniformBufferObject.uniformBufferObject,
            transformFeedbackDoubleBuffer.shader,
            blockName
        );
        // console.log("hogehoge", blockName, blockIndex)
        // for debug
        // console.log(
        //     material.name,
        //     'addUniformBlock',
        //     material.uniformBlockNames,
        //     targetUniformBufferObject.blockName,
        //     blockIndex
        // );
        transformFeedbackDoubleBuffer.uniforms.addUniformBlock(
            blockIndex,
            targetGlobalUniformBufferObject.uniformBufferObject,
            []
        );
    });

    return transformFeedbackDoubleBuffer;
};

const createMetaMorphMesh = (instanceNum: number) => {
    const mesh = new ObjectSpaceRaymarchMesh({
        gpu,
        materialArgs: {
            fragmentShader: litObjectSpaceRaymarchMetaMorphFrag,
            depthFragmentShader: gBufferObjectSpaceRaymarchMetaMorphDepthFrag,
            metallic: 0,
            roughness: 0,
            receiveShadow: true,

            isInstancing: true,
            useInstanceLookDirection: true,
            useVertexColor: false,
            faceSide: FaceSide.Double,
        },
        castShadow: true,
    });
    // mesh.transform.scale = new Vector3(.75, .75, .75);
    // mesh.transform.position = new Vector3(1.5, 1.5, 0);
    // const rot = new Rotator(Quaternion.identity());
    // rot.setRotationX(90);
    // mesh.transform.rotation = rot;

    const instanceInfo: {
        position: number[][];
        scale: number[][];
        rotation: number[][];
        velocity: number[][];
        color: number[][];
    } = {
        position: [],
        scale: [],
        rotation: [],
        velocity: [],
        color: [],
    };
    maton.range(instanceNum).forEach(() => {
        instanceInfo.position.push([0, 0, 0]);

        // const baseScale = 0.25;
        const baseScale = 2;
        const randomScaleRange = 0.25;
        const s = Math.random() * randomScaleRange + baseScale;
        instanceInfo.scale.push([s, s, s]);

        instanceInfo.rotation.push([0, 0, 0]);

        instanceInfo.velocity.push([0, 0, 0]);

        const c = Color.fromRGB(
            Math.floor(Math.random() * 180 + 20),
            Math.floor(Math.random() * 20 + 20),
            Math.floor(Math.random() * 180 + 20)
        );
        instanceInfo.color.push([...c.elements]);
    });
    const animationOffsetInfo = maton
        .range(instanceNum)
        .map(() => {
            return Math.random() * 30;
        })
        .flat();

    mesh.castShadow = true;
    mesh.geometry.instanceCount = instanceNum;

    // TODO: instanceのoffset回りは予約語にしてもいいかもしれない
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstancePosition,
            data: new Float32Array(instanceInfo.position.flat()),
            size: 3,
            divisor: 1,
        })
    );
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceScale,
            data: new Float32Array(instanceInfo.scale.flat()),
            size: 3,
            divisor: 1,
        })
    );
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceRotation,
            data: new Float32Array(instanceInfo.rotation.flat()),
            size: 3,
            divisor: 1,
        })
    );
    // aInstanceAnimationOffsetは予約語
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceAnimationOffset,
            data: new Float32Array(animationOffsetInfo),
            size: 1,
            divisor: 1,
        })
    );
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceVertexColor,
            data: new Float32Array(instanceInfo.color.flat()),
            size: 4,
            divisor: 1,
        })
    );
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceVelocity,
            data: new Float32Array(instanceInfo.velocity.flat()),
            size: 3,
            divisor: 1,
        })
    );

    const transformFeedbackDoubleBuffer = createInstanceUpdater(MAX_INSTANCE_NUM);

    let attractRate = 0;
    mesh.onUpdate = ({ deltaTime }) => {
        transformFeedbackDoubleBuffer.uniforms.setValue(
            'uNormalizedInputPosition',
            inputController.normalizedInputPosition
        );
        transformFeedbackDoubleBuffer.uniforms.setValue(
            'uAttractTargetPosition',
            Vector3.addVectors(attractorMesh.transform.position, new Vector3(0, 0, 0))
        );

        attractRate += (inputController.isDown ? 1 : -1) * deltaTime * 2;
        attractRate = saturate(attractRate);
        transformFeedbackDoubleBuffer.uniforms.setValue('uAttractRate', attractRate);
        gpu.updateTransformFeedback({
            shader: transformFeedbackDoubleBuffer.shader,
            uniforms: transformFeedbackDoubleBuffer.uniforms,
            vertexArrayObject: transformFeedbackDoubleBuffer.write.vertexArrayObject,
            transformFeedback: transformFeedbackDoubleBuffer.write.transformFeedback,
            drawCount: transformFeedbackDoubleBuffer.drawCount,
        });
        transformFeedbackDoubleBuffer.swap();

        // 更新する場合
        mesh.geometry.vertexArrayObject.replaceBuffer(
            AttributeNames.InstancePosition,
            transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aPosition')
        );
        mesh.geometry.vertexArrayObject.replaceBuffer(
            AttributeNames.InstanceVelocity,
            transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer('aVelocity')
        );

        mesh.geometry.instanceCount = MAX_INSTANCE_NUM;
    };

    return mesh;
};

let screenSpaceRaymarchMesh: Mesh;
const createScreenSpaceRaymarchMesh = () => {
    const mesh = new ScreenSpaceRaymarchMesh({
        gpu,
        materialArgs: {
            fragmentShader: litScreenSpaceRaymarchFrag,
            depthFragmentShader: gBufferScreenSpaceRaymarchDepthFrag,
            metallic: 0,
            roughness: 0,
            receiveShadow: true,
            emissiveColor: Color.white,
        },
        // castShadow: true,
    });
    mesh.transform.scale = new Vector3(2, 2, 2);
    mesh.transform.position = new Vector3(0, 4, 0);

    return mesh;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/ban-ts-comment
const load = async () => {
    setLoadingPercentile(10);

    await wait(0);

    glslSoundWrapper.load();
    // glslSoundWrapper.warmup();

    await wait(100);

    // parseScene(sceneJsonUrl as unknown as MarionetterScene);
    console.log('====== main ======');
    console.log(import.meta.env);
    console.log(sceneJsonUrl);

    buildScene(sceneJsonUrl as unknown as MarionetterScene);

    renderer.fogPass.parameters.blendRate = 0;

    if (import.meta.env.VITE_HOT_RELOAD === 'true') {
        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'KeyP':
                    console.log('===== play sound =====');
                    glslSoundWrapper.play({ reload: true });
                    break;
                case 'KeyS':
                    console.log('===== stop sound =====');
                    glslSoundWrapper.stop();
                    break;
            }
        });
        initMarionetter();
        initHotReloadAndParseScene();
    }

    //
    // attract mesh
    //

    attractorMesh = new Mesh({
        geometry: new BoxGeometry({ gpu }),
        material: new UnlitMaterial({
            emissiveColor: new Color(3, 3, 3, 1),
        }),
        castShadow: true,
    });
    attractorMesh.subscribeOnStart(({ actor }) => {
        actor.transform.setScaling(Vector3.fill(0.5));
    });
    attractorMesh.onFixedUpdate = () => {
        if (captureSceneCamera) {
            const ray = captureSceneCamera.viewpointToRay(
                new Vector2(inputController.normalizedInputPosition.x, 1 - inputController.normalizedInputPosition.y)
            );
            const plane = new Plane(Vector3.zero, Vector3.up);
            const intersectOnPlane = intersectRayWithPlane(ray, plane);
            if (intersectOnPlane) {
                const x = clamp(intersectOnPlane.x, -5, 5);
                const z = clamp(intersectOnPlane.z, -5, 5);
                const p = new Vector3(x, 1, z);
                attractorMesh.transform.setTranslation(p);
            }
        }
    };
    captureScene.add(attractorMesh);

    //
    // meta morph object
    //

    metaMorphMesh = createMetaMorphMesh(MAX_INSTANCE_NUM);
    captureScene.add(metaMorphMesh);

    //
    // screen space object
    //

    screenSpaceRaymarchMesh = createScreenSpaceRaymarchMesh();
    captureScene.add(screenSpaceRaymarchMesh);

    //
    // text mesh
    //

    const fontAtlasImg = await loadImg(fontAtlasImgUrl);
    // const fontAtlasImg = await loadImgArraybuffer(fontAtlasImgUrl);
    const fontAtlasTexture = new Texture({
        gpu,
        // for default img
        img: fontAtlasImg,
        /*
        // for gpu texture
        img: null,
        arraybuffer: fontAtlasImg,
        dxt1: true
        mipmap: false,
        */
        flipY: false,
        minFilter: TextureFilterTypes.Linear,
        magFilter: TextureFilterTypes.Linear,
    });
    const textMesh1 = new TextMesh({
        gpu,
        text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        fontTexture: fontAtlasTexture,
        fontAtlas: fontAtlasJson,
        castShadow: true,
        align: TextAlignType.Center,
        // characterSpacing: -0.2
    });
    captureScene.add(textMesh1);
    textMesh1.transform.position = new Vector3(0, 1, 2);
    textMesh1.transform.rotation.setRotationX(-90);
    textMesh1.transform.scale = Vector3.fill(1);

    const textMesh2 = new TextMesh({
        gpu,
        text: 'abcdefghijklmnopqrstuvwxyz',
        fontTexture: fontAtlasTexture,
        fontAtlas: fontAtlasJson,
        castShadow: true,
        align: TextAlignType.Center,
        characterSpacing: -0.16,
    });
    captureScene.add(textMesh2);
    textMesh2.transform.position = new Vector3(0, 2, 4);
    textMesh2.transform.rotation.setRotationX(-90);
    textMesh2.transform.scale = Vector3.fill(1);

    const textMesh3 = new TextMesh({
        gpu,
        text: '0123456789',
        fontTexture: fontAtlasTexture,
        fontAtlas: fontAtlasJson,
        castShadow: true,
        align: TextAlignType.Left,
        characterSpacing: 0.2,
    });
    captureScene.add(textMesh3);
    textMesh3.transform.position = new Vector3(0, 0.01, 6);
    textMesh3.transform.rotation.setRotationX(-90);
    textMesh3.transform.scale = Vector3.fill(1);

    // TODO: engine側に移譲したい
    const onWindowResize = () => {
        width = wrapperElement.offsetWidth;
        height = wrapperElement.offsetHeight;
        inputController.setSize(width, height);
        engine.setSize(width, height);
    };

    engine.onBeforeStart = () => {
        onWindowResize();
        window.addEventListener('resize', onWindowResize);
    };

    engine.onBeforeUpdate = () => {
        inputController.update();
    };

    engine.onRender = (time) => {
        if (marionetterTimeline !== null) {
            // TODO: prodの時はこっちを使いたい
            // const soundTime = glslSound.getCurrentTime();
            // marionetterTimeline.execute(soundTime);
            // // marionetterTimeline.execute(marionetter.getCurrentTime());
            marionetterTimeline.execute(0);
        }
        if (captureSceneCamera) {
            renderer.render(captureScene, captureSceneCamera, { time });
        }
    };

    engine.start();

    await wait(1);

    engine.warmRender();

    setLoadingPercentile(100);

    await wait(1);
    // await wait(1200);

    fullscreenButtonElement.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            // eslint-disable-next-line
            document.documentElement.requestFullscreen().then(() => {
                console.log('fullscreen');
            });
        }
    });

    playButtonElement.addEventListener('click', () => {
        hideStartupWrapper();
        playDemo();
    });

    hideLoading();
    showMenu();
};

const playDemo = () => {
    const tick = (time: number) => {
        engine.run(time);
        requestAnimationFrame(tick);
    };

    glslSoundWrapper.play();

    requestAnimationFrame(tick);

    initDebugger({
        bufferVisualizerPass,
        glslSound: glslSoundWrapper.glslSound!, // 存在しているとみなしちゃう
        playSound: glslSoundWrapper.play,
        stopSound: glslSoundWrapper.stop,
        renderer,
        wrapperElement,
    });
};

const main = async () => {
    await load();
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
