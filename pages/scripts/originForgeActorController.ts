import { GPU } from '@/PaleGL/core/GPU.ts';
import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/ObjectSpaceRaymarchMesh.ts';
import litObjectSpaceRaymarchFragOriginForgeContent from '@/PaleGL/shaders/lit-object-space-raymarch-fragment-origin-forge.glsl';
import gBufferObjectSpaceRaymarchFragOriginForgeDepthContent from '@/PaleGL/shaders/gbuffer-object-space-raymarch-depth-fragment-origin-forge.glsl';
import { Color } from '@/PaleGL/math/Color.ts';
import { FaceSide } from '@/PaleGL/constants.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';

export type OriginForgeActorController = {
    getActor: () => Actor;
};

export function createOriginForgeActorController(gpu: GPU): OriginForgeActorController {
    const mesh = new ObjectSpaceRaymarchMesh({
        gpu,
        size: 1,
        fragmentShaderContent: litObjectSpaceRaymarchFragOriginForgeContent,
        depthFragmentShaderContent: gBufferObjectSpaceRaymarchFragOriginForgeDepthContent,
        materialArgs: {
            metallic: 0,
            roughness: 0,
            emissiveColor: new Color(.1, .1, 3., 1),
            receiveShadow: true,
            faceSide: FaceSide.Double,
        },
        castShadow: true,
    });
    mesh.transform.scale.set(4, 4, 4);
    return {
        getActor: () => mesh,
    };
}
