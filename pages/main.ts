import { DirectionalLight } from '@/PaleGL/actors/DirectionalLight';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera';
import { Engine } from '@/PaleGL/core/Engine';
import { Renderer } from '@/PaleGL/core/Renderer';
import { GPU } from '@/PaleGL/core/GPU';
import { Scene } from '@/PaleGL/core/Scene';
import { Vector3 } from '@/PaleGL/math/Vector3';
import { Vector4 } from '@/PaleGL/math/Vector4';
import sceneJsonUrl from './data/scene.json';
import { Camera } from '@/PaleGL/actors/Camera';
import { PostProcess } from '@/PaleGL/postprocess/PostProcess.ts';
import soundVertexShader from '@/PaleGL/shaders/sound-vertex-demo.glsl';
import { wait } from '@/utilities/wait.ts';
import { createMarionetter } from '@/Marionetter/createMarionetter.ts';
import { SpotLight } from '@/PaleGL/actors/SpotLight.ts';
import { Marionetter, MarionetterSceneStructure } from '@/Marionetter/types';
import { MarionetterScene } from '@/Marionetter/types';
import { buildMarionetterScene } from '@/Marionetter/buildMarionetterScene.ts';
import { createPointLightDebugger, initDebugger } from './scripts/initDebugger.ts';

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
    DEMO_MANAGER_ACTOR_NAME,
    DEPTH_OF_FIELD_TARGET_ACTOR_NAME,
    DIRECT_LIGHT_ACTOR_NAME,
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
import { BufferVisualizerPass } from '@/PaleGL/postprocess/BufferVisualizerPass.ts';
import { snapToStep } from '@/Marionetter/timelineUtilities.ts';
import { clamp, lerp } from '@/PaleGL/utilities/mathUtilities.ts';
import { createBlackCurtainPass } from './scripts/createBlackCurtainPass.ts';
import { SharedTexturesTypes } from '@/PaleGL/core/createSharedTextures.ts';
import { createStartupLayer } from './scripts/createStartupLayer.ts';
import { createIngameLayer } from './scripts/createIngameLayer.ts';
import { createSpotLightController } from './scripts/createSpotLightController.ts';
import { createDirectionalLightController } from './scripts/createDirectionalLightController.ts';
import { createPostProcessController } from './scripts/createPostProcessController.ts';

const wrapperElement = document.createElement('div');
document.body.appendChild(wrapperElement);
wrapperElement.setAttribute('id', 'wrapper');

const canvasElement = document.createElement('canvas')!;
wrapperElement.appendChild(canvasElement);

const gl = canvasElement.getContext('webgl2', { antialias: false });

if (!gl) {
    throw 'invalid gl';
}

const gpu = new GPU(gl);

let width: number, height: number;
let captureSceneCamera: PerspectiveCamera | null;
let marionetterSceneStructure: MarionetterSceneStructure | null = null;
let cameraPostProcess: PostProcess;
let currentTimeForTimeline = 0;
let timelineTime: number = 0;
let timelinePrevTime: number = 0;
let timelineDeltaTime: number = 0;

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
    // demo manager
    //

    const demoManagerActor = captureScene.find(DEMO_MANAGER_ACTOR_NAME) as Actor;
    demoManagerActor.onProcessPropertyBinder = (key, value) => {
        if (key === 'ga') {
            if (value > 0.5) {
                ingameLayer.fadeInGreeting();
            } else {
                ingameLayer.fadeOutGreeting();
            }
        }
    };

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

    createPostProcessController(renderer, captureScene.find(POST_PROCESS_ACTOR_NAME) as Actor, blackCurtainPass);

    //
    // spot light
    //

    createSpotLightController(gpu, captureScene.find(SPOT_LIGHT_ACTOR_NAME_A) as SpotLight);
    createSpotLightController(gpu, captureScene.find(SPOT_LIGHT_ACTOR_NAME_B) as SpotLight);

    //
    // directional light and shadows
    //

    createDirectionalLightController(gpu, captureScene.find(DIRECT_LIGHT_ACTOR_NAME) as DirectionalLight);

    //
    // pp
    //

    cameraPostProcess = new PostProcess();
    cameraPostProcess.enabled = true;

    cameraPostProcess.addPass(blackCurtainPass);
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

const startupLayer = createStartupLayer(() => {
    playDemo();
});
document.body.appendChild(startupLayer.rootElement);

const ingameLayer = createIngameLayer();
document.body.appendChild(ingameLayer.rootElement);

const morphFollowersActorControllerBinders: MorphFollowerActorControllerBinder[] = [];
const attractorTargetBoxActors: Actor[] = [];
const attractorTargetSphereActors: Actor[] = [];
let originForgeActorController: OriginForgeActorController;

// eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/ban-ts-comment
const load = async () => {
    startupLayer.setLoadingPercentile(10);

    await wait(500);

    glslSoundWrapper.load();
    // glslSoundWrapper.warmup();

    await wait(500);

    // parseScene(sceneJsonUrl as unknown as MarionetterScene);
    console.log('====== main ======');
    console.log(import.meta.env);
    // console.log(sceneJsonUrl);
    
    startupLayer.setLoadingPercentile(50);

    await wait(500);

    //
    // morph follower actor controller
    //
    morphFollowersActorControllerBinders.push({
        _morphFollowersActorController: createMorphFollowersActor(
            FOLLOWERS_ACTOR_NAME_A,
            gpu,
            renderer,
            96,
            (rx, ry, rz) => Color.fromRGB(lerp(20, 200, rx), lerp(20, 40, ry), lerp(20, 200, rz)),
            (rx, ry, rz) => Color.fromRGB(lerp(20, 200, rx) * 3, lerp(20, 40, ry), lerp(20, 200, rz) * 3)
        ),
        _orbitFollowTargetActorName: ATTRACTOR_ORBIT_MOVER_A,
    });
    morphFollowersActorControllerBinders.push({
        _morphFollowersActorController: createMorphFollowersActor(
            FOLLOWERS_ACTOR_NAME_B,
            gpu,
            renderer,
            80,
            (rx, ry, rz) => Color.fromRGB(lerp(20, 40, rx), lerp(20, 200, ry), lerp(20, 200, rz)),
            (rx, ry, rz) => Color.fromRGB(lerp(20, 40, rx) * 3, lerp(20, 200, ry), lerp(20, 200, rz) * 3)
        ),
        _orbitFollowTargetActorName: ATTRACTOR_ORBIT_MOVER_C,
    });
    morphFollowersActorControllerBinders.push({
        _morphFollowersActorController: createMorphFollowersActor(
            FOLLOWERS_ACTOR_NAME_C,
            gpu,
            renderer,
            80,
            (rx, ry, rz) => Color.fromRGB(lerp(20, 200, rx), lerp(20, 200, ry), lerp(20, 40, rz)),
            (rx, ry, rz) => Color.fromRGB(lerp(20, 200, rx) * 3, lerp(20, 200, ry), lerp(20, 40, rz) * 3)
        ),
        _orbitFollowTargetActorName: ATTRACTOR_ORBIT_MOVER_B,
    });

    morphFollowersActorControllerBinders.forEach((elem) => {
        captureScene.add(elem._morphFollowersActorController.getActor());
    });

    //
    // origin forge actor object
    //

    originForgeActorController = createOriginForgeActorController(gpu);
    captureScene.add(originForgeActorController.getActor());
    captureScene.add(originForgeActorController.getPointLight());
    
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
        const orbitActor = captureScene.find(elem._orbitFollowTargetActorName) as Actor;
        orbitActor.addComponent(createOrbitMoverBinder());

        morphFollowersActorControllerEntities.push({
            _morphFollowersActorController: elem._morphFollowersActorController,
            _orbitFollowTargetActor: orbitActor,
        });
        elem._morphFollowersActorController.initialize(
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
        captureScene.find(FLOOR_ACTOR_NAME) as Actor,
        engine.sharedTextures[SharedTexturesTypes.FBM_NOISE].texture
    );
    captureScene.add(floorMesh);
    // (captureScene.find("BG")! as Mesh).material = new GBufferMaterial();

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
            //
            // render
            //

            renderer.updateTimelineUniforms(timelineTime, timelineDeltaTime); // TODO: engineかなにかに組み込みたい
            renderer.render(captureScene, captureSceneCamera, engine.sharedTextures, {
                time,
                timelineTime,
                timelineDeltaTime,
            });
        }
    };

    engine.start();

    await wait(1);

    engine.warmRender();

    startupLayer.setLoadingPercentile(100);

    await wait(1);
    // await wait(1200);

    startupLayer.hideLoading();
    startupLayer.showMenu();
};

const playDemo = () => {
    captureSceneCamera!.near = 1;
    captureSceneCamera!.far = 500;

    const tick = (time: number) => {
        engine.run(time);

        requestAnimationFrame(tick);
    };

    if (isDevelopment()) {
        const debuggerGUI = initDebugger({
            bufferVisualizerPass,
            glslSound: glslSoundWrapper.glslSound!, // 存在しているとみなしちゃう
            playSound: glslSoundWrapper.play,
            stopSound: glslSoundWrapper.stop,
            renderer,
            wrapperElement,
        });
        createPointLightDebugger(debuggerGUI, originForgeActorController.getPointLight(), 'point light');
    }

    //
    // override pp values
    // なぜか debugger の前だとうまくいかない
    //

    renderer.fogPass.parameters.sssFogColor = originForgeActorController.getPointLight().color;

    renderer.fogPass.parameters.distanceFogStart = 28;
    renderer.fogPass.parameters.distanceFogEnd = 150;
    renderer.fogPass.parameters.distanceFogPower = 0.02;
    renderer.fogPass.parameters.fogColor = Color.fromRGB(13, 16, 18);
    renderer.fogPass.parameters.sssFogRate = 0.029;

    renderer.streakPass.parameters.threshold = 0.28;
    renderer.streakPass.parameters.verticalScale = 5.487;
    renderer.streakPass.parameters.horizontalScale = 0.708;
    renderer.streakPass.parameters.stretch = 1;
    renderer.streakPass.parameters.intensity = 0.124;

    renderer.depthOfFieldPass.parameters.focusRange = 3.74;
    renderer.depthOfFieldPass.parameters.bokehRadius = 2.898;

    renderer.ssrPass.parameters.rayDepthBias = 0.047;
    renderer.ssrPass.parameters.rayNearestDistance = 0.089;
    renderer.ssrPass.parameters.rayMaxDistance = 2;
    renderer.ssrPass.parameters.reflectionRayThickness = 0.579;
    renderer.ssrPass.parameters.reflectionRayJitterSizeY = 0.003;
    renderer.ssrPass.parameters.reflectionRayJitterSizeY = 0.003;

    renderer.volumetricLightPass.parameters.rayStep = 0.496;
    renderer.volumetricLightPass.parameters.densityMultiplier = 0.6;
    renderer.volumetricLightPass.parameters.rayJitterSize.x = 0.1;
    renderer.volumetricLightPass.parameters.rayJitterSize.y = 0.1;
    renderer.volumetricLightPass.parameters.rayJitterSize.z = 0.2;

    renderer.screenSpaceShadowPass.parameters.jitterSize = new Vector3(0.09, 0.09, 0);
    renderer.screenSpaceShadowPass.parameters.sharpness = 1.015;
    renderer.screenSpaceShadowPass.parameters.strength = 2.973;

    renderer.chromaticAberrationPass.parameters.scale = 0.041;
    renderer.chromaticAberrationPass.parameters.power = 1.236;

    //
    // exec
    //

    glslSoundWrapper.play();

    requestAnimationFrame(tick);
};

const main = async () => {
    await load();
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
