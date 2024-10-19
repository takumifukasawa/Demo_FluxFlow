import { GPU } from '@/PaleGL/core/GPU.ts';
import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/ObjectSpaceRaymarchMesh.ts';
import litObjectSpaceRaymarchFragOriginForgeContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-origin-forge.glsl';
import gBufferObjectSpaceRaymarchFragOriginForgeDepthContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-origin-forge.glsl';
import { Color } from '@/PaleGL/math/Color.ts';
import {DEG_TO_RAD, FaceSide, UniformBlockNames, UniformTypes} from '@/PaleGL/constants.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { MorphFollowerActorControllerEntity } from './createMorphFollowersActorController.ts';
import { lerp, saturate } from '@/PaleGL/utilities/mathUtilities.ts';
import { easeInOutQuad } from '@/PaleGL/utilities/easingUtilities.ts';
import {PointLight} from "@/PaleGL/actors/PointLight.ts";

export type OriginForgeActorController = {
    getActor: () => Actor;
    getPointLight: () => PointLight;
    initialize: (arr: MorphFollowerActorControllerEntity[]) => void;
};

const METABALL_NUM = 16;

const UNIFORM_NAME_METABALL_CENTER_POSITION = 'uCP';
const UNIFORM_NAME_METABALL_POSITIONS = 'uBPs';

const FollowerIndex = {
    None: -1,
    A: 0,
    B: 1,
    C: 2,
} as const;

type FollowerIndex = typeof FollowerIndex[keyof typeof FollowerIndex];

// [startTime[sec], endTime[sec], followerIndex, totalInstanceNum]
type TimeStampedOccurrenceSequence = [number, number, FollowerIndex, number];

// 16回やりたいが・・・
// [startTime[sec], endTime[sec]]
// TODO: targetとなるfollowerを指定できるようにする
const occurrenceSequenceTimestamps: TimeStampedOccurrenceSequence[] = [
    [0, 8, FollowerIndex.None, 0], // なにもしない時間
    [8, 12, FollowerIndex.A, 16],
    [12, 16, FollowerIndex.B, 16],
    [16, 20, FollowerIndex.C, 16],
    [20, 24, FollowerIndex.A, 32],
];

type OccurrenceSequenceData = {
    sequenceIndex: number;
    startTime: number;
    duration: number;
    rate: number;
    instanceNumStartIndex: number;
    instanceNumEndIndex: number;
    instanceNum: number;
    followerIndex: FollowerIndex,
};

const INSTANCE_PER_OCCURENCE = 16;

function findOccurrenceSequenceData(time: number): OccurrenceSequenceData | null {
    for (let index = 0; index < occurrenceSequenceTimestamps.length; index++) {
        const [startTime,endTime, followerIndex,instanceNum] = occurrenceSequenceTimestamps[index];
        const duration = endTime - startTime;
        if (startTime <= time && time < startTime + duration) {
            const rate = (time - startTime) / duration;
            // const instanceNum = INSTANCE_PER_OCCURENCE * index;
            const startIndex = instanceNum - INSTANCE_PER_OCCURENCE;
            const endIndex = startIndex + INSTANCE_PER_OCCURENCE - 1;
            return {
                sequenceIndex: index,
                startTime,
                duration,
                rate,
                instanceNumStartIndex: startIndex,
                instanceNumEndIndex: endIndex,
                instanceNum,
                followerIndex
            };
        }
    }
    return null;
}

function isOverOccurrenceSequence(time: number): boolean {
    // TODO: 不等号正しい？
    return occurrenceSequenceTimestamps[occurrenceSequenceTimestamps.length - 1][1] <= time;
}

export function createOriginForgeActorController(gpu: GPU): OriginForgeActorController {
    // let childPositionRadius = 0;

    // const orbitFollowTargets: Actor[] = [];

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
            diffuseColor: new Color(1, 1, 1, 1),
            emissiveColor: new Color(.1, .1, .1, 1),
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
            uniformBlockNames: [UniformBlockNames.Timeline]
        },
        castShadow: true,
    });

    let morphFollowersActorControllerEntities: MorphFollowerActorControllerEntity[] = [];

    const pointLight = new PointLight({
        intensity: 6,
        color: new Color(1, 1, 1),
        distance: 15,
        attenuation: 1,
    });
    mesh.addChild(pointLight);

    const initialize = (arr: MorphFollowerActorControllerEntity[]) => {
        morphFollowersActorControllerEntities = arr;
    };

    // mesh.subscribeOnStart(() => {
    //     followTargetA = scene.find(ATTRACTOR_ORBIT_MOVER_A);
    //     followTargetA?.addComponent(createOrbitMoverBinder());
    // });

    // mesh.onProcessPropertyBinder = (key: string, value: number) => {
    //     if (key === 'cpr') {
    //         metaballPositions = maton.range(METABALL_NUM, true).map((i) => {
    //             const pd = 360 / METABALL_NUM;
    //             const rad = i * pd * DEG_TO_RAD;
    //             const x = Math.cos(rad) * value;
    //             const y = Math.sin(rad) * value;
    //             const v = new Vector3(x, y, 0);
    //             return v;
    //         });
    //         mesh.mainMaterial.uniforms.setValue(UNIFORM_NAME_METABALL_POSITIONS, metaballPositions);
    //         return;
    //     }
    //     // if(key === "or") {
    //     //     occuranceRadius = value;
    //     //     return;
    //     // }
    // };

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

        // if rawRate < 0.5
        // 発生したインスタンスが移動場所を決めるフェーズ
        // 0~0.5 -> 0~1
        // if rawRate >= 0.5
        // 中央から出現するフェーズ
        // 0.5~1 -> 0~1
        const rate = rawRate < 0.5 ? saturate(rawRate * 2) : saturate((rawRate - 0.5) * 2);

        // 発生前の段階では、metaballの位置と同期
        // TODO: フレームが飛びまくるとおかしくなる可能性大なので、対象のinstance16子以外は常にmetaballと同期でもいい気がする
        const hiddenInstancePositions = calcEmitInstancePositions(1, true);
        const entity = morphFollowersActorControllerEntities[data.followerIndex];
        // morphFollowersActorControllerEntities.forEach((entity) => {
            const { morphFollowersActorController } = entity;
            if (!morphFollowersActorController.getActor().enabled) {
                return;
            }
            for (let i = 0; i < morphFollowersActorController.maxInstanceNum; i++) {
                if (i < data.instanceNumStartIndex) {
                    // すでにセットしたindexは無視.単一方向に増えるから、という前提のやり方
                } else if (i <= data.instanceNumEndIndex) {
                    if (rawRate < 0.5) {
                        // 発生前
                        const positionIndex = i - data.instanceNumStartIndex;
                        const p = hiddenInstancePositions[positionIndex];
                        morphFollowersActorController.setInstancePosition(i, p);
                        morphFollowersActorController.setInstanceVelocity(i, Vector3.zero);
                        morphFollowersActorController.setInstanceState(i, { morphRate: 0 });
                    } else {
                        // インスタンスに切り替わった後
                        morphFollowersActorController.setInstanceAttractPower(i, easeInOutQuad(rate));
                        morphFollowersActorController.setInstanceAttractorTarget(i, entity.orbitFollowTargetActor);
                        morphFollowersActorController.setInstanceState(i, { morphRate: rate });
                    }
                } else {
                    morphFollowersActorController.setInstancePosition(i, Vector3.zero);
                    morphFollowersActorController.setInstanceVelocity(i, Vector3.zero);
                    morphFollowersActorController.setInstanceState(i, { morphRate: rate });
                }
            }

            if (rawRate < 0.5) {
                morphFollowersActorController.setInstanceNum(data.instanceNumStartIndex);
                const instancePositions = calcEmitInstancePositions(easeInOutQuad(rate), false);
                metaballPositions = instancePositions;
                mesh.mainMaterial.uniforms.setValue(UNIFORM_NAME_METABALL_POSITIONS, metaballPositions);
            } else {
                morphFollowersActorController.setInstanceNum(data.instanceNum);
                hideMetaballChildren();
            }
        // });
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
            // 一番最初のシーケンスは空とみなす
            if (sequenceData.sequenceIndex === 0) {
                morphFollowersActorControllerEntities.forEach((entity) => {
                    const { morphFollowersActorController } = entity;
                    morphFollowersActorController.setInstanceNum(0);
                });
                hideMetaballChildren();
            } else {
                childOccurrenceSequence(sequenceData);
            }
        } else {
            hideMetaballChildren();
        }

        // TODO: followerごとに分けたくない？
        morphFollowersActorControllerEntities.forEach((entity) => {
            entity.morphFollowersActorController.setControlled(isOverOccurrenceSequence(time));
            entity.morphFollowersActorController.updateStatesAndBuffers();
        });
    };

    return {
        getActor: () => mesh,
        getPointLight: () => pointLight,
        initialize,
    };
}
