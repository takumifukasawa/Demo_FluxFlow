import { FaceSide } from '@/PaleGL/constants.ts';
import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/ObjectSpaceRaymarchMesh.ts';
import litObjectSpaceRaymarchFragContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-meta-morph.glsl';
import gBufferObjectSpaceRaymarchFragDepthContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-meta-morph.glsl';
import { Color } from '@/PaleGL/math/Color.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
// import {Vector3} from "@/PaleGL/math/Vector3.ts";

export type LeaderActor = {
    getActor: () => Actor;
};

export const createLeaderActor = (gpu: GPU): LeaderActor => {
    const mesh = new ObjectSpaceRaymarchMesh({
        name: "Leader",
        gpu,
        size: 0.5,
        fragmentShaderContent: litObjectSpaceRaymarchFragContent,
        depthFragmentShaderContent: gBufferObjectSpaceRaymarchFragDepthContent,
        materialArgs: {
            // fragmentShader: litObjectSpaceRaymarchMetaMorphFrag,
            // depthFragmentShader: gBufferObjectSpaceRaymarchMetaMorphDepthFrag,
            metallic: 0,
            roughness: 0,
            emissiveColor: new Color(1.2, 1, 1, 1),
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
    
    mesh.onUpdate = () => {
        console.log(mesh)
        mesh.transform.position.log()
    };
    
    return { getActor: () => mesh };
};
