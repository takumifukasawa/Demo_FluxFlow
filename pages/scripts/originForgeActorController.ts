import { GPU } from '@/PaleGL/core/GPU.ts';
import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/ObjectSpaceRaymarchMesh.ts';
import litObjectSpaceRaymarchFragOriginForgeContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-origin-forge.glsl';
import gBufferObjectSpaceRaymarchFragOriginForgeDepthContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-origin-forge.glsl';
import { Color } from '@/PaleGL/math/Color.ts';
import { DEG_TO_RAD, FaceSide, UniformTypes } from '@/PaleGL/constants.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';

export type OriginForgeActorController = {
    getActor: () => Actor;
    updateSequence: (time: number) => void;
};

const METABALL_NUM = 16;

const UNIFORM_NAME_METABALL_CENTER_POSITION = 'uCP';
const UNIFORM_NAME_METABALL_POSITIONS = 'uBPs';

export function createOriginForgeActorController(gpu: GPU): OriginForgeActorController {
    const initialMetallballPositions = maton.range(METABALL_NUM).map(() => {
        return new Vector3(0, 0, 0);
    });
    // .flat();

    const mesh = new ObjectSpaceRaymarchMesh({
        gpu,
        size: 1,
        fragmentShaderContent: litObjectSpaceRaymarchFragOriginForgeContent,
        depthFragmentShaderContent: gBufferObjectSpaceRaymarchFragOriginForgeDepthContent,
        materialArgs: {
            metallic: 0,
            roughness: 0,
            emissiveColor: new Color(0.1, 0.1, 3, 1),
            receiveShadow: true,
            faceSide: FaceSide.Double,
            uniforms: [
                {
                    name: UNIFORM_NAME_METABALL_CENTER_POSITION,
                    type: UniformTypes.Vector3,
                    value: Vector3.zero,
                },
                {
                    name: UNIFORM_NAME_METABALL_POSITIONS,
                    type: UniformTypes.Vector3Array,
                    value: initialMetallballPositions,
                },
            ],
        },
        castShadow: true,
    });

    mesh.transform.scale.set(4, 4, 4);

    mesh.onUpdate = () => {
        const dist = 2;
        const metaballPositions = maton.range(METABALL_NUM, true).map((i) => {
            const pd = 360 / METABALL_NUM;
            const rad = i * pd * DEG_TO_RAD;
            const x = Math.cos(rad) * dist;
            const z = Math.sin(rad) * dist;
            const v = new Vector3(x, 0, z);
            return v;
        });
        mesh.mainMaterial.uniforms.setValue(UNIFORM_NAME_METABALL_POSITIONS, metaballPositions);
    };
    
    const updateSequence = (time: number) => {
        mesh.mainMaterial.uniforms.setValue(
            UNIFORM_NAME_METABALL_CENTER_POSITION,
            new Vector3(0, Math.sin(time) * 1, 0)
        );
    }

    return {
        getActor: () => mesh,
        updateSequence,
    };
}
