import { GPU } from '@/PaleGL/core/GPU.ts';
import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/ObjectSpaceRaymarchMesh.ts';
import litObjectSpaceRaymarchFragOriginForgeGatherContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-origin-forge-gather.glsl';
import gBufferObjectSpaceRaymarchFragOriginForgeGatherDepthContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-origin-forge-gather.glsl';
import litObjectSpaceRaymarchFragOriginForgeContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-origin-forge.glsl';
import gBufferObjectSpaceRaymarchFragOriginForgeDepthContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-origin-forge.glsl';
import litObjectSpaceRaymarchFragOriginForgeButterflyContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-origin-forge-butterfly.glsl';
import gBufferObjectSpaceRaymarchFragOriginForgeButterflyDepthContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-origin-forge-butterfly.glsl';
import { Color } from '@/PaleGL/math/Color.ts';
import { DEG_TO_RAD, FaceSide, UniformBlockNames, UniformNames, UniformTypes } from '@/PaleGL/constants.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { maton } from '@/PaleGL/utilities/maton.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import {
    generateKeepFlyingInstancePositions,
    MorphFollowerActorControllerEntity
} from './createMorphFollowersActorController.ts';
import { lerp, saturate } from '@/PaleGL/utilities/mathUtilities.ts';
import { easeInOutQuad, easeOutCube } from '@/PaleGL/utilities/easingUtilities.ts';
import { PointLight } from '@/PaleGL/actors/PointLight.ts';
import { ORIGIN_FORGE_ACTOR_NAME } from './demoConstants.ts';
import { Material } from '@/PaleGL/materials/Material.ts';
import { createObjectSpaceRaymarchMaterial } from '@/PaleGL/materials/ObjectSpaceRaymarchMaterial.ts';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';
import {
    buildTimelinePropertyR,
    buildTimelinePropertyG,
    buildTimelinePropertyB,
} from '@/Marionetter/timelineUtilities.ts';

export type MorphSurfaceParameters = {
    metallic?: number;
    roughness?: number;
    diffuseColor?: Color;
    emissiveColor?: Color;
};

export type OriginForgeActorController = {
    getActor: () => Actor;
    getPointLight: () => PointLight;
    initialize: (entities: MorphFollowerActorControllerEntity[], gatherChildlenActors: Actor[]) => void;
};

const METABALL_NUM = 16;

const UNIFORM_NAME_METABALL_CENTER_POSITION = 'uCP';
const UNIFORM_NAME_METABALL_POSITIONS = 'uBPs';
const UNIFORM_NAME_METABALL_GATHER_CHILDREN_POSITIONS = 'uGPs';
const UNIFORM_NAME_METABALL_GATHER_SCALE_RATE = 'uGS';
const UNIFORM_NAME_METABALL_GATHER_MORPH_STATES = 'uGSs';
// const UNIFORM_NAME_METABALL_GATHER_EMISSIVE_COLOR = 'uGEC';
// const UNIFORM_NAME_METABALL_GATHER_EMISSIVE_COLOR_PROPERTY_BASE = 'gec';
const UNIFORM_NAME_METABALL_ORIGIN_MORPH_RATE = 'uOMR';
const UNIFORM_NAME_METABALL_ORIGIN_ROT = 'uORo';

const SURFACE_DIFFUSE_PROPERTY_BASE = 'sdc';
const SURFACE_EMISSIVE_PROPERTY_BASE = 'sec';

const GATHER_PHASE_MATERIAL_INDEX = 0;

const gatherChildPositions: Vector3[] = maton.range(4).map(() => Vector3.zero);

// [morph rate, rot x, rot y, ,]
const gatherChildMorphStates: Vector4[] = maton.range(4).map(() => Vector4.zero);

const shaderContentPairs: {
    fragment: string;
    depth: string;
    uniforms: UniformsData;
}[] = [
    // 0: gather -> emitter (only center)
    {
        fragment: litObjectSpaceRaymarchFragOriginForgeGatherContent,
        depth: gBufferObjectSpaceRaymarchFragOriginForgeGatherDepthContent,
        uniforms: [
            {
                name: UNIFORM_NAME_METABALL_GATHER_CHILDREN_POSITIONS, // gather children positions
                type: UniformTypes.Vector3Array,
                value: gatherChildPositions,
            },
            {
                name: UNIFORM_NAME_METABALL_GATHER_MORPH_STATES,
                type: UniformTypes.Vector4Array,
                value: gatherChildMorphStates,
            },
        ],
    },
    // 1: emitter
    {
        fragment: litObjectSpaceRaymarchFragOriginForgeContent,
        depth: gBufferObjectSpaceRaymarchFragOriginForgeDepthContent,
        uniforms: [],
    },
    // 2: emitter (only center) -> butterfly
    {
        fragment: litObjectSpaceRaymarchFragOriginForgeButterflyContent,
        depth: gBufferObjectSpaceRaymarchFragOriginForgeButterflyDepthContent,
        uniforms: [],
    },
];

const FollowerIndex = {
    None: -1,
    A: 0,
    B: 1,
    C: 2,
} as const;

type FollowerIndex = (typeof FollowerIndex)[keyof typeof FollowerIndex];

// [startTime[sec], endTime[sec], followerIndex, materialIndex, totalInstanceNum]
type TimeStampedOccurrenceSequence = [number, number, FollowerIndex, number];

const occurrenceSequenceBaseData: [number, number, FollowerIndex][] = [
    // [0, 16, FollowerIndex.None], // なにもしない時間
    [16, 20, FollowerIndex.A],
    [20, 24, FollowerIndex.A],
    [24, 28, FollowerIndex.A],
    [28, 32, FollowerIndex.A],
    [32, 36, FollowerIndex.C],
    [36, 40, FollowerIndex.C],
    [40, 44, FollowerIndex.C],
    [44, 48, FollowerIndex.C],
    [48, 50, FollowerIndex.B],
    [50, 52, FollowerIndex.B],
    [52, 54, FollowerIndex.B],
    [54, 56, FollowerIndex.B],
    [56, 58, FollowerIndex.A],
    [58, 60, FollowerIndex.C],
    [60, 62, FollowerIndex.B],
    [62, 64, FollowerIndex.A], // 64までは操作させたいので、何かしら置いておく
    // 64secまでは色々出したい
];

const instanceAccCount: Record<FollowerIndex, number> = {
    [FollowerIndex.None]: 0,
    [FollowerIndex.A]: 0,
    [FollowerIndex.B]: 0,
    [FollowerIndex.C]: 0,
};

const occurrenceSequenceTimestamps: TimeStampedOccurrenceSequence[] = [
    [0, 16, FollowerIndex.None, 0], // なにもしない時間
];
occurrenceSequenceBaseData.forEach((d) => {
    const [s, e, fi] = d;
    // instanceAccCount[fi] += METABALL_NUM;
    instanceAccCount[fi] += METABALL_NUM;
    const result: TimeStampedOccurrenceSequence = [s, e, fi, instanceAccCount[fi]];
    occurrenceSequenceTimestamps.push(result);
});

console.log('hogehoge', occurrenceSequenceTimestamps);

// // 16回やりたいが・・・
// // TODO: targetとなるfollowerを指定できるようにする
// const occurrenceSequenceTimestamps: TimeStampedOccurrenceSequence[] = [
//     [0, 8, FollowerIndex.None, 0], // なにもしない時間
//     [8, 12, FollowerIndex.A, 16],
//     [12, 16, FollowerIndex.B, 16],
//     [16, 20, FollowerIndex.C, 16],
//     [20, 24, FollowerIndex.A, 32],
// ];

type OccurrenceSequenceData = {
    sequenceIndex: number;
    startTime: number;
    duration: number;
    rate: number;
    instanceNumStartIndex: number;
    instanceNumEndIndex: number;
    instanceNum: number;
    followerIndex: FollowerIndex;
};

const INSTANCE_PER_OCCURENCE = 16;

function findOccurrenceSequenceData(time: number): OccurrenceSequenceData | null {
    for (let index = 0; index < occurrenceSequenceTimestamps.length; index++) {
        const [startTime, endTime, followerIndex, instanceNum] = occurrenceSequenceTimestamps[index];
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
                followerIndex,
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
    const statesParameters = {
        gatherScale: 0,
        originForgeRotationRad: new Vector3(0, 0, 0),
        originMorphRate: 0,
    };

    const surfaceParameters: Required<MorphSurfaceParameters> = {
        metallic: 0,
        roughness: 0,
        diffuseColor: new Color(1, 1, 1, 1),
        emissiveColor: new Color(0.1, 0.1, 0.1, 1),
    };

    let morphFollowersActorControllerEntities: MorphFollowerActorControllerEntity[] = [];
    let gatherChildlenActors: Actor[] = [];

    let metaballPositions = maton.range(METABALL_NUM).map(() => {
        return new Vector3(0, 0, 0);
    });

    // const gatherPhaseEmissiveColor = new Color(0, 0, 0, 0);

    const materials: Material[] = [];

    shaderContentPairs.forEach((shaderContent) => {
        const material = createObjectSpaceRaymarchMaterial({
            fragmentShaderContent: shaderContent.fragment,
            depthFragmentShaderContent: shaderContent.depth,
            materialArgs: {
                ...surfaceParameters,
                receiveShadow: true,
                uniforms: [
                    ...shaderContent.uniforms,
                    {
                        name: UNIFORM_NAME_METABALL_CENTER_POSITION,
                        type: UniformTypes.Vector3,
                        // value: Vector3.zero,
                        value: Vector3.zero,
                    },
                    {
                        name: UNIFORM_NAME_METABALL_POSITIONS,
                        type: UniformTypes.Vector3Array,
                        value: metaballPositions,
                    },
                    {
                        name: UNIFORM_NAME_METABALL_GATHER_SCALE_RATE,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UNIFORM_NAME_METABALL_ORIGIN_MORPH_RATE,
                        type: UniformTypes.Float,
                        value: 0,
                    },
                    {
                        name: UNIFORM_NAME_METABALL_ORIGIN_ROT,
                        type: UniformTypes.Vector3,
                        value: statesParameters.originForgeRotationRad,
                    },
                ],
                uniformBlockNames: [UniformBlockNames.Timeline],
                faceSide: FaceSide.Double,
            },
        });
        materials.push(material);
    });

    const mesh = new ObjectSpaceRaymarchMesh({
        name: ORIGIN_FORGE_ACTOR_NAME,
        gpu,
        size: 0.5,
        materials,
        castShadow: true,
    });

    const pointLight = new PointLight({
        intensity: 6,
        color: new Color(1, 1, 1),
        distance: 15,
        attenuation: 1,
    });
    mesh.addChild(pointLight);
    // TODO: 手動オフセットしないとなぜか中央にならない
    pointLight.transform.position = new Vector3(0, 3, 0);

    const initialize = (entities: MorphFollowerActorControllerEntity[], _gatherChildrenActors: Actor[]) => {
        morphFollowersActorControllerEntities = entities;
        gatherChildlenActors = _gatherChildrenActors;

        // gatherの子たちにproperty binderを設定
        // morph rate
        // post process timeline でやったほうが uniform のセットの回数は減るが、多くないので許容
        gatherChildlenActors.forEach((actor, i) => {
            actor.onProcessPropertyBinder = (key: string, value: number) => {
                // gather morph rate
                if (key === 'gm') {
                    gatherChildMorphStates[i].x = value;
                    return;
                }

                // // rotation x
                // if(key === 'rx') {
                //     gatherChildMorphStates[i].y = value;
                //     return;
                // }
                // // rotation y
                // if(key === 'ry') {
                //     gatherChildMorphStates[i].z = value;
                //     return;
                // }
            };
        });
    };

    // mesh.subscribeOnStart(() => {
    //     followTargetA = scene.find(ATTRACTOR_ORBIT_MOVER_A);
    //     followTargetA?.addComponent(createOrbitMoverBinder());
    // });

    mesh.onProcessPropertyBinder = (key: string, value: number) => {
        // for debug
        // console.log(key, value)
        // material index
        if (key === 'mi') {
            mesh.materials.forEach((_, i) => {
                mesh.setCanRenderMaterial(i, i === Math.round(value));
            });
            return;
        }
        // gather scale rate
        if (key === 'gs') {
            statesParameters.gatherScale = value;
            return;
        }
        // // gather emissive color
        // if (key === buildTimelinePropertyR(UNIFORM_NAME_METABALL_GATHER_EMISSIVE_COLOR_PROPERTY_BASE)) {
        //     gatherPhaseEmissiveColor.r = value;
        //     return;
        // }
        // if (key === buildTimelinePropertyG(UNIFORM_NAME_METABALL_GATHER_EMISSIVE_COLOR_PROPERTY_BASE)) {
        //     gatherPhaseEmissiveColor.g = value;
        //     return;
        // }
        // if (key === buildTimelinePropertyB(UNIFORM_NAME_METABALL_GATHER_EMISSIVE_COLOR_PROPERTY_BASE)) {
        //     gatherPhaseEmissiveColor.b = value;
        //     return;
        // }
        // origin morph rate
        if (key === 'mr') {
            statesParameters.originMorphRate = value;
            return;
        }
        // origin forge: rot x
        if (key === 'rx') {
            statesParameters.originForgeRotationRad.x = value * DEG_TO_RAD;
            return;
        }
        // origin forge: rot y
        if (key === 'ry') {
            statesParameters.originForgeRotationRad.y = value * DEG_TO_RAD;
            return;
        }

        // point light intensity
        if (key === 'pi') {
            pointLight.intensity = value;
            return;
        }
        // point light distance
        if (key === 'pd') {
            pointLight.distance = value;
            return;
        }
        // point light attenuation
        if (key === 'pa') {
            pointLight.attenuation = value;
            return;
        }

        // point light color.r
        if (key === 'pc.r') {
            pointLight.color.r = value;
            return;
        }

        // point light color.g
        if (key === 'pc.g') {
            pointLight.color.g = value;
            return;
        }

        // point light color.a
        if (key === 'pc.b') {
            pointLight.color.b = value;
            return;
        }

        // metallic
        if (key === 'sm') {
            surfaceParameters.metallic = value;
            return;
        }

        // roughness
        if (key === 'sr') {
            surfaceParameters.roughness = value;
            return;
        }

        // diffuse r
        if (key === buildTimelinePropertyR(SURFACE_DIFFUSE_PROPERTY_BASE)) {
            surfaceParameters.diffuseColor.r = value;
            return;
        }
        // diffuse g
        if (key === buildTimelinePropertyG(SURFACE_DIFFUSE_PROPERTY_BASE)) {
            surfaceParameters.diffuseColor.g = value;
            return;
        }
        // diffuse b
        if (key === buildTimelinePropertyB(SURFACE_DIFFUSE_PROPERTY_BASE)) {
            surfaceParameters.diffuseColor.b = value;
            return;
        }

        // emissive r
        if (key === buildTimelinePropertyR(SURFACE_EMISSIVE_PROPERTY_BASE)) {
            surfaceParameters.emissiveColor.r = value;
            return;
        }
        // emissive g
        if (key === buildTimelinePropertyG(SURFACE_EMISSIVE_PROPERTY_BASE)) {
            surfaceParameters.emissiveColor.g = value;
            return;
        }
        // emissive b
        if (key === buildTimelinePropertyB(SURFACE_EMISSIVE_PROPERTY_BASE)) {
            surfaceParameters.emissiveColor.b = value;
            return;
        }
    };

    const calcEmitInstancePositions = (r: number, needsAddForgeActorPosition: boolean) => {
        const t = easeInOutQuad(r);
        // TODO: パラメーター化したい
        // TODO: ちょっと回転とかさせたい
        // TODO: 出す速度調整したい
        const range = lerp(0, 2, t);
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
        // const rawRate = easeInOutQuad(data.rate);
        const rawRate = easeOutCube(data.rate);

        // TODO: ここいい感じにコントロールしたい
        // - delay
        // - 0.5の崖
        // if rawRate < 0.5
        // 発生したインスタンスが移動場所を決めるフェーズ
        // 0~0.5 -> 0~1
        // if rawRate >= 0.5
        // 中央から出現するフェーズ
        // 0.5~1 -> 0~1
        const rate = rawRate < 0.5 ? saturate(rawRate * 2) : saturate((rawRate - 0.5) * 2);

        // 発生前の段階では、metaballの位置と同期
        // TODO: フレームが飛びまくるとおかしくなる可能性大なので、対象のinstance16個以外は常にmetaballと同期でもいい気がする
        const hiddenInstancePositions = calcEmitInstancePositions(1, true);
        const entity = morphFollowersActorControllerEntities[data.followerIndex];
        // morphFollowersActorControllerEntities.forEach((entity) => {
        const { _morphFollowersActorController } = entity;
        if (!_morphFollowersActorController.getActor().enabled) {
            return;
        }
        for (let i = 0; i < _morphFollowersActorController.maxInstanceNum; i++) {
            if (i < data.instanceNumStartIndex) {
                // すでにセットしたindexは無視.単一方向に増えるから、という前提のやり方
            } else if (i <= data.instanceNumEndIndex) {
                if (rawRate < 0.5) {
                    // 発生前
                    const positionIndex = i - data.instanceNumStartIndex;
                    const p = hiddenInstancePositions[positionIndex];
                    _morphFollowersActorController.setInstancePosition(i, p);
                    _morphFollowersActorController.setInstanceVelocity(i, Vector3.zero);
                    _morphFollowersActorController.setInstanceState(i, { morphRate: 0 });
                } else {
                    const morphRate = rate; // .5がmorphの形なので
                    // インスタンスに切り替わった後
                    _morphFollowersActorController.setInstanceAttractPower(i, easeInOutQuad(rate));
                    _morphFollowersActorController.setInstanceAttractorTarget(i, entity._orbitFollowTargetActor);
                    _morphFollowersActorController.setInstanceState(i, { morphRate });
                }
            } else {
                // NOTE: 明後日の方向に飛ばす
                // TODO: ここパラメーター化したい
                _morphFollowersActorController.setInstancePosition(
                    i,
                    generateKeepFlyingInstancePositions(i)
                );
                _morphFollowersActorController.setInstanceVelocity(i, Vector3.zero);
                _morphFollowersActorController.setInstanceState(i, { morphRate: rate });
            }
        }

        if (rawRate < 0.5) {
            _morphFollowersActorController.setInstanceNum(data.instanceNumStartIndex);
            const instancePositions = calcEmitInstancePositions(rate, false);
            metaballPositions = instancePositions;
            // mesh.materials.forEach((_, i) => {
            //     mesh.setUniformValueToPairMaterial(i, UNIFORM_NAME_METABALL_POSITIONS, metaballPositions);
            // });
            mesh.setUniformValueToAllMaterials(UNIFORM_NAME_METABALL_POSITIONS, metaballPositions)
        } else {
            _morphFollowersActorController.setInstanceNum(data.instanceNum);
            hideMetaballChildren();
        }
        // });
    };

    const hideMetaballChildren = () => {
        metaballPositions = maton.range(METABALL_NUM, true).map(() => {
            return new Vector3(0, 0, 0);
        });
        // mesh.materials.forEach((material) => {
        //     material.uniforms.setValue(UNIFORM_NAME_METABALL_POSITIONS, metaballPositions);
        // });
        mesh.materials.forEach((_, i) => {
            mesh.setUniformValueToPairMaterial(i, UNIFORM_NAME_METABALL_POSITIONS, metaballPositions);
        });
    };

    mesh.onPostProcessTimeline = (time: number) => {
        //
        // gatherフェーズの更新
        //

        gatherChildlenActors.forEach((actor, i) => {
            // gatherChildPositions[i] = mesh.transform.worldToLocalPoint(actor.transform.position);
            gatherChildPositions[i] = Vector3.subVectors(actor.transform.position, mesh.transform.position);
        });
        // mesh.materials[GATHER_PHASE_MATERIAL_INDEX].uniforms.setValue(
        //     UNIFORM_NAME_METABALL_GATHER_CHILDREN_POSITIONS,
        //     gatherChildPositions
        // );
        mesh.setUniformValueToPairMaterial(
            GATHER_PHASE_MATERIAL_INDEX,
            UNIFORM_NAME_METABALL_GATHER_CHILDREN_POSITIONS,
            gatherChildPositions
        );

        gatherChildlenActors.forEach((actor, i) => {
            const rot = actor.transform.rotation.getAxesRadians();
            gatherChildMorphStates[i].y = rot.x + Math.PI;
            gatherChildMorphStates[i].z = rot.y + Math.PI;
        });
        mesh.materials[GATHER_PHASE_MATERIAL_INDEX].uniforms.setValue(
            UNIFORM_NAME_METABALL_GATHER_MORPH_STATES,
            gatherChildMorphStates
        );
        mesh.setUniformValueToPairMaterial(
            GATHER_PHASE_MATERIAL_INDEX,
            UNIFORM_NAME_METABALL_GATHER_MORPH_STATES,
            gatherChildMorphStates
        );

        // mesh.materials.forEach((material) => {
        //     material.uniforms.setValue(UNIFORM_NAME_METABALL_ORIGIN_MORPH_RATE, statesParameters.originMorphRate);
        // });
        mesh.materials.forEach((_, i) => {
            mesh.setUniformValueToPairMaterial(
                i,
                UNIFORM_NAME_METABALL_ORIGIN_MORPH_RATE,
                statesParameters.originMorphRate
            );
        });

        // mesh.materials.forEach((material) => {
        //     material.uniforms.setValue(UNIFORM_NAME_METABALL_ORIGIN_ROT, statesParameters.originForgeRotationRad);
        // });
        mesh.materials.forEach((_, i) => {
            mesh.setUniformValueToPairMaterial(
                i,
                UNIFORM_NAME_METABALL_ORIGIN_ROT,
                statesParameters.originForgeRotationRad
            );
        });

        mesh.setUniformValueToAllMaterials(
            UNIFORM_NAME_METABALL_GATHER_SCALE_RATE,
            statesParameters.gatherScale
        );

        //
        // surface
        //

        mesh.materials.forEach((material) => {
            material.uniforms.setValue(UniformNames.Metallic, surfaceParameters.metallic);
        });
        mesh.materials.forEach((material) => {
            material.uniforms.setValue(UniformNames.Roughness, surfaceParameters.roughness);
        });
        mesh.materials.forEach((material, i) => {
            material.uniforms.setValue(UniformNames.DiffuseColor, surfaceParameters.diffuseColor);
            mesh.depthMaterials[i].uniforms.setValue(UniformNames.DiffuseColor, surfaceParameters.diffuseColor);
        });
        mesh.materials.forEach((material) => {
            material.uniforms.setValue(UniformNames.EmissiveColor, surfaceParameters.emissiveColor);
        });

        //
        // シーケンスの処理
        //

        const sequenceData = findOccurrenceSequenceData(time);
        if (sequenceData !== null) {
            // 一番最初のシーケンスは空とみなす
            if (sequenceData.sequenceIndex === 0) {
                morphFollowersActorControllerEntities.forEach((entity) => {
                    const { _morphFollowersActorController } = entity;
                    _morphFollowersActorController.setInstanceNum(0);
                });
                hideMetaballChildren();
            } else {
                childOccurrenceSequence(sequenceData);
            }
        } else {
            // 対象のシーケンスがない場合。つまり最後のシーケンスが終わった後
            hideMetaballChildren();
        }

        // 発生フェーズかどうかでcontroll可能かを切り分ける
        const followerControlled = !isOverOccurrenceSequence(time);
        // TODO: followerごとに分けたくない？ 96,80,80のコントロールのために
        morphFollowersActorControllerEntities.forEach((entity) => {
            entity._morphFollowersActorController.setControlled(followerControlled);
            if (followerControlled) {
                entity._morphFollowersActorController.setSurfaceParameters(surfaceParameters);
            }
            entity._morphFollowersActorController.updateStatesAndBuffers();
        });
    };

    return {
        getActor: () => mesh,
        getPointLight: () => pointLight,
        initialize,
    };
}
