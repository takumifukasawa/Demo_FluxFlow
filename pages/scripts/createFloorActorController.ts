import { Actor } from '@/PaleGL/actors/Actor.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import litObjectSpaceRaymarchFragFloorContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-floor.glsl';
import gBufferObjectSpaceRaymarchFragFloorContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-floor.glsl';
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

    actor.onPostProcessTimeline = () => {
        mesh.transform.position = actor.transform.position;
        mesh.transform.scale = actor.transform.scale;
        mesh.transform.rotation = actor.transform.rotation;
        mesh.setUseWorldSpace(true);
    };
    
    return mesh;
}
