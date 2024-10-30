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
        if(key === 'bl_i') {
            renderer.bloomPass.parameters.bloomAmount = value;
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
    };
}
