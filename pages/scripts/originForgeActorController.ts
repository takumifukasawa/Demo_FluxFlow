import { GPU } from '@/PaleGL/core/GPU.ts';
import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/ObjectSpaceRaymarchMesh.ts';
import litObjectSpaceRaymarchFragOriginForgeContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-origin-forge.glsl';
import gBufferObjectSpaceRaymarchFragOriginForgeDepthContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-origin-forge.glsl';
import { Color } from '@/PaleGL/math/Color.ts';
import { DEG_TO_RAD, FaceSide, UniformTypes } from '@/PaleGL/constants.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { MorphFollowersActorController } from './createMorphFollowersActorController.ts';
import { lerp } from '@/PaleGL/utilities/mathUtilities.ts';
import { isSequencePhase1, isSequencePhase2, phase1NormalizedRate, phase2NormalizedRate } from './demoSequencer.ts';

export type OriginForgeActorController = {
    getActor: () => Actor;
};

const METABALL_NUM = 16;

const UNIFORM_NAME_METABALL_CENTER_POSITION = 'uCP';
const UNIFORM_NAME_METABALL_POSITIONS = 'uBPs';

export function createOriginForgeActorController(
    gpu: GPU,
    morphFollowersActor: MorphFollowersActorController
): OriginForgeActorController {
    // let childPositionRadius = 0;

    let metaballPositions = maton.range(METABALL_NUM).map(() => {
        return new Vector3(0, 0, 0);
    });
    // .flat();

    const mesh = new ObjectSpaceRaymarchMesh({
        name: 'OriginForge',
        gpu,
        size: 0.5,
        fragmentShaderContent: litObjectSpaceRaymarchFragOriginForgeContent,
        depthFragmentShaderContent: gBufferObjectSpaceRaymarchFragOriginForgeDepthContent,
        materialArgs: {
            metallic: 0,
            roughness: 0,
            emissiveColor: new Color(2, 1, 1, 1),
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
                    value: metaballPositions,
                },
            ],
        },
        castShadow: true,
    });

    // mesh.transform.scale.set(4, 4, 4);

    // mesh.onUpdate = () => {
    //     const dist = 2;
    //     metaballPositions = maton.range(METABALL_NUM, true).map((i) => {
    //         const pd = 360 / METABALL_NUM;
    //         const rad = i * pd * DEG_TO_RAD;
    //         const x = Math.cos(rad) * dist;
    //         const z = Math.sin(rad) * dist;
    //         const v = new Vector3(x, 0, z);
    //         return v;
    //     });
    //     mesh.mainMaterial.uniforms.setValue(UNIFORM_NAME_METABALL_POSITIONS, metaballPositions);
    // };

    mesh.onProcessPropertyBinder = (key: string, value: number) => {
        if (key === 'cpr') {
            metaballPositions = maton.range(METABALL_NUM, true).map((i) => {
                const pd = 360 / METABALL_NUM;
                const rad = i * pd * DEG_TO_RAD;
                const x = Math.cos(rad) * value;
                const y = Math.sin(rad) * value;
                const v = new Vector3(x, y, 0);
                return v;
            });
            mesh.mainMaterial.uniforms.setValue(UNIFORM_NAME_METABALL_POSITIONS, metaballPositions);
        }
        // if(key === 'ic') {
        //     mesh.geometry.instanceCount = value;
        // }
    };

    const calcPhase1InstancePositions = (r: number, needsAddForgeActorPosition: boolean) => {
        const range = lerp(0, 2, r);
        const p = maton.range(METABALL_NUM, true).map((i) => {
            const pd = 360 / METABALL_NUM;
            const rad = i * pd * DEG_TO_RAD;
            const x = Math.cos(rad) * range;
            const y = Math.sin(rad) * range;
            const v = new Vector3(x, y, 0);
            return needsAddForgeActorPosition ? v.addVector(mesh.transform.worldPosition) : v;
        });
        return p;
    };

    mesh.onPostProcessTimeline = (time: number) => {
        if (isSequencePhase1(time)) {
            const r = phase1NormalizedRate(time);
            const instancePositions = calcPhase1InstancePositions(r, false);
            for (let i = 0; i < METABALL_NUM; i++) {
                morphFollowersActor.setInstancePosition(i, Vector3.zero);
                morphFollowersActor.setInstanceMorphRate(i, 0);
            }
            metaballPositions = instancePositions;
            mesh.mainMaterial.uniforms.setValue(UNIFORM_NAME_METABALL_POSITIONS, metaballPositions);
            return;
        }
        if (isSequencePhase2(time)) {
            const r = phase2NormalizedRate(time);
            const phase1InstancePositions = calcPhase1InstancePositions(1, true);
            for (let i = 0; i < METABALL_NUM; i++) {
                const v = Vector3.lerpVectors(phase1InstancePositions[i], Vector3.zero, r);
                morphFollowersActor.setInstancePosition(i, v);
                morphFollowersActor.setInstanceMorphRate(i, r);
            }
            metaballPositions = maton.range(METABALL_NUM, true).map(() => {
                return new Vector3(0, 0, 0);
            });
            mesh.mainMaterial.uniforms.setValue(UNIFORM_NAME_METABALL_POSITIONS, metaballPositions);
            return;
        }
    };

    // const setMetaballPosition = (index: number) => {
    //     metallballPositions[index].set(0, 0, 0);
    // }

    return {
        getActor: () => mesh,
    };
}
