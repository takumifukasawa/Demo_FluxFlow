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
import { lerp, saturate } from '@/PaleGL/utilities/mathUtilities.ts';
import { Scene } from '@/PaleGL/core/Scene.ts';
import { easeInOutQuad } from '@/PaleGL/utilities/easingUtilities.ts';
import { createOrbitMoverBinder } from './orbitMoverBinder.ts';

export type OriginForgeActorController = {
    getActor: () => Actor;
};

const METABALL_NUM = 16;

const UNIFORM_NAME_METABALL_CENTER_POSITION = 'uCP';
const UNIFORM_NAME_METABALL_POSITIONS = 'uBPs';

const ORBIT_MOVER_NAME_A = 'O_A';

// [startTime[sec], endTime[sec], targetFollowerName, instanceNum]
type TimeStampedOccurrenceSequence = [number, number, string?, number?];

// 16回やりたいが・・・
// [startTime[sec], endTime[sec]]
const occurrenceSequenceTimestamps: TimeStampedOccurrenceSequence[] = [
    [0, 8], // なにもしない時間
    [8, 16],
    [16, 24],
];

type OccurrenceSequenceData = {
    index: number;
    startTime: number;
    duration: number;
    rate: number;
    instanceNumStartIndex: number;
    instanceNumEndIndex: number;
    instanceNum: number;
};

function findOccurrenceSequenceData(time: number): OccurrenceSequenceData | null {
    for (let index = 0; index < occurrenceSequenceTimestamps.length; index++) {
        const startTime = occurrenceSequenceTimestamps[index][0];
        const endTime = occurrenceSequenceTimestamps[index][1];
        const duration = endTime - startTime;
        if (startTime <= time && time < startTime + duration) {
            const rate = (time - startTime) / duration;
            const instanceNum = 16 * index;
            const startIndex = instanceNum - 16;
            const endIndex = startIndex + 16 - 1;
            return {
                index,
                startTime,
                duration,
                rate,
                instanceNumStartIndex: startIndex,
                instanceNumEndIndex: endIndex,
                instanceNum,
            };
        }
    }
    return null;
}

function isOverOccurrenceSequence(time: number): boolean {
    // TODO: 不等号正しい？
    return occurrenceSequenceTimestamps[occurrenceSequenceTimestamps.length - 1][1] <= time;
}

export function createOriginForgeActorController(
    gpu: GPU,
    scene: Scene,
    morphFollowersActor: MorphFollowersActorController
): OriginForgeActorController {
    // let childPositionRadius = 0;

    let followTargetA: Actor | null;
    // let occuranceRadius = 2;

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

    mesh.subscribeOnStart(() => {
        followTargetA = scene.find(ORBIT_MOVER_NAME_A);
        followTargetA?.addComponent(createOrbitMoverBinder());
    });

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
            return;
        }
        // if(key === "or") {
        //     occuranceRadius = value;
        //     return;
        // }
    };

    const calcEmitInstancePositions = (r: number, needsAddForgeActorPosition: boolean) => {
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

    const childOccurrenceSequence = (data: OccurrenceSequenceData) => {
        const rawRate = easeInOutQuad(data.rate);
        
        let rate: number;
        
        if (rawRate < 0.5) {
            // 0~0.5 -> 0~1
            // 中央から出現するフェーズ
            rate = saturate(rawRate * 2);

            // 発生前の段階では、metaballの位置と同期
            // TODO: フレームが飛びまくるとおかしくなる可能性大なので、対象のinstance16子以外は常にmetaballと同期でもいい気がする
            const hiddenInstancePositions = calcEmitInstancePositions(1, true);
            for (let i = 0; i < morphFollowersActor.maxInstanceNum; i++) {
                if (i < data.instanceNumStartIndex) {
                    // すでにセットしたindexは無視.単一方向に増えるから、という前提のやり方
                } else if (i <= data.instanceNumEndIndex) {
                    // data.instanceNumStartIndex <= i && i < data.instanceNumEndIndex
                    const positionIndex = i - data.instanceNumStartIndex;
                    const p = hiddenInstancePositions[positionIndex];
                    morphFollowersActor.setInstancePosition(i, p);
                    morphFollowersActor.setInstanceVelocity(i, Vector3.zero);
                    morphFollowersActor.setInstanceMorphRate(i, 0);
                } else {
                    morphFollowersActor.setInstancePosition(i, Vector3.zero);
                    morphFollowersActor.setInstanceVelocity(i, Vector3.zero);
                    morphFollowersActor.setInstanceMorphRate(i, 0);
                }
            }
            morphFollowersActor.setInstanceNum(data.instanceNumStartIndex);

            const instancePositions = calcEmitInstancePositions(rate, false);
            metaballPositions = instancePositions;
            mesh.mainMaterial.uniforms.setValue(UNIFORM_NAME_METABALL_POSITIONS, metaballPositions);
        } else {
            // 0.5~1 -> 0~1
            // 発生したインスタンスが移動場所を決めるフェーズ
            rate = saturate((rawRate - 0.5) * 2);
           
            // // default
            // for (let i = 0; i < METABALL_NUM; i++) {
            //     const si = data.instanceNumStartIndex + i;
            //     // pattern1: 座標を直接更新しちゃうパターン
            //     // const v = Vector3.lerpVectors(phase1InstancePositions[i], Vector3.zero, rate);
            //     // morphFollowersActor.setInstancePosition(si, v);
            //     // pattern2: 移動先を座標にするパターン
            //     // const v = Vector3.zero;
            //     // morphFollowersActor.setInstanceAttractTargetPosition(si, v);
            //     // pattern3: 移動先をActorにするパターン
            //     morphFollowersActor.setInstanceAttractorTarget(si, followTargetA);

            //     morphFollowersActor.setInstanceMorphRate(si, rate);
            // }

            for (let i = 0; i < morphFollowersActor.maxInstanceNum; i++) {
                if (i < data.instanceNumStartIndex) {
                    // すでにセットしたindexは無視.単一方向に増えるから、という前提のやり方
                } else if (i <= data.instanceNumEndIndex) {
                    morphFollowersActor.setInstanceMorphRate(i, 0);
                    morphFollowersActor.setInstanceAttractorTarget(i, followTargetA);
                    morphFollowersActor.setInstanceMorphRate(i, rate);
                } else {
                    morphFollowersActor.setInstancePosition(i, Vector3.zero);
                    morphFollowersActor.setInstanceVelocity(i, Vector3.zero);
                    morphFollowersActor.setInstanceMorphRate(i, 0);
                }
            }

            morphFollowersActor.setInstanceNum(data.instanceNum);

            hideMetaballChildren();
        }
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
            }
        } else {
            hideMetaballChildren();
        }

        // TODO: followerごとに分けたくない？
        morphFollowersActor.setControlled(isOverOccurrenceSequence(time));

        morphFollowersActor.updateStatesAndBuffers();
    };

    return {
        getActor: () => mesh,
    };
}
