// actors
import { DirectionalLight } from '@/PaleGL/actors/DirectionalLight';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera';

// core
import { Engine } from '@/PaleGL/core/Engine';
import { Renderer } from '@/PaleGL/core/Renderer';
import { GPU } from '@/PaleGL/core/GPU';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
import { Scene } from '@/PaleGL/core/Scene';

// loaders
// materials
// math
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Vector4 } from '@/PaleGL/math/Vector4';

// others
import { RenderTargetTypes, TextureDepthPrecisionType } from '@/PaleGL/constants';

import sceneJsonUrl from './data/scene.json';

import { Camera } from '@/PaleGL/actors/Camera';
import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera';
import { PostProcess } from '@/PaleGL/postprocess/PostProcess.ts';
import soundVertexShader from '@/PaleGL/shaders/sound-vertex-demo.glsl';
import { wait } from '@/utilities/wait.ts';
import { createMarionetter } from '@/Marionetter/createMarionetter.ts';
import { SpotLight } from '@/PaleGL/actors/SpotLight.ts';
import { Marionetter, MarionetterSceneStructure } from '@/Marionetter/types';
import { MarionetterScene } from '@/Marionetter/types';
import { buildMarionetterScene } from '@/Marionetter/buildMarionetterScene.ts';
import { createPointLightDebugger, initDebugger } from './scripts/initDebugger.ts';

// // textを使う場合
// import { TextureFilterTypes } from '@/PaleGL/constants';
// import { loadImg } from '@/PaleGL/loaders/loadImg.ts';
// import { Texture } from '@/PaleGL/core/Texture.ts';
// import { TextAlignType, TextMesh } from '@/PaleGL/actors/TextMesh.ts';
// // for default img
// // noto sans
// import fontAtlasImgUrl from '../assets/fonts/NotoSans-Bold-atlas-128_f-16_r-5_compress-256.png?url';
// // import fontAtlasImgUrl from '../assets/fonts/NotoSans-Bold-atlas-128_f-16_r-5.png?url';
// import fontAtlasJson from '../assets/fonts/NotoSans-Bold-atlas-128_f-16_r-5.json';

import { initGLSLSound } from './scripts/initGLSLSound.ts';
import { createOriginForgeActorController, OriginForgeActorController } from './scripts/originForgeActorController.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import {
    createMorphFollowersActor,
    MorphFollowerActorControllerBinder,
    MorphFollowerActorControllerEntity,
} from './scripts/createMorphFollowersActorController.ts';
import { SOUND_DURATION } from './scripts/demoSequencer.ts';
import {
    ATTRACTOR_ORBIT_MOVER_A,
    ATTRACTOR_ORBIT_MOVER_B,
    ATTRACTOR_ORBIT_MOVER_C,
    ATTRACTOR_TARGET_BOX_ROOT_ACTOR_A,
    ATTRACTOR_TARGET_BOX_ROOT_ACTOR_B,
    ATTRACTOR_TARGET_SPHERE_ACTOR_A_NAME,
    ATTRACTOR_TARGET_SPHERE_ACTOR_B_NAME,
    DEPTH_OF_FIELD_TARGET_ACTOR_NAME,
    DIRECT_LIGHT_ACTOR_NAME,
    // DIRECT_LIGHT_ACTOR_NAME,
    FLOOR_ACTOR_NAME,
    FOLLOWERS_ACTOR_NAME_A,
    FOLLOWERS_ACTOR_NAME_B,
    FOLLOWERS_ACTOR_NAME_C,
    MAIN_CAMERA_ACTOR_NAME,
    ORIGIN_FORGE_GATHER_CHILD_ACTOR_NAME_1,
    ORIGIN_FORGE_GATHER_CHILD_ACTOR_NAME_2,
    ORIGIN_FORGE_GATHER_CHILD_ACTOR_NAME_3,
    ORIGIN_FORGE_GATHER_CHILD_ACTOR_NAME_4,
    POST_PROCESS_ACTOR_NAME,
    SPOT_LIGHT_ACTOR_NAME_A,
    SPOT_LIGHT_ACTOR_NAME_B,
} from './scripts/demoConstants.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { createOrbitMoverBinder } from './scripts/orbitMoverBinder.ts';
import { createDofFocusTargetController } from './scripts/dofFocusTargetController.ts';
import { createTimelineHandShakeController } from '@/PaleGL/components/TimelineHandShakeController.ts';
import { createFloorActorController } from './scripts/createFloorActorController.ts';
import { initHotReloadAndParseScene } from './scripts/initHotReloadAndParseScene.ts';
import { isDevelopment } from '@/PaleGL/utilities/envUtilities.ts';
import { ScreenSpaceRaymarchMesh } from '@/PaleGL/actors/ScreenSpaceRaymarchMesh.ts';
import { createScreenSpaceRaymarchMesh } from './scripts/createScreenSpaceRaymarchMesh.ts';
import { BufferVisualizerPass } from '@/PaleGL/postprocess/BufferVisualizerPass.ts';
import { snapToStep } from '@/Marionetter/timelineUtilities.ts';
import { clamp } from '@/PaleGL/utilities/mathUtilities.ts';
import { createBlackCurtainPass } from './scripts/createBlackCurtainPass.ts';

const stylesText = `
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

let width: number, height: number;
let directionalLight: DirectionalLight;
let currentTimeForTimeline = 0;
let captureSceneCamera: PerspectiveCamera | null;
let marionetterSceneStructure: MarionetterSceneStructure | null = null;
let cameraPostProcess: PostProcess;
let bufferVisualizerPass: BufferVisualizerPass;
const blackCurtainPass = createBlackCurtainPass(gpu);

const glslSoundWrapper = initGLSLSound(gpu, soundVertexShader, SOUND_DURATION);

const marionetter: Marionetter = createMarionetter({
    showLog: false,
    onPlay: (time: number) => {
        console.log(`[marionetter.onPlay] time: ${time}`);
        glslSoundWrapper.play({ time });
        currentTimeForTimeline = time;
    },
    onSeek: (time: number) => {
        currentTimeForTimeline = time;
        glslSoundWrapper.stop();
    },
    onStop: () => {
        console.log(`[marionetter.onStop]`);
        glslSoundWrapper.stop();
    },
});

const captureScene = new Scene();

const renderer = new Renderer({
    gpu,
    canvas: canvasElement,
    pixelRatio: Math.min(window.devicePixelRatio, 1),
});

const engine = new Engine({ gpu, renderer, updateFps: 60 });

engine.setScene(captureScene);

const buildScene = (sceneJson: MarionetterScene) => {
    // console.log('[buildScene] scene json', sceneJson);
    // marionetterSceneStructure = buildMarionetterScene(gpu, sceneJson, captureScene);
    marionetterSceneStructure = buildMarionetterScene(gpu, sceneJson);

    // timeline生成したらscene内のactorをbind
    const { actors } = marionetterSceneStructure;

    marionetterSceneStructure.marionetterTimeline?.bindActors(captureScene.children);
    for (let i = 0; i < actors.length; i++) {
        captureScene.add(actors[i]);
    }

    //
    // camera
    //
    captureSceneCamera = captureScene.find(MAIN_CAMERA_ACTOR_NAME) as PerspectiveCamera;

    captureSceneCamera.subscribeOnStart(({ actor }) => {
        (actor as Camera).setClearColor(new Vector4(0, 0, 0, 1));
    });

    //
    // post process
    //

    const postProessActor = captureScene.find(POST_PROCESS_ACTOR_NAME) as Actor;
    postProessActor.onProcessPropertyBinder = (key, value) => {
        // color cover pass
        if (key === 'cbr') {
            blackCurtainPass.setBlendRate(value);
        }
    };

    //
    // spot light shadow
    //

    const createSpotLightShadowMap = (spotLight: SpotLight) => {
        if (spotLight.shadowCamera) {
            spotLight.shadowCamera.visibleFrustum = false;
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
            console.log(spotLight, spotLight, spotLight.shadowMap);
        }
    };

    createSpotLightShadowMap(captureScene.find(SPOT_LIGHT_ACTOR_NAME_A) as SpotLight);
    createSpotLightShadowMap(captureScene.find(SPOT_LIGHT_ACTOR_NAME_B) as SpotLight);

    //
    // directional light and shadows
    //

    directionalLight = captureScene.find(DIRECT_LIGHT_ACTOR_NAME) as DirectionalLight;

    // TODO: directional light は constructor で shadow camera を生成してるのでこのガードいらない
    if (directionalLight && directionalLight.shadowCamera) {
        directionalLight.shadowCamera.visibleFrustum = false;
        directionalLight.castShadow = true;
        directionalLight.shadowCamera.near = 1;
        directionalLight.shadowCamera.far = 40;
        const size = 10;
        (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -size, size, -size, size);
        directionalLight.shadowMap = new RenderTarget({
            gpu,
            width: 1024,
            height: 1024,
            type: RenderTargetTypes.Depth,
        });

        // directionalLight.transform.setTranslation(new Vector3(-9.7, 10.1, -9));
        // directionalLight.subscribeOnStart(({ actor }) => {
        //     actor.transform.lookAt(new Vector3(0, 0, 0));
        // });

        // directionalLight.onUpdate = () => {
        //     directionalLight.transform.position.log()
        // }
    }

    cameraPostProcess = new PostProcess();
    cameraPostProcess.enabled = true;

    cameraPostProcess.addPass(blackCurtainPass.getPass());
    captureSceneCamera.setPostProcess(cameraPostProcess);

    if (isDevelopment()) {
        bufferVisualizerPass = new BufferVisualizerPass({
            gpu,
        });
        bufferVisualizerPass.parameters.enabled = false;
        cameraPostProcess.addPass(bufferVisualizerPass);
        // TODO: set post process いらないかも
    }
    console.log('scene', actors);
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

const morphFollowersActorControllerBinders: MorphFollowerActorControllerBinder[] = [];
const attractorTargetBoxActors: Actor[] = [];
const attractorTargetSphereActors: Actor[] = [];
let originForgeActorController: OriginForgeActorController;
let screenSpaceRaymarchMesh: ScreenSpaceRaymarchMesh;

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
    // console.log(sceneJsonUrl);

    //
    // morph follower actor controller
    //

    morphFollowersActorControllerBinders.push({
        morphFollowersActorController: createMorphFollowersActor({
            name: FOLLOWERS_ACTOR_NAME_A,
            gpu,
            renderer,
        }),
        orbitFollowTargetActorName: ATTRACTOR_ORBIT_MOVER_A,
    });
    morphFollowersActorControllerBinders.push({
        morphFollowersActorController: createMorphFollowersActor({
            name: FOLLOWERS_ACTOR_NAME_B,
            gpu,
            renderer,
        }),
        orbitFollowTargetActorName: ATTRACTOR_ORBIT_MOVER_C,
    });
    morphFollowersActorControllerBinders.push({
        morphFollowersActorController: createMorphFollowersActor({
            name: FOLLOWERS_ACTOR_NAME_C,
            gpu,
            renderer,
        }),
        orbitFollowTargetActorName: ATTRACTOR_ORBIT_MOVER_B,
    });

    morphFollowersActorControllerBinders.forEach((elem) => {
        captureScene.add(elem.morphFollowersActorController.getActor());
    });

    //
    // origin forge actor object
    //

    originForgeActorController = createOriginForgeActorController(gpu);
    captureScene.add(originForgeActorController.getActor());
    // originForgeActorController.getActor().transform.position = new Vector3(2, 0, 0);

    // //
    // // screen space object
    // //

    screenSpaceRaymarchMesh = createScreenSpaceRaymarchMesh({ gpu });
    screenSpaceRaymarchMesh.enabled = false;
    captureScene.add(screenSpaceRaymarchMesh);

    //
    // text mesh
    //

    // const fontAtlasImg = await loadImg(fontAtlasImgUrl);
    // // const fontAtlasImg = await loadImgArraybuffer(fontAtlasImgUrl);
    // const fontAtlasTexture = new Texture({
    //     gpu,
    //     // for default img
    //     img: fontAtlasImg,
    //     /*
    //     // for gpu texture
    //     img: null,
    //     arraybuffer: fontAtlasImg,
    //     dxt1: true
    //     mipmap: false,
    //     */
    //     flipY: false,
    //     minFilter: TextureFilterTypes.Linear,
    //     magFilter: TextureFilterTypes.Linear,
    // });
    // const textMesh1 = new TextMesh({
    //     gpu,
    //     text: 'Flux Flow',
    //     color: new Color(3, 1, 1, 1),
    //     fontTexture: fontAtlasTexture,
    //     fontAtlas: fontAtlasJson,
    //     castShadow: false,
    //     align: TextAlignType.Center,
    //     // characterSpacing: -0.2
    //     characterSpacing: -0.16,
    // });
    // textMesh1.transform.position = new Vector3(0, 1, 0);
    // // textMesh1.transform.rotation.setRotationX(-90);
    // textMesh1.transform.scale = Vector3.fill(0.5);
    // // TODO: 使えないかもなので一旦消しておく
    // textMesh1.enabled = false;
    // // captureScene.add(textMesh1);

    //
    // build marionetter scene
    //

    buildScene(sceneJsonUrl as unknown as MarionetterScene);

    if (import.meta.env.VITE_HOT_RELOAD === 'true') {
        marionetter.connect();
        // initHotReloadAndParseScene();
        initHotReloadAndParseScene(marionetter, marionetterSceneStructure!, captureScene, (structure) => {
            marionetterSceneStructure = structure;
        });
    }

    //
    // timelineでsceneを構築した後の処理
    //

    const morphFollowersActorControllerEntities: MorphFollowerActorControllerEntity[] = [];

    [ATTRACTOR_TARGET_BOX_ROOT_ACTOR_A, ATTRACTOR_TARGET_BOX_ROOT_ACTOR_B].forEach((name) => {
        const actor = captureScene.find(name) as Actor;
        attractorTargetBoxActors.push(actor);
    });
    [ATTRACTOR_TARGET_SPHERE_ACTOR_A_NAME, ATTRACTOR_TARGET_SPHERE_ACTOR_B_NAME].forEach((name) => {
        const actor = captureScene.find(name) as Actor;
        attractorTargetSphereActors.push(actor);
    });

    morphFollowersActorControllerBinders.forEach((elem, i) => {
        const orbitActor = captureScene.find(elem.orbitFollowTargetActorName) as Actor;
        orbitActor.addComponent(createOrbitMoverBinder());

        morphFollowersActorControllerEntities.push({
            morphFollowersActorController: elem.morphFollowersActorController,
            orbitFollowTargetActor: orbitActor,
        });
        elem.morphFollowersActorController.initialize(
            i,
            i * 2048,
            // originForgeActorController.getDefaultSurfaceParameters(),
            orbitActor,
            attractorTargetBoxActors,
            attractorTargetSphereActors
        );
    });

    originForgeActorController.initialize(
        morphFollowersActorControllerEntities,
        [
            ORIGIN_FORGE_GATHER_CHILD_ACTOR_NAME_1,
            ORIGIN_FORGE_GATHER_CHILD_ACTOR_NAME_2,
            ORIGIN_FORGE_GATHER_CHILD_ACTOR_NAME_3,
            ORIGIN_FORGE_GATHER_CHILD_ACTOR_NAME_4,
        ].map((name) => captureScene.find(name) as Actor)
    );

    //
    // camera, focus target
    //

    const focusTargetActor = captureScene.find(DEPTH_OF_FIELD_TARGET_ACTOR_NAME)!;

    const focusTargetHandShake = createTimelineHandShakeController({
        amplitude: new Vector3(0.1, 0.1, 0.1),
        speed: new Vector3(1.6, 1.4, 1.2),
        offset: new Vector3(4, 5, 6),
    });
    focusTargetActor.onProcessPropertyBinder = (key, string) => focusTargetHandShake.updatePropertyBinder(key, string);

    captureSceneCamera?.addComponent(
        createDofFocusTargetController(focusTargetActor, captureSceneCamera, renderer.depthOfFieldPass)
    );
    const captureSceneCameraHandShake = createTimelineHandShakeController({
        amplitude: new Vector3(0.1, 0.1, 0.1),
        speed: new Vector3(1.4, 1.2, 1.0),
        offset: new Vector3(1, 2, 3),
    });
    // TODO: timelineから制御したい
    captureSceneCamera?.addComponent(captureSceneCameraHandShake);
    captureSceneCamera!.onProcessPropertyBinder = (key, string) =>
        captureSceneCameraHandShake.updatePropertyBinder(key, string);

    //
    // floor
    //

    const floorMesh = createFloorActorController(
        gpu,
        captureScene.find(FLOOR_ACTOR_NAME) as Actor
    );
    captureScene.add(floorMesh);
    // (captureScene.find("BG")! as Mesh).material = new GBufferMaterial();

    //
    // override pp
    // TODO: ある程度はtimelineからいじりたい
    //

    //
    // events
    //

    // TODO: engine側に移譲したい
    const onWindowResize = () => {
        width = Math.floor(wrapperElement.offsetWidth);
        height = Math.floor(wrapperElement.offsetHeight);
        engine.setSize(width, height);
    };

    engine.onBeforeStart = () => {
        onWindowResize();
        window.addEventListener('resize', onWindowResize);
    };

    let timelineTime: number = 0;
    let timelinePrevTime: number = 0;
    let timelineDeltaTime: number = 0;

    engine.onBeforeUpdate = () => {
        if (glslSoundWrapper && marionetterSceneStructure && marionetterSceneStructure.marionetterTimeline) {
            if (glslSoundWrapper.isPlaying()) {
                currentTimeForTimeline = glslSoundWrapper.getCurrentTime()!;
            }
            timelineTime = snapToStep(currentTimeForTimeline, 1 / 60);
            timelineTime = clamp(timelineTime, 0, SOUND_DURATION);
            timelineDeltaTime = timelineTime - timelinePrevTime;
            timelinePrevTime = timelineTime;
            marionetterSceneStructure.marionetterTimeline.execute({
                time: timelineTime,
                scene: captureScene,
            });
        }
    };

    engine.onRender = (time) => {
        if (captureSceneCamera) {
            renderer.updateTimelineUniforms(timelineTime, timelineDeltaTime);
            renderer.render(captureScene, captureSceneCamera, { time, timelineTime, timelineDeltaTime });
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
    captureSceneCamera!.near = 0.1;
    captureSceneCamera!.far = 300;

    // let prevTime = -1;
    // let deltaTime = 0;
    // const tick = (time: number) => {
    const tick = (time: number) => {
        // if(prevTime < 0) {
        //     prevTime = time;
        //     return;
        // }
        // deltaTime = time - prevTime;

        // if (marionetterSceneStructure && marionetterSceneStructure.marionetterTimeline) {
        //     const t = marionetter.getCurrentTime();
        //     console.log(t)
        //     // const soundTime = glslSound.getCurrentTime();
        //     engine.run(t * 1000);
        // }

        engine.run(time);

        requestAnimationFrame(tick);
    };

    if (isDevelopment()) {
        // const bufferVisualizerPass = createBufferVisualizerPass({ gpu})
        // cameraPostProcess.addPass(bufferVisualizerPass);
        const debuggerGUI = initDebugger({
            bufferVisualizerPass,
            glslSound: glslSoundWrapper.glslSound!, // 存在しているとみなしちゃう
            playSound: glslSoundWrapper.play,
            stopSound: glslSoundWrapper.stop,
            renderer,
            wrapperElement,
            // directionalLight: captureScene.find(DIRECT_LIGHT_ACTOR_NAME)! as DirectionalLight,
            // directionalLight,
        });
        createPointLightDebugger(debuggerGUI, originForgeActorController.getPointLight(), 'point light');
    }

    // なぜか debugger の前だとうまくいかない
    renderer.fogPass.parameters.distanceFogStart = 28;
    renderer.fogPass.parameters.distanceFogPower = 0.02;
    renderer.fogPass.parameters.fogColor = Color.fromRGB(13, 16, 18);

    glslSoundWrapper.play();

    requestAnimationFrame(tick);
};

const main = async () => {
    await load();
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
