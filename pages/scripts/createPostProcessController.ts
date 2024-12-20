import { Actor } from '@/PaleGL/actors/Actor.ts';
import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass.ts';
import { UniformNames } from '@/PaleGL/constants.ts';
import { Renderer } from '@/PaleGL/core/Renderer.ts';

export function createPostProcessController(
    renderer: Renderer,
    postProcessActor: Actor,
    blackCurtainPass: FragmentPass
) {
    postProcessActor.onProcessPropertyBinder = (key, value) => {
        // bloom
        if (key === 'bl_i') {
            renderer.bloomPass.parameters.bloomAmount = value;
            return;
        }
        // dof: focus range
        if (key === 'dof_fr') {
            renderer.depthOfFieldPass.parameters.focusRange = value;
            return;
        }
        // dof: bokeh radius
        if (key === 'dof_br') {
            renderer.depthOfFieldPass.parameters.bokehRadius = value;
            return;
        }
        // volumetric light ray step
        if (key === 'vl_rs') {
            renderer.volumetricLightPass.parameters.rayStep = value;
            return;
        }
        // color cover pass
        if (key === 'cbr') {
            blackCurtainPass.material.uniforms.setValue(UniformNames.BlendRate, value);
            return;
        }
        // glitch
        if (key === 'gl_r') {
            renderer.glitchPass.parameters.enabled = value > 0.001;
            renderer.glitchPass.parameters.blendRate = value;
            return;
        }
    };
}
