import { Actor } from '@/PaleGL/actors/Actor.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import {ScreenSpaceRaymarchMesh} from "@/PaleGL/actors/ScreenSpaceRaymarchMesh.ts";
import {Color} from "@/PaleGL/math/Color.ts";
import litObjectSpaceRaymarchFragFloorContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-floor.glsl';
import gBufferObjectSpaceRaymarchFragFloorContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-floor.glsl';
import litScreenSpaceRaymarchFragFloorContent from '@/PaleGL/shaders/custom/entry/lit-screen-space-raymarch-fragment-floor.glsl';
import gBufferScreenSpaceRaymarchFragFloorContent from '@/PaleGL/shaders/custom/entry/gbuffer-screen-space-raymarch-depth-fragment-floor.glsl';
import { createObjectSpaceRaymarchMaterial } from '@/PaleGL/materials/ObjectSpaceRaymarchMaterial.ts';
import {FaceSide, UniformBlockNames} from '@/PaleGL/constants.ts';
import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/ObjectSpaceRaymarchMesh.ts';

export function createFloorActorController(gpu: GPU, actor: Actor) {
    console.log(actor)
    
    // tmp
    // const mat = mesh.mainMaterial as GBufferMaterial
    // const tiling = new Vector4(100, 100, 0, 0);
    // mat.metallicMap = surfaceMap;
    // mat.metallicMapTiling = tiling;
    // mat.roughnessMap = surfaceMap;
    // mat.roughnessMapTiling = tiling;
    // mat.receiveShadow = true;

    //
    // o-s
    //
    
    const material = createObjectSpaceRaymarchMaterial({
        fragmentShaderContent: litObjectSpaceRaymarchFragFloorContent,
        depthFragmentShaderContent: gBufferObjectSpaceRaymarchFragFloorContent,
        materialArgs: {
            receiveShadow: true,
            uniformBlockNames: [UniformBlockNames.Timeline],
            faceSide: FaceSide.Double
        },
    });

    const mesh = new ObjectSpaceRaymarchMesh({
        gpu,
        size: 1,
        materials: [material],
        castShadow: true,
    });
    mesh.enabled = false;

    actor.onPostProcessTimeline = () => {
        mesh.transform.position = actor.transform.position;
        mesh.transform.scale = actor.transform.scale;
        mesh.transform.rotation = actor.transform.rotation;
        mesh.setUseWorldSpace(true);
    };

    //
    // s-s
    //

    // const mesh = new ScreenSpaceRaymarchMesh({
    //     gpu,
    //     geometry: new BoxGeometry({ gpu, size: 1 }),
    //     materialArgs: {
    //         metallic: 0,
    //         roughness: 0,
    //         receiveShadow: true,
    //         emissiveColor: Color.white,
    //     },
    //     fragmentShaderContent: litScreenSpaceRaymarchFragFloorContent,
    //     depthFragmentShaderContent: gBufferScreenSpaceRaymarchFragFloorContent,
    //     receiveShadow: true
    //     // castShadow: true,
    // });

    // //
    // // s-s
    // //

    const sMesh= new ScreenSpaceRaymarchMesh({
        gpu,
        materialArgs: {
            metallic: 0,
            roughness: 0,
            receiveShadow: true,
            emissiveColor: Color.white,
            // receiveShadow: true,
            uniformBlockNames: [UniformBlockNames.Timeline],
            // faceSide: FaceSide.Double,
        },
        fragmentShaderContent: litScreenSpaceRaymarchFragFloorContent,
        depthFragmentShaderContent: gBufferScreenSpaceRaymarchFragFloorContent,
        // castShadow: true,
    });
    console.log(sMesh)

    return sMesh;
}
