import { Actor } from '@/PaleGL/actors/Actor.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import {FaceSide, UniformBlockNames, UniformNames} from '@/PaleGL/constants.ts';
import { ScreenSpaceRaymarchMesh } from '@/PaleGL/actors/ScreenSpaceRaymarchMesh.ts';
// import {Color} from "@/PaleGL/math/Color.ts";
import litObjectSpaceRaymarchFragFloorContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-floor.glsl';
import gBufferObjectSpaceRaymarchFragFloorContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-floor.glsl';
import litScreenSpaceRaymarchFragFloorContent from '@/PaleGL/shaders/custom/entry/lit-screen-space-raymarch-fragment-floor.glsl';
import gBufferScreenSpaceRaymarchFragFloorContent from '@/PaleGL/shaders/custom/entry/gbuffer-screen-space-raymarch-depth-fragment-floor.glsl';
import { createObjectSpaceRaymarchMaterial } from '@/PaleGL/materials/ObjectSpaceRaymarchMaterial.ts';
import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/ObjectSpaceRaymarchMesh.ts';
import { Mesh } from '@/PaleGL/actors/Mesh.ts';
import { GBufferMaterial } from '@/PaleGL/materials/GBufferMaterial.ts';
import { Texture } from '@/PaleGL/core/Texture.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';
import {Vector2} from "@/PaleGL/math/Vector2.ts";

export function createFloorActorController(gpu: GPU, actor: Actor, surfaceMap: Texture) {
    // tmp
    const mat = (actor as Mesh).mainMaterial as GBufferMaterial;
    if (mat) {
        const tiling = new Vector4(100, 100, 0, 0);
        mat.metallicMap = surfaceMap;
        mat.metallicMapTiling = tiling;
        mat.roughnessMap = surfaceMap;
        mat.roughnessMapTiling = tiling;
        mat.receiveShadow = true;
    }

    //
    // o-s
    //

    const material = createObjectSpaceRaymarchMaterial({
        fragmentShaderContent: litObjectSpaceRaymarchFragFloorContent,
        depthFragmentShaderContent: gBufferObjectSpaceRaymarchFragFloorContent,
        materialArgs: {
            receiveShadow: true,
            uniformBlockNames: [UniformBlockNames.Timeline],
            faceSide: FaceSide.Double,
        },
    });
    
    material.uniforms.setValue(UniformNames.DiffuseMap, surfaceMap);
    material.uniforms.setValue(UniformNames.DiffuseMapUvScale, new Vector2(10, 10));
    

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

    //
    // s-s
    //

    const sMesh = new ScreenSpaceRaymarchMesh({
        gpu,
        materialArgs: {
            metallic: 0,
            roughness: 0,
            receiveShadow: true,
            // emissiveColor: Color.white,
            // receiveShadow: true,
            uniformBlockNames: [UniformBlockNames.Timeline],
            // faceSide: FaceSide.Double,
        },
        fragmentShaderContent: litScreenSpaceRaymarchFragFloorContent,
        depthFragmentShaderContent: gBufferScreenSpaceRaymarchFragFloorContent,
        // castShadow: true,
    });
    console.log(sMesh);

    return mesh;
}
