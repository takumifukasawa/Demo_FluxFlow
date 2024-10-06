import { ScreenSpaceRaymarchMesh } from '@/PaleGL/actors/ScreenSpaceRaymarchMesh.ts';
import litScreenSpaceRaymarchFrag from '@/PaleGL/shaders/lit-screen-space-raymarch-fragment.glsl';
import gBufferScreenSpaceRaymarchDepthFrag from '@/PaleGL/shaders/gbuffer-screen-space-raymarch-depth-fragment.glsl';
import { Color } from '@/PaleGL/math/Color.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';

export const createScreenSpaceRaymarchMesh = ({ gpu }: { gpu: GPU }) => {
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
    // mesh.enabled = false;

    return mesh;
};
