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
import { OrbitCameraController } from '@/PaleGL/core/OrbitCameraController';

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
import { RenderTargetTypes, TextureDepthPrecisionType, TextureFilterTypes } from '@/PaleGL/constants';

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
import { Marionetter, MarionetterScene, MarionetterSceneStructure } from '@/Marionetter/types';
import { buildMarionetterScene, buildMarionetterTimelineFromScene } from '@/Marionetter/buildMarionetterScene.ts';
// import { OrbitCameraController } from '@/PaleGL/core/OrbitCameraController.ts';
import { createPointLightDebugger, initDebugger } from './scripts/initDebugger.ts';
import { loadImg } from '@/PaleGL/loaders/loadImg.ts';
// import {loadImgArraybuffer} from '@/PaleGL/loaders/loadImg.ts';
import { Texture } from '@/PaleGL/core/Texture.ts';
import { TextAlignType, TextMesh } from '@/PaleGL/actors/TextMesh.ts';

// for default img
// noto sans
import fontAtlasImgUrl from '../assets/fonts/NotoSans-Bold-atlas-128_f-16_r-5_compress-256.png?url';
// import fontAtlasImgUrl from '../assets/fonts/NotoSans-Bold-atlas-128_f-16_r-5.png?url';
import fontAtlasJson from '../assets/fonts/NotoSans-Bold-atlas-128_f-16_r-5.json';
// fira sans
// import fontAtlasImgUrl from '../assets/fonts/FiraSansExtraCondensed-Bold-atlas-128_compresed.png?url';
// import fontAtlasJson from '../assets/fonts/FiraSansExtraCondensed-Bold-atlas-128.json';
// import fontAtlasImgUrl from '../assets/fonts/FiraSansExtraCondensed-Bold-atlas-64.png?url';
// import fontAtlasJson from '../assets/fonts/FiraSansExtraCondensed-Bold-atlas-64.json';
/*
// for gpu texture
import fontAtlasImgUrl from '../assets/fonts/NotoSans-Bold/NotoSans-Bold-atlas-128_f-16_r-5.dds?url';
import fontAtlasJson from '../assets/fonts/NotoSans-Bold/NotoSans-Bold-atlas-128_f-16_r-5.json';
*/
// import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/ObjectSpaceRaymarchMesh.ts';
import { initGLSLSound } from './scripts/initGLSLSound.ts';
// import { createMetaMorphActor } from './scripts/createMetaMorphActor.ts';
import { createOriginForgeActorController, OriginForgeActorController } from './scripts/originForgeActorController.ts';
// import { createScreenSpaceRaymarchMesh } from './scripts/createScreenSpaceRaymarchMesh.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import {
    createMorphFollowersActor,
    MorphFollowerActorControllerBinder,
    MorphFollowerActorControllerEntity,
} from './scripts/createMorphFollowersActorController.ts';
import { SOUND_DURATION } from './scripts/demoSequencer.ts';
import { Mesh } from '@/PaleGL/actors/Mesh.ts';
import {
    ATTRACTOR_ORBIT_MOVER_A,
    ATTRACTOR_ORBIT_MOVER_B,
    ATTRACTOR_ORBIT_MOVER_C,
    ATTRACTOR_TARGET_BOX_A_MESH,
    ATTRACTOR_TARGET_BOX_B_MESH,
    ATTRACTOR_TARGET_SPHERE_ACTOR,
    FOLLOWERS_ACTOR_NAME_A,
    FOLLOWERS_ACTOR_NAME_B,
    FOLLOWERS_ACTOR_NAME_C,
} from './scripts/demoConstants.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { createOrbitMoverBinder } from './scripts/orbitMoverBinder.ts';

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
let bufferVisualizerPass: BufferVisualizerPass;

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

const glslSoundWrapper = initGLSLSound(gpu, soundVertexShader, SOUND_DURATION);

let currentTimeForTimeline = 0;

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

// const captureSceneCamera = new PerspectiveCamera(70, 1, 0.1, 50);
// captureScene.add(captureSceneCamera);
// // captureSceneCamera.mainCamera = true;
// captureSceneCamera.name = "Main Camera";

let captureSceneCamera: PerspectiveCamera | null;
const orbitCameraController: OrbitCameraController = new OrbitCameraController();

const initMarionetter = () => {
    marionetter.connect();
};

let marionetterSceneStructure: MarionetterSceneStructure | null = null;

const buildScene = (sceneJson: MarionetterScene) => {
    console.log('[buildScene] scene json', sceneJson);
    // marionetterSceneStructure = buildMarionetterScene(gpu, sceneJson, captureScene);
    marionetterSceneStructure = buildMarionetterScene(gpu, sceneJson);
    // timeline生成したらscene内のactorをbind
    const { actors } = marionetterSceneStructure;

    marionetterSceneStructure.marionetterTimeline?.bindActors(captureScene.children);
    for (let i = 0; i < actors.length; i++) {
        captureScene.add(actors[i]);
    }

    captureSceneCamera = captureScene.find('MainCamera') as PerspectiveCamera;
    const directionalLight = captureScene.find('DirectionalLight') as DirectionalLight;

    // captureScene.find('CUBE_SCALE')!.onProcessClipFrame = (key, value) => {};

    orbitCameraController.setCamera(captureSceneCamera);
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
    orbitCameraController.enabled = false;
    orbitCameraController.enabledUpdateCamera = false;
    orbitCameraController.start();

    captureSceneCamera.subscribeOnStart(({ actor }) => {
        (actor as Camera).setClearColor(new Vector4(0, 0, 0, 1));
    });
    captureSceneCamera.onFixedUpdate = () => {
        // 1: fixed position
        // actor.transform.position = new Vector3(-7 * 1.1, 4.5 * 1.4, 11 * 1.2);
        // 2: orbit controls
        // if (inputController.isDown && debuggerStates.orbitControlsEnabled) {
        if (inputController.isDown && orbitCameraController.enabled) {
            orbitCameraController.setDelta(inputController.deltaNormalizedInputPosition);
        }
        if (inputController.isDown && orbitCameraController.enabled) {
            orbitCameraController.setDelta(inputController.deltaNormalizedInputPosition);
        }
        orbitCameraController.fixedUpdate();
    };

    const createSpotLightShadowMap = (spotLight: SpotLight) => {
        if (spotLight.shadowCamera) {
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
            console.log(spotLight, spotLight, spotLight.shadowMap);
        }
    };

    createSpotLightShadowMap(captureScene.find('SpotLightA') as SpotLight);
    createSpotLightShadowMap(captureScene.find('SpotLightB') as SpotLight);

    // shadows
    // TODO: directional light は constructor で shadow camera を生成してるのでこのガードいらない
    if (directionalLight && directionalLight.shadowCamera) {
        directionalLight.shadowCamera.visibleFrustum = true;
        directionalLight.castShadow = true;
        directionalLight.shadowCamera.near = 1;
        directionalLight.shadowCamera.far = 30;
        (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -12, 12, -12, 12);
        directionalLight.shadowMap = new RenderTarget({
            gpu,
            width: 1024,
            height: 1024,
            type: RenderTargetTypes.Depth,
        });

        // directionalLight.subscribeOnStart(({ actor }) => {
        //     actor.transform.setTranslation(new Vector3(-8, 8, -2));
        //     actor.transform.lookAt(new Vector3(0, 0, 0));
        // });
    }

    const cameraPostProcess = new PostProcess();

    bufferVisualizerPass = new BufferVisualizerPass({
        gpu,
    });
    bufferVisualizerPass.parameters.enabled = false;
    cameraPostProcess.addPass(bufferVisualizerPass);

    cameraPostProcess.enabled = true;
    // TODO: set post process いらないかも
    captureSceneCamera.setPostProcess(cameraPostProcess);

    console.log('scene', actors);
};

// TODO: この処理はビルド時には捨てたい
const initHotReloadAndParseScene = () => {
    const hotReloadScene = () => {
        console.log('hot reload scene...');
        void fetch('./assets/data/scene-hot-reload.json').then(async (res) => {
            const sceneJson = (await res.json()) as unknown as MarionetterScene;
            console.log('hot reload: scene', sceneJson);
            if (marionetterSceneStructure) {
                console.log('hot reload: marionetterSceneStructure', marionetterSceneStructure);
                marionetterSceneStructure.marionetterTimeline = buildMarionetterTimelineFromScene(
                    sceneJson,
                    marionetterSceneStructure.actors
                );
                marionetterSceneStructure.marionetterTimeline?.bindActors(captureScene.children);
            }
        });
    };
    marionetter.setHotReloadCallback(() => {
        hotReloadScene();
    });
    // hotReloadScene();
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
const attractorTargetBoxMeshes: Mesh[] = [];
// let metaMorphActor: ObjectSpaceRaymarchMesh;
let originForgeActorController: OriginForgeActorController;

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
        orbitFollowTargetActorName: ATTRACTOR_ORBIT_MOVER_B,
    });
    morphFollowersActorControllerBinders.push({
        morphFollowersActorController: createMorphFollowersActor({
            name: FOLLOWERS_ACTOR_NAME_C,
            gpu,
            renderer,
        }),
        orbitFollowTargetActorName: ATTRACTOR_ORBIT_MOVER_C,
    });

    morphFollowersActorControllerBinders.forEach((elem) => {
        captureScene.add(elem.morphFollowersActorController.getActor());
    });

    //
    // meta morph actor object
    //

    // metaMorphActor = createMetaMorphActor({
    //     gpu,
    //     renderer,
    //     // instanceNum: 12,
    // });
    // captureScene.add(metaMorphActor);

    //
    // origin forge actor object
    //

    originForgeActorController = createOriginForgeActorController(gpu);
    captureScene.add(originForgeActorController.getActor());
    // originForgeActorController.getActor().transform.position = new Vector3(2, 0, 0);

    // //
    // // screen space object
    // //

    // screenSpaceRaymarchMesh = createScreenSpaceRaymarchMesh({ gpu });
    // screenSpaceRaymarchMesh.enabled = false;
    // captureScene.add(screenSpaceRaymarchMesh);

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
        text: 'Meta Morph',
        color: new Color(3, 1, 1, 1),
        fontTexture: fontAtlasTexture,
        fontAtlas: fontAtlasJson,
        castShadow: false,
        align: TextAlignType.Center,
        // characterSpacing: -0.2
        characterSpacing: -0.16,
    });
    captureScene.add(textMesh1);
    textMesh1.transform.position = new Vector3(0, 1, 0);
    // textMesh1.transform.rotation.setRotationX(-90);
    textMesh1.transform.scale = Vector3.fill(0.5);

    //
    // build marionetter scene
    //

    buildScene(sceneJsonUrl as unknown as MarionetterScene);

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
    // timelineでsceneを構築した後の処理
    //

    const morphFollowersActorControllerEntities: MorphFollowerActorControllerEntity[] = [];
    const attractorTargetSphereActor = captureScene.find(ATTRACTOR_TARGET_SPHERE_ACTOR) as Actor;

    [ATTRACTOR_TARGET_BOX_A_MESH, ATTRACTOR_TARGET_BOX_B_MESH].forEach((name) => {
        const mesh = captureScene.find(name) as Mesh;
        attractorTargetBoxMeshes.push(mesh);
        mesh.renderEnabled = false;
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
            i * 1000,
            attractorTargetBoxMeshes,
            attractorTargetSphereActor
        );
    });

    originForgeActorController.initialize(morphFollowersActorControllerEntities);

    //
    // events
    //

    // TODO: engine側に移譲したい
    const onWindowResize = () => {
        width = Math.floor(wrapperElement.offsetWidth);
        height = Math.floor(wrapperElement.offsetHeight);
        inputController.setSize(width, height);
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
        inputController.update();

        // pattern_1: timeがRAFからわたってくる場合
        // if (marionetterSceneStructure && marionetterSceneStructure.marionetterTimeline) {
        //     // TODO: prodの時はこっちを使いたい
        //     // const soundTime = glslSound.getCurrentTime();
        //     // marionetterTimeline.execute(soundTime);
        //     marionetterSceneStructure.marionetterTimeline.execute({
        //         time: marionetter.getCurrentTime(),
        //         scene: captureScene,
        //     });
        //     // marionetterTimeline.execute(0);
        // }
        // if (captureSceneCamera) {
        //     renderer.render(captureScene, captureSceneCamera, { time, deltaTime });
        // }

        // pattern_2: timeがtimelineな場合
        if (glslSoundWrapper && marionetterSceneStructure && marionetterSceneStructure.marionetterTimeline) {
            if (glslSoundWrapper.isPlaying()) {
                // console.log(`[main] time: ${currentTimeForTimeline}`);
                currentTimeForTimeline = glslSoundWrapper.getCurrentTime()!;
            }
            const snapToStep = (v: number, s: number) => Math.floor(v / s) * s;
            timelineTime = snapToStep(currentTimeForTimeline, 1 / 60);
            timelineDeltaTime = timelineTime - timelinePrevTime;
            timelinePrevTime = timelineTime;
            // console.log('hogehoge', s);
            marionetterSceneStructure.marionetterTimeline.execute({
                time: timelineTime,
                scene: captureScene,
            });
            // originForgeActorController.updateSequence(currentTimeForTimeline);
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

    glslSoundWrapper.play();

    requestAnimationFrame(tick);

    const debuggerGUI = initDebugger({
        bufferVisualizerPass,
        glslSound: glslSoundWrapper.glslSound!, // 存在しているとみなしちゃう
        playSound: glslSoundWrapper.play,
        stopSound: glslSoundWrapper.stop,
        renderer,
        wrapperElement,
        orbitCameraController,
    });
    createPointLightDebugger(debuggerGUI, originForgeActorController.getPointLight(), 'point light');
};

const main = async () => {
    await load();
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
