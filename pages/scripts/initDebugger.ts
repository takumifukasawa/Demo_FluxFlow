import { BufferVisualizerPass } from '@/PaleGL/postprocess/BufferVisualizerPass.ts';
import { DebuggerGUI } from '@/DebuggerGUI.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import { GLSLSound } from '@/PaleGL/core/GLSLSound.ts';
import { Renderer } from '@/PaleGL/core/Renderer.ts';
import { OrbitCameraController } from '@/PaleGL/core/OrbitCameraController.ts';
import {PointLight} from "@/PaleGL/actors/PointLight.ts";

export function initDebugger({
    bufferVisualizerPass,
    glslSound,
    playSound,
    stopSound,
    renderer,
    wrapperElement,
    orbitCameraController,
}: {
    bufferVisualizerPass: BufferVisualizerPass;
    glslSound: GLSLSound;
    playSound: () => void;
    stopSound: () => void;
    renderer: Renderer;
    wrapperElement: HTMLElement;
    orbitCameraController: OrbitCameraController;
}): DebuggerGUI {
    const debuggerGUI = new DebuggerGUI();

    //
    // play sound
    //

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addButtonDebugger({
        buttonLabel: 'play sound',
        onClick: () => {
            playSound();
        },
    });

    debuggerGUI.addButtonDebugger({
        buttonLabel: 'stop sound',
        onClick: () => {
            stopSound();
        },
    });

    debuggerGUI.addSliderDebugger({
        label: 'seek sound',
        minValue: 0,
        maxValue: 144,
        stepValue: 0.01,
        initialValue: 0,
        onChange: (value) => {
            if (glslSound) {
                glslSound.play(value);
            }
        },
    });

    //
    // orbit controls
    //

    // debuggerGUI.addBorderSpacer();

    // debuggerGUI.addToggleDebugger({
    //     label: 'orbit controls enabled',
    //     // initialValue: debuggerStates.orbitControlsEnabled,
    //     // onChange: (value) => (debuggerStates.orbitControlsEnabled = value),
    //     initialValue: orbitCameraController.enabled,
    //     onChange: (value) => (orbitCameraController.enabled = value),
    // });

    //
    // show buffers
    //

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addToggleDebugger({
        label: 'show buffers',
        initialValue: bufferVisualizerPass.parameters.enabled,
        onChange: (value) => {
            bufferVisualizerPass.parameters.enabled = value;
            if (value) {
                bufferVisualizerPass.showDom();
            } else {
                bufferVisualizerPass.hideDom();
            }
        },
    });

    //
    // orbit controls
    //

    debuggerGUI.addBorderSpacer();

    debuggerGUI.addToggleDebugger({
        label: 'sync orbit controls',
        initialValue: orbitCameraController.enabledUpdateCamera,
        onChange: (value) => {
            // TODO: enabledになったときはその位置でorbit controlsしたいよね
            if (value) {
                orbitCameraController.enabledUpdateCamera = true;
            } else {
                orbitCameraController.enabledUpdateCamera = false;
            }
        },
    });

    // bufferVisualizerPass.beforeRender = () => {
    //     bufferVisualizerPass.material.uniforms.setValue(
    //         'uDirectionalLightShadowMap',
    //         directionalLight.shadowMap!.read.depthTexture
    //     );
    //     bufferVisualizerPass.material.uniforms.setValue(
    //         'uAmbientOcclusionTexture',
    //         renderer.ambientOcclusionPass.renderTarget.read.texture
    //     );
    //     bufferVisualizerPass.material.uniforms.setValue(
    //         'uDeferredShadingTexture',
    //         renderer.deferredShadingPass.renderTarget.read.texture
    //     );
    //     bufferVisualizerPass.material.uniforms.setValue(
    //         'uLightShaftTexture',
    //         renderer.lightShaftPass.renderTarget.read.texture
    //     );
    //     bufferVisualizerPass.material.uniforms.setValue('uFogTexture', renderer.fogPass.renderTarget.read.texture);
    // };

    //
    // ssao
    // TODO: ssao pass の参照を renderer に変える
    //

    debuggerGUI.addBorderSpacer();

    const ssaoDebuggerGroup = debuggerGUI.addGroup('ssao', false);

    ssaoDebuggerGroup.addToggleDebugger({
        label: 'ssao pass enabled',
        initialValue: renderer.ambientOcclusionPass.parameters.enabled,
        onChange: (value) => (renderer.ambientOcclusionPass.parameters.enabled = value),
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao occlusion sample length',
        minValue: 0.01,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.occlusionSampleLength,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionSampleLength = value;
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao occlusion bias',
        minValue: 0.0001,
        maxValue: 0.01,
        stepValue: 0.0001,
        initialValue: renderer.ambientOcclusionPass.occlusionBias,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionBias = value;
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao min distance',
        minValue: 0,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.occlusionMinDistance,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionMinDistance = value;
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao max distance',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.occlusionMaxDistance,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionMaxDistance = value;
        },
    });

    ssaoDebuggerGroup.addColorDebugger({
        label: 'ssao color',
        initialValue: renderer.ambientOcclusionPass.occlusionColor.getHexCoord(),
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionColor = Color.fromHex(value);
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao occlusion power',
        minValue: 0.5,
        maxValue: 4,
        stepValue: 0.01,
        initialValue: renderer.ambientOcclusionPass.occlusionPower,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionPower = value;
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao occlusion strength',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.occlusionStrength,
        onChange: (value) => {
            renderer.ambientOcclusionPass.occlusionStrength = value;
        },
    });

    ssaoDebuggerGroup.addSliderDebugger({
        label: 'ssao blend rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ambientOcclusionPass.blendRate,
        onChange: (value) => {
            renderer.ambientOcclusionPass.blendRate = value;
        },
    });

    //
    // light shaft
    //

    debuggerGUI.addBorderSpacer();

    const lightShaftDebuggerGroup = debuggerGUI.addGroup('light shaft', false);

    lightShaftDebuggerGroup.addToggleDebugger({
        label: 'light shaft pass enabled',
        initialValue: renderer.lightShaftPass.parameters.enabled,
        onChange: (value) => (renderer.lightShaftPass.parameters.enabled = value),
    });

    lightShaftDebuggerGroup.addSliderDebugger({
        label: 'blend rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.lightShaftPass.parameters.blendRate,
        onChange: (value) => {
            renderer.lightShaftPass.parameters.blendRate = value;
        },
    });

    lightShaftDebuggerGroup.addSliderDebugger({
        label: 'pass scale',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.lightShaftPass.parameters.passScaleBase,
        onChange: (value) => {
            renderer.lightShaftPass.parameters.passScaleBase = value;
        },
    });

    lightShaftDebuggerGroup.addSliderDebugger({
        label: 'ray step strength',
        minValue: 0.001,
        maxValue: 0.05,
        stepValue: 0.001,
        initialValue: renderer.lightShaftPass.parameters.rayStepStrength,
        onChange: (value) => {
            renderer.lightShaftPass.parameters.rayStepStrength = value;
        },
    });

    //
    // light volume pass
    //

    debuggerGUI.addBorderSpacer();

    const volumetricLightDebuggerGroup = debuggerGUI.addGroup('volumetric light', false);

    volumetricLightDebuggerGroup.addSliderDebugger({
        label: 'ray step',
        initialValue: renderer.volumetricLightPass.parameters.rayStep,
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.parameters.rayStep = value;
        },
    });
    volumetricLightDebuggerGroup.addSliderDebugger({
        label: 'density multiplier',
        initialValue: renderer.volumetricLightPass.parameters.densityMultiplier,
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.parameters.densityMultiplier = value;
        },
    });
    volumetricLightDebuggerGroup.addSliderDebugger({
        label: 'jitter size x',
        initialValue: renderer.volumetricLightPass.parameters.rayJitterSizeX,
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.parameters.rayJitterSizeX = value;
        },
    });
    volumetricLightDebuggerGroup.addSliderDebugger({
        label: 'jitter size y',
        initialValue: renderer.volumetricLightPass.parameters.rayJitterSizeY,
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.parameters.rayJitterSizeY = value;
        },
    });
    volumetricLightDebuggerGroup.addSliderDebugger({
        label: 'blend rate',
        initialValue: renderer.volumetricLightPass.parameters.blendRate,
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        onChange: (value) => {
            renderer.volumetricLightPass.parameters.blendRate = value;
        },
    });

    debuggerGUI.addBorderSpacer();

    const fogDebuggerGroup = debuggerGUI.addGroup('fog', false);

    // fogDebuggerGroup.addToggleDebugger({
    //     label: 'fog pass enabled',
    //     initialValue: renderer.lightShaftPass.enabled,
    //     onChange: (value) => (renderer.lightShaftPass.enabled = value),
    // });

    fogDebuggerGroup.addColorDebugger({
        label: 'fog color',
        initialValue: renderer.fogPass.parameters.fogColor.getHexCoord(),
        onChange: (value) => {
            renderer.fogPass.parameters.fogColor = Color.fromHex(value);
        },
    });

    fogDebuggerGroup.addSliderDebugger({
        label: 'strength',
        minValue: 0,
        maxValue: 0.2,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.parameters.fogStrength,
        onChange: (value) => {
            renderer.fogPass.parameters.fogStrength = value;
        },
    });

    fogDebuggerGroup.addSliderDebugger({
        label: 'density',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.parameters.fogDensity,
        onChange: (value) => {
            renderer.fogPass.parameters.fogDensity = value;
        },
    });

    fogDebuggerGroup.addSliderDebugger({
        label: 'attenuation',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.parameters.fogDensityAttenuation,
        onChange: (value) => {
            renderer.fogPass.parameters.fogDensityAttenuation = value;
        },
    });

    fogDebuggerGroup.addSliderDebugger({
        label: 'fog end height',
        minValue: -5,
        maxValue: 5,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.parameters.fogEndHeight,
        onChange: (value) => {
            renderer.fogPass.parameters.fogEndHeight = value;
        },
    });

    fogDebuggerGroup.addSliderDebugger({
        label: 'distance fog start',
        minValue: 0,
        maxValue: 100,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.parameters.distanceFogPower,
        onChange: (value) => {
            renderer.fogPass.parameters.distanceFogStart = value;
        },
    });
    
    fogDebuggerGroup.addSliderDebugger({
        label: 'distance fog power',
        minValue: 0,
        maxValue: 0.2,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.parameters.distanceFogPower,
        onChange: (value) => {
            renderer.fogPass.parameters.distanceFogPower = value;
        },
    });
    
    fogDebuggerGroup.addSliderDebugger({
        label: 'blend rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.0001,
        initialValue: renderer.fogPass.parameters.blendRate,
        onChange: (value) => {
            renderer.fogPass.parameters.blendRate = value;
        },
    });



    //
    // depth of field
    //

    debuggerGUI.addBorderSpacer();

    const dofDebuggerGroup = debuggerGUI.addGroup('depth of field', false);

    dofDebuggerGroup.addToggleDebugger({
        label: 'DoF pass enabled',
        initialValue: renderer.depthOfFieldPass.enabled,
        onChange: (value) => (renderer.depthOfFieldPass.enabled = value),
    });

    dofDebuggerGroup.addSliderDebugger({
        label: 'DoF focus distance',
        minValue: 0.1,
        maxValue: 100,
        stepValue: 0.001,
        initialValue: renderer.depthOfFieldPass.parameters.focusDistance,
        onChange: (value) => {
            renderer.depthOfFieldPass.parameters.focusDistance = value;
        },
    });

    dofDebuggerGroup.addSliderDebugger({
        label: 'DoF focus range',
        minValue: 0.1,
        maxValue: 20,
        stepValue: 0.001,
        initialValue: renderer.depthOfFieldPass.parameters.focusRange,
        onChange: (value) => {
            renderer.depthOfFieldPass.parameters.focusRange = value;
        },
    });

    dofDebuggerGroup.addSliderDebugger({
        label: 'DoF bokeh radius',
        minValue: 0.01,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.depthOfFieldPass.parameters.bokehRadius,
        onChange: (value) => {
            renderer.depthOfFieldPass.parameters.bokehRadius = value;
        },
    });

    //
    // bloom
    //

    debuggerGUI.addBorderSpacer();

    const bloomDebuggerGroup = debuggerGUI.addGroup('bloom', false);

    bloomDebuggerGroup.addToggleDebugger({
        label: 'Bloom pass enabled',
        initialValue: renderer.bloomPass.parameters.enabled,
        onChange: (value) => (renderer.bloomPass.parameters.enabled = value),
    });

    bloomDebuggerGroup.addSliderDebugger({
        label: 'bloom amount',
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: renderer.bloomPass.parameters.bloomAmount,
        onChange: (value) => {
            renderer.bloomPass.parameters.bloomAmount = value;
        },
    });

    bloomDebuggerGroup.addSliderDebugger({
        label: 'bloom threshold',
        minValue: 0,
        maxValue: 2,
        stepValue: 0.001,
        initialValue: renderer.bloomPass.parameters.threshold,
        onChange: (value) => {
            renderer.bloomPass.parameters.threshold = value;
        },
    });

    bloomDebuggerGroup.addSliderDebugger({
        label: 'bloom tone',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.bloomPass.parameters.tone,
        onChange: (value) => {
            renderer.bloomPass.parameters.tone = value;
        },
    });

    //
    // streak debuggers
    //

    debuggerGUI.addBorderSpacer();

    const streakDebuggerGroup = debuggerGUI.addGroup('streak', false);

    streakDebuggerGroup.addSliderDebugger({
        label: 'threshold',
        minValue: 0,
        maxValue: 4,
        stepValue: 0.001,
        initialValue: renderer.streakPass.parameters.threshold,
        onChange: (value) => {
            renderer.streakPass.parameters.threshold = value;
        },
    });
    streakDebuggerGroup.addSliderDebugger({
        label: 'vertical scale',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.streakPass.parameters.verticalScale,
        onChange: (value) => {
            renderer.streakPass.parameters.verticalScale = value;
        },
    });
    streakDebuggerGroup.addSliderDebugger({
        label: 'horizontal scale',
        minValue: 0,
        maxValue: 2,
        stepValue: 0.001,
        initialValue: renderer.streakPass.parameters.horizontalScale,
        onChange: (value) => {
            renderer.streakPass.parameters.horizontalScale = value;
        },
    });

    streakDebuggerGroup.addSliderDebugger({
        label: 'stretch',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.streakPass.parameters.stretch,
        onChange: (value) => {
            renderer.streakPass.parameters.stretch = value;
        },
    });
    streakDebuggerGroup.addColorDebugger({
        label: 'color',
        initialValue: renderer.streakPass.parameters.color.getHexCoord(),
        onChange: (value) => {
            renderer.streakPass.parameters.color = Color.fromHex(value);
        },
    });
    streakDebuggerGroup.addSliderDebugger({
        label: 'intensity',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.streakPass.parameters.intensity,
        onChange: (value) => {
            renderer.streakPass.parameters.intensity = value;
        },
    });

    //
    // ssr debuggers
    //

    debuggerGUI.addBorderSpacer();

    const ssrDebuggerGroup = debuggerGUI.addGroup('ssr', false);

    ssrDebuggerGroup.addToggleDebugger({
        label: 'ssr pass enabled',
        initialValue: renderer.ssrPass.parameters.enabled,
        onChange: (value) => (renderer.ssrPass.parameters.enabled = value),
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'depth bias',
        minValue: 0.001,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.parameters.rayDepthBias,
        onChange: (value) => {
            renderer.ssrPass.parameters.rayDepthBias = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'ray nearest distance',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.parameters.rayNearestDistance,
        onChange: (value) => {
            renderer.ssrPass.parameters.rayNearestDistance = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'ray max distance',
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.parameters.rayMaxDistance,
        onChange: (value) => {
            renderer.ssrPass.parameters.rayMaxDistance = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'ray thickness',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.parameters.reflectionRayThickness,
        onChange: (value) => {
            renderer.ssrPass.parameters.reflectionRayThickness = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'jitter size x',
        minValue: 0.001,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.parameters.reflectionRayJitterSizeX,
        onChange: (value) => {
            renderer.ssrPass.parameters.reflectionRayJitterSizeX = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'jitter size y',
        minValue: 0.001,
        maxValue: 0.1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.parameters.reflectionRayJitterSizeY,
        onChange: (value) => {
            renderer.ssrPass.parameters.reflectionRayJitterSizeY = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'fade min distance',
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.parameters.reflectionFadeMinDistance,
        onChange: (value) => {
            renderer.ssrPass.parameters.reflectionFadeMinDistance = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'fade max distance',
        minValue: 0.001,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.parameters.reflectionFadeMaxDistance,
        onChange: (value) => {
            renderer.ssrPass.parameters.reflectionFadeMaxDistance = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'edge fade factor min x',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.parameters.reflectionScreenEdgeFadeFactorMinX,
        onChange: (value) => {
            renderer.ssrPass.parameters.reflectionScreenEdgeFadeFactorMinX = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'edge fade factor max x',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.parameters.reflectionScreenEdgeFadeFactorMaxX,
        onChange: (value) => {
            renderer.ssrPass.parameters.reflectionScreenEdgeFadeFactorMaxX = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'edge fade factor min y',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.parameters.reflectionScreenEdgeFadeFactorMinY,
        onChange: (value) => {
            renderer.ssrPass.parameters.reflectionScreenEdgeFadeFactorMinY = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'edge fade factor max y',
        minValue: 0.001,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.ssrPass.parameters.reflectionScreenEdgeFadeFactorMaxY,
        onChange: (value) => {
            renderer.ssrPass.parameters.reflectionScreenEdgeFadeFactorMaxY = value;
        },
    });

    ssrDebuggerGroup.addSliderDebugger({
        label: 'additional rate',
        minValue: 0.01,
        maxValue: 1,
        stepValue: 0.01,
        initialValue: renderer.ssrPass.parameters.reflectionAdditionalRate,
        onChange: (value) => {
            renderer.ssrPass.parameters.reflectionAdditionalRate = value;
        },
    });
    
    //
    // glitch
    //
    
    debuggerGUI.addBorderSpacer();
    
    const glitchDebuggerGroup = debuggerGUI.addGroup('glitch', false);
    
    glitchDebuggerGroup.addToggleDebugger({
        label: 'glitch pass enabled',
        initialValue: renderer.glitchPass.parameters.enabled,
        onChange: (value) => (renderer.glitchPass.parameters.enabled = value),
    });
    
    glitchDebuggerGroup.addSliderDebugger({
        label: 'glitch blend rate',
        minValue: 0,
        maxValue: 1,
        stepValue: 0.001,
        initialValue: renderer.glitchPass.parameters.blendRate,
        onChange: (value) => {
            renderer.glitchPass.parameters.blendRate = value;
        },
    });

    //
    // add debugger ui
    //

    wrapperElement.appendChild(debuggerGUI.domElement);
   
    //
    // result
    //
    
    return debuggerGUI;
}


export function createPointLightDebugger (debuggerGUI: DebuggerGUI, pointLight: PointLight, label: string) {
    debuggerGUI.addBorderSpacer();

    const pointLightDebuggerGroup = debuggerGUI.addGroup(label, false);

    pointLightDebuggerGroup.addColorDebugger({
        label: 'color',
        initialValue: pointLight.color.getHexCoord(),
        onChange: (value) => {
            pointLight.color = Color.fromHex(value);
        },
    });

    pointLightDebuggerGroup.addSliderDebugger({
        label: 'intensity',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: pointLight.intensity,
        onChange: (value) => {
            pointLight.intensity = value;
        },
    });

    pointLightDebuggerGroup.addSliderDebugger({
        label: 'distance',
        minValue: 0,
        maxValue: 100,
        stepValue: 0.01,
        initialValue: pointLight.distance,
        onChange: (value) => {
            pointLight.distance = value;
        },
    });

    pointLightDebuggerGroup.addSliderDebugger({
        label: 'attenuation',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: pointLight.attenuation,
        onChange: (value) => {
            pointLight.attenuation = value;
        },
    });

    pointLightDebuggerGroup.addSliderDebugger({
        label: 'pos x',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: pointLight.transform.position.x,
        onChange: (value) => {
            pointLight.transform.position.x = value;
        },
    });

    pointLightDebuggerGroup.addSliderDebugger({
        label: 'pos y',
        minValue: 0,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: pointLight.transform.position.y,
        onChange: (value) => {
            pointLight.transform.position.y = value;
        },
    });

    pointLightDebuggerGroup.addSliderDebugger({
        label: 'pos z',
        minValue: -10,
        maxValue: 10,
        stepValue: 0.001,
        initialValue: pointLight.transform.position.z,
        onChange: (value) => {
            pointLight.transform.position.z = value;
        },
    });
}
