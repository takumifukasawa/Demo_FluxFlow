import { FaceSide } from '@/PaleGL/constants.ts';
import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/ObjectSpaceRaymarchMesh.ts';
import litObjectSpaceRaymarchFragContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-leader.glsl';
import gBufferObjectSpaceRaymarchFragDepthContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-leader.glsl';
import { Color } from '@/PaleGL/math/Color.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { createGBufferMaterialBinder } from '@/PaleGL/components/gbufferMaterialBinder.ts';
// import {Vector3} from "@/PaleGL/math/Vector3.ts";

export type LeaderActor = {
    getActor: () => Actor;
};

export const createLeaderActor = (gpu: GPU): LeaderActor => {
    const mesh = new ObjectSpaceRaymarchMesh({
        name: 'Leader',
        gpu,
        size: 1,
        fragmentShaderContent: litObjectSpaceRaymarchFragContent,
        depthFragmentShaderContent: gBufferObjectSpaceRaymarchFragDepthContent,
        materialArgs: {
            // fragmentShader: litObjectSpaceRaymarchMetaMorphFrag,
            // depthFragmentShader: gBufferObjectSpaceRaymarchMetaMorphDepthFrag,
            metallic: 0,
            roughness: 0,
            emissiveColor: new Color(4, 1, 1, 1),
            receiveShadow: true,
            useVertexColor: false,
            faceSide: FaceSide.Double,
        },
        castShadow: true,
    });
    // mesh.transform.scale = new Vector3(.5, .5, .5);
    // mesh.transform.position = new Vector3(0, 4, 0);
    // const rot = new Rotator(Quaternion.identity());
    // rot.setRotationX(90);
    // mesh.transform.rotation = rot;

    // let needsJumpPosition: boolean = false;

    // const setNeedsJumpPosition = (needsJump: boolean) => {
    //     needsJumpPosition = needsJump;
    // }

    mesh.addComponent(createGBufferMaterialBinder(mesh.material));

    return { getActor: () => mesh };
};
