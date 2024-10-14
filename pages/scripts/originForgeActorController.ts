import { GPU } from '@/PaleGL/core/GPU.ts';
import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/ObjectSpaceRaymarchMesh.ts';
import litObjectSpaceRaymarchFragOriginForgeContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-origin-forge.glsl';
import gBufferObjectSpaceRaymarchFragOriginForgeDepthContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-origin-forge.glsl';
import { Color } from '@/PaleGL/math/Color.ts';
import { DEG_TO_RAD, FaceSide, UniformTypes } from '@/PaleGL/constants.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { FollowerAttractMode, MorphFollowersActorController } from './createMorphFollowersActorController.ts';
import { lerp, saturate } from '@/PaleGL/utilities/mathUtilities.ts';
import { Scene } from '@/PaleGL/core/Scene.ts';
// import { isSequencePhase1, phase1NormalizedRate } from './demoSequencer.ts';

export type OriginForgeActorController = {
    getActor: () => Actor;
};

const METABALL_NUM = 16;

const UNIFORM_NAME_METABALL_CENTER_POSITION = 'uCP';
const UNIFORM_NAME_METABALL_POSITIONS = 'uBPs';

// [startTime, duration, mode?]
type TimeStampedOccurrenceSequence = [number, number, FollowerAttractMode?];

const occurrenceSequenceTimestamps: TimeStampedOccurrenceSequence[] = [
    [0, 4],
    [4, 2, FollowerAttractMode.Position],
    [8, 2, FollowerAttractMode.Position],
    [16, 2, FollowerAttractMode.Position],
    [24, 2, FollowerAttractMode.Position],
];

type OccurrenceSequenceData = {
    index: number;
    startTime: number;
    duration: number;
    rate: number;
    instanceNumStart: number;
    instanceNum: number;
};

function findOccurrenceSequenceData(time: number): OccurrenceSequenceData | null {
    for (let index = 0; index < occurrenceSequenceTimestamps.length; index++) {
        const startTime = occurrenceSequenceTimestamps[index][0];
        const duration = occurrenceSequenceTimestamps[index][1];
        if (startTime <= time && time < startTime + duration) {
            const rate = (time - startTime) / duration;
            const instanceNum = 16 * index;
            return {
                index,
                startTime,
                duration,
                rate,
                instanceNumStart: instanceNum - 16,
                instanceNum,
            };
        }
    }
    return null;
}

export function createOriginForgeActorController(
    gpu: GPU,
    scene: Scene,
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

    let followTargetA: Actor | null;

    const childOccurrenceSequence = (data: OccurrenceSequenceData) => {
        if (!followTargetA) {
            followTargetA = scene.find('F_A');
        }
        
        const rawRate = data.rate;
        
        let rate: number;
        // console.log(data);
        // console.log(data);
        if (rawRate < 0.5) {
            // 0~0.5 -> 0~1
            // 中央から出現するフェーズ
            rate = saturate(rawRate * 2);
            
            // 発生前の段階では、metaballの位置と同期
            const hiddenInstancePositions = calcPhase1InstancePositions(1, true);
            for (let i = data.instanceNumStart; i < data.instanceNum; i++) {
                const positionIndex = i - data.instanceNumStart;
                const p = hiddenInstancePositions[positionIndex];
                morphFollowersActor.setInstancePosition(i, p);
                morphFollowersActor.setInstanceMorphRate(i, 0);
            }
            morphFollowersActor.setInstanceNum(data.instanceNumStart);

            const instancePositions = calcPhase1InstancePositions(rate, false);
            // const phase1InstancePositions = calcPhase1InstancePositions(1, true);
            metaballPositions = instancePositions;
            mesh.mainMaterial.uniforms.setValue(UNIFORM_NAME_METABALL_POSITIONS, metaballPositions);
        } else {
            // 0.5~1 -> 0~1
            // 発生したインスタンスが移動場所を決めるフェーズ
            rate = saturate((rawRate - 0.5) * 2);
            // const phase1InstancePositions = calcPhase1InstancePositions(1, true);
            for (let i = 0; i < METABALL_NUM; i++) {
                // const v = Vector3.lerpVectors(phase1InstancePositions[i], Vector3.zero, rate);
                const v = Vector3.zero;
                const si = data.instanceNumStart + i;
                // morphFollowersActor.setInstancePosition(si, v);
                morphFollowersActor.setInstanceAttractTargetPosition(si, v);
                morphFollowersActor.setInstanceMorphRate(si, rate);
            }
            morphFollowersActor.setInstanceNum(data.instanceNum);

            hideMetaballChildren();
        }
        return;
    };

    const hideMetaballChildren = () => {
        metaballPositions = maton.range(METABALL_NUM, true).map(() => {
            return new Vector3(0, 0, 0);
        });
        mesh.mainMaterial.uniforms.setValue(UNIFORM_NAME_METABALL_POSITIONS, metaballPositions);
    };

    mesh.onPostProcessTimeline = (time: number) => {
        const sequenceData = findOccurrenceSequenceData(time);
        if (sequenceData) {
            if (sequenceData.index === 0) {
                morphFollowersActor.setInstanceNum(0);
                hideMetaballChildren();
            } else {
                childOccurrenceSequence(sequenceData);
                // morphFollowersActor.setInstanceNum(sequenceData.instanceNum);
            }
        } else {
            hideMetaballChildren();
        }

        // tmp2
        // if (isSequencePhase1(time)) {
        //     const rate = phase1NormalizedRate(time);
        //     childOccurrenceSequence(rate)
        // }

        // tmp1
        // if (isSequencePhase1(time)) {
        //     const r = phase1NormalizedRate(time);
        //     const instancePositions = calcPhase1InstancePositions(r, false);
        //     for (let i = 0; i < METABALL_NUM; i++) {
        //         morphFollowersActor.setInstancePosition(i, Vector3.zero);
        //         morphFollowersActor.setInstanceMorphRate(i, 0);
        //     }
        //     metaballPositions = instancePositions;
        //     mesh.mainMaterial.uniforms.setValue(UNIFORM_NAME_METABALL_POSITIONS, metaballPositions);
        //     return;
        // }
        // if (isSequencePhase2(time)) {
        //     const r = phase2NormalizedRate(time);
        //     const phase1InstancePositions = calcPhase1InstancePositions(1, true);
        //     for (let i = 0; i < METABALL_NUM; i++) {
        //         const v = Vector3.lerpVectors(phase1InstancePositions[i], Vector3.zero, r);
        //         morphFollowersActor.setInstancePosition(i, v);
        //         morphFollowersActor.setInstanceMorphRate(i, r);
        //     }
        //     hideMetaballChildren()
        //     return;
        // }
    };

    // const setMetaballPosition = (index: number) => {
    //     metallballPositions[index].set(0, 0, 0);
    // }

    return {
        getActor: () => mesh,
    };
}
