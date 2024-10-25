import { maton } from '@/PaleGL/utilities/maton.ts';
import { TransformFeedbackDoubleBuffer } from '@/PaleGL/core/TransformFeedbackDoubleBuffer.ts';
import { Attribute } from '@/PaleGL/core/Attribute.ts';
import { AttributeNames, AttributeUsageType, FaceSide, UniformBlockNames, UniformTypes } from '@/PaleGL/constants.ts';
import transformFeedbackVertexFollower from '@/PaleGL/shaders/custom/entry/transform-feedback-vertex-demo-follower.glsl';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/ObjectSpaceRaymarchMesh.ts';
// import litObjectSpaceRaymarchFragMorphContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-meta-morph.glsl';
// import gBufferObjectSpaceRaymarchFragMorphDepthContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-meta-morph.glsl';
import litObjectSpaceRaymarchFragMorphButterflyContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-morph-buttery.glsl';
import gBufferObjectSpaceRaymarchFragMorphButterflyContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-morph-butterfly.glsl';
import litObjectSpaceRaymarchFragMorphPrimitiveContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-morph-primitive.glsl';
import gBufferObjectSpaceRaymarchFragMorphPrimitiveContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-morph-primitive.glsl';
import litObjectSpaceRaymarchFragMorphFlowerContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-morph-flower.glsl';
import gBufferObjectSpaceRaymarchFragMorphFlowerContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-morph-flower.glsl';
import { Color } from '@/PaleGL/math/Color.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import { Renderer } from '@/PaleGL/core/Renderer.ts';
import { Mesh } from '@/PaleGL/actors/Mesh.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { generateRandomValue, lerp, randomOnUnitPlane, randomOnUnitSphere } from '@/PaleGL/utilities/mathUtilities.ts';
import {
    createObjectSpaceRaymarchMaterial,
    ObjectSpaceRaymarchMaterialArgs,
} from '@/PaleGL/materials/ObjectSpaceRaymarchMaterial.ts';
import { Material } from '@/PaleGL/materials/Material.ts';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
import { OrbitMoverBinder } from './orbitMoverBinder.ts';
import {clipRate, isTimeInClip} from '@/Marionetter/timelineUtilities.ts';
import {easeInOutQuad, easeOutQuad} from "@/PaleGL/utilities/easingUtilities.ts";

const updateBufferSubDataEnabled = false;

const MAX_INSTANCE_NUM = 256;
const INITIAL_INSTANCE_NUM = 0;

const ATTRIBUTE_VELOCITY_ELEMENTS_NUM = 4;
const ATTRIBUTE_EMISSIVE_COLOR_ELEMENTS_NUM = 4;
const ATTRIBUTE_LOOK_DIRECTION_ELEMENTS_NUM = 3;
const ATTRIBUTE_INSTANCE_STATE_ELEMENTS_NUM = 4;

const TRANSFORM_FEEDBACK_VELOCITY_ELEMENTS_NUM = 4;
const TRANSFORM_FEEDBACK_ATTRACT_TARGET_POSITION_ELEMENTS_NUM = 4;

const TRANSFORM_FEEDBACK_ATTRIBUTE_POSITION_NAME = 'aPosition';
const TRANSFORM_FEEDBACK_ATTRIBUTE_VELOCITY_NAME = 'aVelocity';
const TRANSFORM_FEEDBACK_ATTRIBUTE_ATTRACT_TARGET_POSITION = 'aAttractTargetPosition';
const TRANSFORM_FEEDBACK_ATTRIBUTE_STATE_NAME = 'aState';
const TRANSFORM_FEEDBACK_VARYINGS_POSITION = 'vPosition';
const TRANSFORM_FEEDBACK_VARYINGS_VELOCITY = 'vVelocity';

const UNIFORM_DIFFUSE_MIXER_NAME = 'uDiffuseMixer';
const UNIFORM_EMISSIVE_MIXER_NAME = 'uEmissiveMixer';
const UNIFORM_ROT_MODE_NAME = 'uRotMode';

const rotRateForVelocityValue = 0;
const rotRateForLookDirectionValue = 1;

export const FollowerMorphType = {
    None: 0,
    Butterfly: 1,
    Primitive: 2,
    Flower: 3,
} as const;
export type FollowerMorphType = (typeof FollowerMorphType)[keyof typeof FollowerMorphType];

export const FollowerMorphMaterialData = {
    [FollowerMorphType.None]: -1,
    [FollowerMorphType.Butterfly]: 0,
    [FollowerMorphType.Primitive]: 1,
    [FollowerMorphType.Flower]: 2,
};

const shaderContentPairs: {
    morphType: FollowerMorphType;
    fragment: string;
    depth: string;
    uniforms: UniformsData;
}[] = [
    // 0: sp -> butterfly -> sp
    {
        morphType: FollowerMorphType.Butterfly,
        fragment: litObjectSpaceRaymarchFragMorphButterflyContent,
        depth: gBufferObjectSpaceRaymarchFragMorphButterflyContent,
        uniforms: [
            {
                name: UNIFORM_ROT_MODE_NAME,
                type: UniformTypes.Float,
                value: rotRateForVelocityValue,
            },
        ],
    },
    // 1: sp -> primitive -> sp
    {
        morphType: FollowerMorphType.Primitive,
        fragment: litObjectSpaceRaymarchFragMorphPrimitiveContent,
        depth: gBufferObjectSpaceRaymarchFragMorphPrimitiveContent,
        uniforms: [
            {
                name: UNIFORM_ROT_MODE_NAME,
                type: UniformTypes.Float,
                value: rotRateForVelocityValue,
            },
        ],
    },
    // 2: sp -> flower -> sp
    {
        morphType: FollowerMorphType.Flower,
        fragment: litObjectSpaceRaymarchFragMorphFlowerContent,
        depth: gBufferObjectSpaceRaymarchFragMorphFlowerContent,
        uniforms: [
            {
                name: UNIFORM_ROT_MODE_NAME,
                type: UniformTypes.Float,
                value: rotRateForLookDirectionValue,
            },
        ],
    },
];

// const attractTargetType = {
//     Attractor: 0,
//     Position: 1,
//     Circle: 2,
//     Line: 3,
// } as const;

// インスタンスごとの追従モード管理
const FollowerAttractMode = {
    None: 0,
    Attractor: 1,
    Position: 2,
    FollowCubeEdge: 3,
    Ray: 4,
    FollowSphereSurface: 5,
    Ground: 6,
} as const;
type FollowerAttractMode = (typeof FollowerAttractMode)[keyof typeof FollowerAttractMode];

// transform feedback での位置計算をする際のモード
const TransformFeedbackAttractMode = {
    None: 0,
    Jump: 1,
    Attract: 2,
} as const;
export type TransformFeedbackAttractMode =
    (typeof TransformFeedbackAttractMode)[keyof typeof TransformFeedbackAttractMode];

export type MorphFollowerActorControllerBinder = {
    morphFollowersActorController: MorphFollowersActorController;
    orbitFollowTargetActorName: string;
};

export type MorphFollowerActorControllerEntity = {
    morphFollowersActorController: MorphFollowersActorController;
    orbitFollowTargetActor: Actor;
};

export type MorphFollowersActorController = {
    getActor: () => Mesh;
    maxInstanceNum: number;
    initialize: (
        followerIndex: number,
        followerSeed: number,
        orbitFollowTargetActor: Actor,
        attractorTargetBoxMeshes: Mesh[],
        attractorTargetSphereActors: Actor[]
    ) => void;
    updateStatesAndBuffers: () => void;
    addInstance: () => void;
    activateInstance: () => void;
    setInstancePosition: (index: number, p: Vector3) => void;
    setInstanceVelocity: (index: number, v: Vector3) => void;
    setInstanceScale: (index: number, s: Vector3) => void;
    setInstanceColor: (index: number, c: Color) => void;
    setInstanceEmissiveColor: (index: number, c: Color) => void;
    setInstanceLookDirection: (index: number, lookDirection: Vector3) => void;
    setInstanceState: (index: number, { morphRate, delayRate }: { morphRate?: number; delayRate?: number }) => void;
    setInstanceAttractPower: (index: number, attractRate: number) => void;
    setInstanceAttractorTarget: (index: number, actor: Actor | null) => void;
    setInstanceAttractTargetPosition: (
        index: number,
        mode: FollowerAttractMode,
        { p, attractAmplitude }: { p?: Vector3; attractAmplitude?: number }
    ) => void;
    setInstanceNum: (instanceNum: number) => void;
    getCurrentTransformFeedbackState: (index: number) => number[];
    setControlled: (flag: boolean) => void;
    isControlled: () => boolean;
    setFollowAttractMode: (mode: FollowerAttractMode) => void;
};

const createInstanceUpdater = ({
    gpu,
    renderer,
    instanceNum,
    initialTransformFeedbackStates,
}: {
    gpu: GPU;
    renderer: Renderer;
    instanceNum: number;
    initialTransformFeedbackStates: number[][];
}) => {
    //
    // begin create mesh
    //

    // const planeNum = 512;

    const initialPosition = new Float32Array(
        maton
            .range(instanceNum)
            .map(() => {
                const range = 10000;
                return [range, range, range];
            })
            .flat()
    );

    const initialVelocity = new Float32Array(
        maton
            .range(instanceNum)
            .map(() => {
                return [0, 0, 1, 0];
            })
            .flat()
    );

    const initialAttractTargetPosition = new Float32Array(
        maton
            .range(instanceNum)
            .map(() => {
                return [0, 0, 0, 0];
            })
            .flat()
    );

    const transformFeedbackDoubleBuffer = new TransformFeedbackDoubleBuffer({
        gpu,
        attributes: [
            new Attribute({
                name: TRANSFORM_FEEDBACK_ATTRIBUTE_POSITION_NAME,
                data: initialPosition,
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: TRANSFORM_FEEDBACK_ATTRIBUTE_VELOCITY_NAME,
                data: initialVelocity,
                size: TRANSFORM_FEEDBACK_VELOCITY_ELEMENTS_NUM,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: TRANSFORM_FEEDBACK_ATTRIBUTE_ATTRACT_TARGET_POSITION,
                data: initialAttractTargetPosition,
                size: TRANSFORM_FEEDBACK_ATTRACT_TARGET_POSITION_ELEMENTS_NUM,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: TRANSFORM_FEEDBACK_ATTRIBUTE_STATE_NAME,
                data: new Float32Array(initialTransformFeedbackStates.flat()),
                size: 4,
                usageType: AttributeUsageType.DynamicDraw,
            }),
        ],
        varyings: [
            {
                name: TRANSFORM_FEEDBACK_VARYINGS_POSITION,
                data: new Float32Array(initialPosition),
            },
            {
                name: TRANSFORM_FEEDBACK_VARYINGS_VELOCITY,
                data: new Float32Array(initialVelocity),
            },
        ],
        vertexShader: transformFeedbackVertexFollower,
        uniforms: [],
        uniformBlockNames: [UniformBlockNames.Common, UniformBlockNames.Timeline],
        drawCount: instanceNum,
    });

    // TODO: rendererかgpuでまとめたい
    transformFeedbackDoubleBuffer.uniformBlockNames.forEach((blockName) => {
        const targetGlobalUniformBufferObject = renderer.globalUniformBufferObjects.find(
            ({ uniformBufferObject }) => uniformBufferObject.blockName === blockName
        );
        if (!targetGlobalUniformBufferObject) {
            return;
        }
        const blockIndex = gpu.bindUniformBlockAndGetBlockIndex(
            targetGlobalUniformBufferObject.uniformBufferObject,
            transformFeedbackDoubleBuffer.shader,
            blockName
        );
        // console.log("hogehoge", blockName, blockIndex)
        // for debug
        // console.log(
        //     material.name,
        //     'addUniformBlock',
        //     material.uniformBlockNames,
        //     targetUniformBufferObject.blockName,
        //     blockIndex
        // );
        transformFeedbackDoubleBuffer.uniforms.addUniformBlock(
            blockIndex,
            targetGlobalUniformBufferObject.uniformBufferObject,
            []
        );
    });

    return transformFeedbackDoubleBuffer;
};

export const createMorphFollowersActor = ({
    name,
    gpu,
    renderer, // instanceNum,
} // attractorActor,
: {
    name: string;
    gpu: GPU;
    renderer: Renderer;
    // instanceNum: number;
    // attractorActor: Actor;
}): MorphFollowersActorController => {
    let _followerIndex: number;
    let _followerSeed: number;
    let _currentFollowMode: FollowerAttractMode = FollowerAttractMode.None;
    let _isControlled = false;
    let _orbitFollowTargetActor: Actor;
    let _attractorTargetBoxMeshes: Mesh[] = [];
    let _attractorTargetSphereActors: Actor[] = [];

    const initialize = (
        followerIndex: number,
        followerSeed: number,
        orbitFollowTargetActor: Actor,
        attractorTargetBoxMeshes: Mesh[],
        attractorTargetSphereActors: Actor[]
    ) => {
        _followerIndex = followerIndex;
        _followerSeed = followerSeed;
        _orbitFollowTargetActor = orbitFollowTargetActor;
        _attractorTargetBoxMeshes = attractorTargetBoxMeshes;
        _attractorTargetSphereActors = attractorTargetSphereActors;
    };

    const instanceNum = INITIAL_INSTANCE_NUM;

    // TODO: forge から渡したい
    const materialArgs: ObjectSpaceRaymarchMaterialArgs = {
        // fragmentShader: litObjectSpaceRaymarchMorphFrag,
        // depthFragmentShader: gBufferObjectSpaceRaymarchMorphDepthFrag,
        metallic: 0,
        roughness: 0,
        diffuseColor: new Color(1, 1, 1, 1),
        emissiveColor: new Color(0.1, 0.1, 0.1, 1),
        receiveShadow: true,
        isInstancing: true,
        useInstanceLookDirection: true,
        useVertexColor: true,
        faceSide: FaceSide.Double,
    };

    const materials: Material[] = [];

    shaderContentPairs.forEach((shaderContent) => {
        const material = createObjectSpaceRaymarchMaterial({
            fragmentShaderContent: shaderContent.fragment,
            depthFragmentShaderContent: shaderContent.depth,
            materialArgs: {
                ...materialArgs,
                receiveShadow: true,
                uniforms: [
                    ...shaderContent.uniforms,
                    {
                        name: UNIFORM_DIFFUSE_MIXER_NAME,
                        type: UniformTypes.Float,
                        value: 1, // [0: instance vertex color, 1: uniform diffuse color]
                    },
                    {
                        name: UNIFORM_EMISSIVE_MIXER_NAME,
                        type: UniformTypes.Float,
                        value: 1, // [0: instance emissive color, 1: uniform emissive color]
                    },
                ],
                uniformBlockNames: [UniformBlockNames.Timeline],
            },
        });
        materials.push(material);
    });

    const mesh = new ObjectSpaceRaymarchMesh({
        name,
        gpu,
        size: 1,
        materials,
        castShadow: true,
    });

    // mesh.transform.scale = new Vector3(.5, .5, .5);
    // mesh.transform.position = new Vector3(1.5, 1.5, 0);
    // const rot = new Rotator(Quaternion.identity());
    // rot.setRotationX(90);
    // mesh.transform.rotation = rot;

    const tmpInstanceInfo: {
        position: number[][];
        scale: number[][];
        rotation: number[][];
        velocity: number[][];
        color: number[][];
        emissiveColor: number[][];
        lookDirection: number[][];
        instanceStates: number[][]; // [morphRate, delayRate, instance scale, 0]
        transformFeedbackStates: number[][]; // [seed, attractType, morphRate, attractPower]
    } = {
        position: [],
        scale: [],
        rotation: [],
        velocity: [],
        color: [],
        emissiveColor: [],
        lookDirection: [],
        instanceStates: [],
        transformFeedbackStates: [],
    };

    maton.range(MAX_INSTANCE_NUM, true).forEach((i) => {
        // position
        tmpInstanceInfo.position.push([0, 0, 0]);

        // scale
        // tmp
        // const baseScale = 1;
        // const randomScaleRange = 0;
        // const s = generateRandomValue(10, i) * randomScaleRange + baseScale;
        const s = 1;
        tmpInstanceInfo.scale.push([s, s, s]);

        // rotation
        tmpInstanceInfo.rotation.push([0, 0, 0]);

        // velocity
        tmpInstanceInfo.velocity.push([0, 0, 1, 0]);

        // color
        const c = Color.fromRGB(
            lerp(20, 200, generateRandomValue(0, i)),
            lerp(20, 40, generateRandomValue(1, i)),
            lerp(20, 200, generateRandomValue(2, i))
        );
        tmpInstanceInfo.color.push([...c.elements]);

        // emissive color
        const ec = Color.fromRGB(
            lerp(20, 200, generateRandomValue(0, i)) * 4,
            lerp(20, 40, generateRandomValue(1, i)),
            lerp(20, 200, generateRandomValue(2, i)) * 4
        );
        tmpInstanceInfo.emissiveColor.push([...ec.elements]);

        // look direction
        tmpInstanceInfo.lookDirection.push([0, 0, 1]);

        // states
        // delayは最初は何から持たせておく
        // const delayRate = (i / MAX_INSTANCE_NUM) * .25;
        const delayRate = generateRandomValue(2, i) * 0.25;
        const instanceScale = generateRandomValue(3, i) * 0.6 + 0.4;
        tmpInstanceInfo.instanceStates.push([1, delayRate, instanceScale, 0]);

        // transform feedback states
        tmpInstanceInfo.transformFeedbackStates.push([i, 0, 0, 0]);
    });

    const instancingInfo: {
        position: Float32Array;
        scale: Float32Array;
        rotation: Float32Array;
        velocity: Float32Array;
        color: Float32Array;
        emissiveColor: Float32Array;
        lookDirection: Float32Array;
        instanceStates: Float32Array;
        transformFeedbackStates: Float32Array;
        attractType: FollowerAttractMode[];
        attractorTarget: (Actor | null)[];
        attractPosition: Float32Array;
        instanceNum: number;
    } = {
        position: new Float32Array(tmpInstanceInfo.position.flat()),
        scale: new Float32Array(tmpInstanceInfo.scale.flat()),
        rotation: new Float32Array(tmpInstanceInfo.rotation.flat()),
        velocity: new Float32Array(tmpInstanceInfo.velocity.flat()),
        lookDirection: new Float32Array(tmpInstanceInfo.lookDirection.flat()),
        color: new Float32Array(tmpInstanceInfo.color.flat()),
        emissiveColor: new Float32Array(tmpInstanceInfo.emissiveColor.flat()),
        instanceStates: new Float32Array(tmpInstanceInfo.instanceStates.flat()),
        transformFeedbackStates: new Float32Array(tmpInstanceInfo.transformFeedbackStates.flat()),
        attractType: maton.range(MAX_INSTANCE_NUM).map(() => FollowerAttractMode.None),
        attractorTarget: maton.range(MAX_INSTANCE_NUM).map(() => null),
        attractPosition: new Float32Array(
            maton
                .range(MAX_INSTANCE_NUM)
                .map(() => [0, 0, 0, 0])
                .flat()
        ),
        instanceNum,
    };

    mesh.castShadow = true;
    mesh.geometry.instanceCount = instancingInfo.instanceNum;

    // TODO: instanceのoffset回りは予約語にしてもいいかもしれない
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstancePosition,
            data: instancingInfo.position,
            size: 3,
            divisor: 1,
        })
    );
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceScale,
            data: instancingInfo.scale,
            size: 3,
            divisor: 1,
        })
    );
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceRotation,
            data: instancingInfo.rotation,
            size: 3,
            divisor: 1,
        })
    );
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceVertexColor,
            data: instancingInfo.color,
            size: 4,
            divisor: 1,
        })
    );
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceEmissiveColor,
            data: instancingInfo.emissiveColor,
            size: ATTRIBUTE_EMISSIVE_COLOR_ELEMENTS_NUM,
            divisor: 1,
        })
    );
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceVelocity,
            data: instancingInfo.velocity,
            size: ATTRIBUTE_VELOCITY_ELEMENTS_NUM,
            divisor: 1,
        })
    );
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceLookDirection,
            data: instancingInfo.lookDirection,
            size: ATTRIBUTE_LOOK_DIRECTION_ELEMENTS_NUM,
            divisor: 1,
        })
    );
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceState,
            data: instancingInfo.instanceStates,
            size: ATTRIBUTE_INSTANCE_STATE_ELEMENTS_NUM,
            divisor: 1,
        })
    );

    const transformFeedbackDoubleBuffer = createInstanceUpdater({
        gpu,
        renderer,
        instanceNum: MAX_INSTANCE_NUM,
        initialTransformFeedbackStates: tmpInstanceInfo.transformFeedbackStates,
    });

    // let needsJumpPosition: boolean = false;

    const setInstancePosition = (index: number, p: Vector3) => {
        // js側のデータとbufferのデータを更新
        instancingInfo.position[index * 3] = p.x;
        instancingInfo.position[index * 3 + 1] = p.y;
        instancingInfo.position[index * 3 + 2] = p.z;
        // if (updateBufferSubDataEnabled) {
        // TODO: ここはupdateBufferSubDataせざるを得ないが、dirtyFragでもいいかもしれない
        transformFeedbackDoubleBuffer.updateBufferSubData(
            TRANSFORM_FEEDBACK_ATTRIBUTE_POSITION_NAME,
            index,
            p.elements
        );
        // }

        // TODO: attractTypeを更新する
    };

    const setInstanceVelocity = (index: number, v: Vector3) => {
        const mag = v.magnitude;
        const nv = v.normalize();
        // js側のデータとbufferのデータを更新
        instancingInfo.velocity[index * ATTRIBUTE_VELOCITY_ELEMENTS_NUM] = nv.x;
        instancingInfo.velocity[index * ATTRIBUTE_VELOCITY_ELEMENTS_NUM + 1] = nv.y;
        instancingInfo.velocity[index * ATTRIBUTE_VELOCITY_ELEMENTS_NUM + 2] = nv.z;
        instancingInfo.velocity[index * ATTRIBUTE_VELOCITY_ELEMENTS_NUM + 3] = mag;
        // if (updateBufferSubDataEnabled) {
        // TODO: ここはupdateBufferSubDataせざるを得ないが、dirtyFragでもいいかもしれない
        transformFeedbackDoubleBuffer.updateBufferSubData(
            TRANSFORM_FEEDBACK_ATTRIBUTE_VELOCITY_NAME,
            index,
            new Float32Array([nv.x, nv.y, nv.z, mag])
        );
        // }
    };

    const setInstanceScale = (index: number, s: Vector3) => {
        // js側のデータとbufferのデータを更新
        instancingInfo.scale[index * 3] = s.x;
        instancingInfo.scale[index * 3 + 1] = s.y;
        instancingInfo.scale[index * 3 + 2] = s.z;
        if (updateBufferSubDataEnabled) {
            mesh.geometry.vertexArrayObject.updateBufferSubData(AttributeNames.InstanceScale, index, s.elements);
        }
    };

    const setInstanceColor = (index: number, c: Color) => {
        // js側のデータとbufferのデータを更新
        instancingInfo.color[index * 4 + 0] = c.r;
        instancingInfo.color[index * 4 + 1] = c.g;
        instancingInfo.color[index * 4 + 2] = c.b;
        instancingInfo.color[index * 4 + 3] = c.a;
        if (updateBufferSubDataEnabled) {
            mesh.geometry.vertexArrayObject.updateBufferSubData(AttributeNames.InstanceVertexColor, index, c.elements);
        }
    };

    const setInstanceEmissiveColor = (index: number, c: Color) => {
        // js側のデータとbufferのデータを更新
        instancingInfo.emissiveColor[index * ATTRIBUTE_EMISSIVE_COLOR_ELEMENTS_NUM + 0] = c.r;
        instancingInfo.emissiveColor[index * ATTRIBUTE_EMISSIVE_COLOR_ELEMENTS_NUM + 1] = c.g;
        instancingInfo.emissiveColor[index * ATTRIBUTE_EMISSIVE_COLOR_ELEMENTS_NUM + 2] = c.b;
        instancingInfo.emissiveColor[index * ATTRIBUTE_EMISSIVE_COLOR_ELEMENTS_NUM + 3] = c.a;
        if (updateBufferSubDataEnabled) {
            mesh.geometry.vertexArrayObject.updateBufferSubData(
                AttributeNames.InstanceEmissiveColor,
                index,
                c.elements
            );
        }
    };

    const setInstanceLookDirection = (index: number, lookDirection: Vector3) => {
        // js側のデータとbufferのデータを更新
        instancingInfo.lookDirection[index * ATTRIBUTE_LOOK_DIRECTION_ELEMENTS_NUM + 0] = lookDirection.x;
        instancingInfo.lookDirection[index * ATTRIBUTE_LOOK_DIRECTION_ELEMENTS_NUM + 1] = lookDirection.y;
        instancingInfo.lookDirection[index * ATTRIBUTE_LOOK_DIRECTION_ELEMENTS_NUM + 2] = lookDirection.z;
        if (updateBufferSubDataEnabled) {
            mesh.geometry.vertexArrayObject.updateBufferSubData(
                AttributeNames.InstanceState,
                index,
                lookDirection.elements
            );
        }
    };

    const setInstanceState = (index: number, { morphRate, delayRate, scale }: { morphRate?: number; delayRate?: number; scale?: number }) => {
        // js側のデータとbufferのデータを更新
        if (morphRate !== undefined) {
            instancingInfo.instanceStates[index * ATTRIBUTE_INSTANCE_STATE_ELEMENTS_NUM + 0] = morphRate;
        }
        if (delayRate !== undefined) {
            instancingInfo.instanceStates[index * ATTRIBUTE_INSTANCE_STATE_ELEMENTS_NUM + 1] = delayRate;
        }
        if (scale !== undefined) {
            instancingInfo.instanceStates[index * ATTRIBUTE_INSTANCE_STATE_ELEMENTS_NUM + 2] = scale;
        }
        if (updateBufferSubDataEnabled) {
            mesh.geometry.vertexArrayObject.updateBufferSubData(
                AttributeNames.InstanceState,
                index,
                new Float32Array([
                    instancingInfo.instanceStates[index * ATTRIBUTE_INSTANCE_STATE_ELEMENTS_NUM + 0],
                    instancingInfo.instanceStates[index * ATTRIBUTE_INSTANCE_STATE_ELEMENTS_NUM + 1],
                    instancingInfo.instanceStates[index * ATTRIBUTE_INSTANCE_STATE_ELEMENTS_NUM + 2],
                    0,
                ])
            );
        }

        setTransformFeedBackState(index, { morphRate });
    };

    const setInstanceAttractPower = (index: number, attractPower: number) => {
        // js側のデータとbufferのデータを更新
        instancingInfo.instanceStates[index * 4 + 3] = attractPower;
        setTransformFeedBackState(index, { attractPower });
    };

    const setInstanceAttractorTarget = (index: number, actor: Actor | null) => {
        instancingInfo.attractType[index] = FollowerAttractMode.Attractor;
        instancingInfo.attractorTarget[index] = actor;
    };

    const getCurrentTransformFeedbackState = (index: number) => {
        const seed = instancingInfo.transformFeedbackStates[index * 4 + 0];
        const attractType = instancingInfo.transformFeedbackStates[index * 4 + 1];
        const morphRate = instancingInfo.transformFeedbackStates[index * 4 + 2];

        // instancingInfo.transformFeedbackStates[index * 4 + 1] = attractType;

        return [seed, attractType, morphRate, 0];
    };

    const setTransformFeedBackState = (
        index: number,
        values: {
            seed?: number;
            attractType?: TransformFeedbackAttractMode;
            morphRate?: number;
            attractPower?: number;
        }
    ) => {
        if (values.seed !== undefined) {
            instancingInfo.transformFeedbackStates[index * 4 + 0] = values.seed;
        }
        if (values.attractType !== undefined) {
            instancingInfo.transformFeedbackStates[index * 4 + 1] = values.attractType;
        }
        if (values.morphRate !== undefined) {
            instancingInfo.transformFeedbackStates[index * 4 + 2] = values.morphRate;
        }
        if (values.attractPower !== undefined) {
            instancingInfo.transformFeedbackStates[index * 4 + 3] = values.attractPower;
        }

        const data = [
            instancingInfo.transformFeedbackStates[index * 4 + 0],
            instancingInfo.transformFeedbackStates[index * 4 + 1],
            instancingInfo.transformFeedbackStates[index * 4 + 2],
            instancingInfo.transformFeedbackStates[index * 4 + 3],
        ];

        if (updateBufferSubDataEnabled) {
            transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferSubData(
                TRANSFORM_FEEDBACK_ATTRIBUTE_STATE_NAME,
                index,
                new Float32Array(data)
            );
        }

        return data;
    };

    const setInstanceAttractTargetPosition = (
        index: number,
        mode: FollowerAttractMode,
        {
            p,
            attractAmplitude = 0,
        }: {
            p?: Vector3;
            attractAmplitude?: number;
        }
    ) => {
        if (mode === FollowerAttractMode.None) {
            console.error('mode is None');
            return;
        }

        //
        // transform feedback: 追従先の位置を更新
        //

        if (p) {
            instancingInfo.attractPosition[index * TRANSFORM_FEEDBACK_ATTRACT_TARGET_POSITION_ELEMENTS_NUM] = p.x;
            instancingInfo.attractPosition[index * TRANSFORM_FEEDBACK_ATTRACT_TARGET_POSITION_ELEMENTS_NUM + 1] = p.y;
            instancingInfo.attractPosition[index * TRANSFORM_FEEDBACK_ATTRACT_TARGET_POSITION_ELEMENTS_NUM + 2] = p.z;
        }
        if (attractAmplitude !== undefined) {
            instancingInfo.attractPosition[index * TRANSFORM_FEEDBACK_ATTRACT_TARGET_POSITION_ELEMENTS_NUM + 3] =
                attractAmplitude;
        }
        const px = instancingInfo.attractPosition[index * TRANSFORM_FEEDBACK_ATTRACT_TARGET_POSITION_ELEMENTS_NUM];
        const py = instancingInfo.attractPosition[index * TRANSFORM_FEEDBACK_ATTRACT_TARGET_POSITION_ELEMENTS_NUM + 1];
        const pz = instancingInfo.attractPosition[index * TRANSFORM_FEEDBACK_ATTRACT_TARGET_POSITION_ELEMENTS_NUM + 2];
        const amp = instancingInfo.attractPosition[index * TRANSFORM_FEEDBACK_ATTRACT_TARGET_POSITION_ELEMENTS_NUM + 3];
        if (updateBufferSubDataEnabled) {
            transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferSubData(
                TRANSFORM_FEEDBACK_ATTRIBUTE_ATTRACT_TARGET_POSITION,
                index,
                new Float32Array([px, py, pz, amp])
            );
        }

        //
        // transform feedback: stateを更新
        //

        // instancingInfo.attractType[index] = FollowerAttractMode.Position;
        instancingInfo.attractType[index] = mode;

        const [seed, , ,] = getCurrentTransformFeedbackState(index);

        const newState = setTransformFeedBackState(index, {
            seed,
            attractType: TransformFeedbackAttractMode.Attract,
        });

        instancingInfo.transformFeedbackStates[index * 4] = newState[0];
        instancingInfo.transformFeedbackStates[index * 4 + 1] = newState[1];
        instancingInfo.transformFeedbackStates[index * 4 + 2] = newState[2];
        instancingInfo.transformFeedbackStates[index * 4 + 3] = newState[3];

        if (updateBufferSubDataEnabled) {
            transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferSubData(
                TRANSFORM_FEEDBACK_ATTRIBUTE_STATE_NAME,
                index,
                new Float32Array(newState)
            );
        }
    };

    const setInstanceNum = (instanceNum: number) => {
        instancingInfo.instanceNum = instanceNum;
        mesh.geometry.instanceCount = instanceNum;
    };

    const updateStatesAndBuffers = () => {
        for (let i = 0; i < MAX_INSTANCE_NUM; i++) {
            const attractType = instancingInfo.attractType[i];
            const attractTarget = instancingInfo.attractorTarget[i];

            switch (_currentFollowMode) {
                case FollowerAttractMode.FollowCubeEdge:
                    const attractorTargetBox = _attractorTargetBoxMeshes[i % _attractorTargetBoxMeshes.length];
                    if (attractorTargetBox) {
                        // set edge
                        const lp = attractorTargetBox.geometry.getRandomLocalPositionOnEdge(
                            generateRandomValue(_followerSeed, i + _followerIndex),
                            generateRandomValue(_followerSeed, i + 1)
                        );
                        const wp = attractorTargetBox.transform.localPointToWorld(lp);
                        setInstanceAttractTargetPosition(i, FollowerAttractMode.FollowCubeEdge, {
                            p: wp,
                            attractAmplitude: 0.1,
                        });
                        setTransformFeedBackState(i, { attractType: TransformFeedbackAttractMode.Attract });
                    }
                    continue;

                case FollowerAttractMode.FollowSphereSurface:
                    if (_attractorTargetSphereActors) {
                        // const size = _attractorTargetSphereActor.transform.scale.x * 0.5;
                        const lp = randomOnUnitSphere(_followerSeed + i).scale(0.5);
                        const wp =
                            _attractorTargetSphereActors[
                                i % _attractorTargetSphereActors.length
                            ].transform.localPointToWorld(lp); // TODO: timelineの後でやるべき
                        // for debug
                        // console.log(i, randomOnUnitSphere(i).elements, randomOnUnitSphere(i).elements, lp.elements, wp.elements, _attractorTargetSphereActor.transform.worldMatrix, _attractorTargetSphereActor.transform.position.elements)
                        setInstanceAttractTargetPosition(i, FollowerAttractMode.FollowSphereSurface, {
                            p: wp,
                            attractAmplitude: 0.1,
                        });
                        setTransformFeedBackState(i, { attractType: TransformFeedbackAttractMode.Attract });
                    }
                    continue;

                case FollowerAttractMode.Ground:
                    const wp = randomOnUnitPlane(_followerSeed + i, 10); // TODO: scaleをfloor_actorから引っ張ってきたい
                    setInstanceAttractTargetPosition(i, FollowerAttractMode.FollowSphereSurface, {
                        p: wp,
                        attractAmplitude: 0,
                    });
                    setTransformFeedBackState(i, { attractType: TransformFeedbackAttractMode.Attract });
                    continue;
            }

            if (attractType === FollowerAttractMode.Attractor) {
                const orbitMoverBinderComponent = attractTarget?.getComponent<OrbitMoverBinder>();
                const delayValue = i * 0.5;
                const p = orbitMoverBinderComponent
                    ? orbitMoverBinderComponent.calcPosition(delayValue) //
                    : attractTarget!.transform.position;
                // attractTypeならTargetは必ずあるはず
                setInstanceAttractTargetPosition(i, FollowerAttractMode.Attractor, {
                    p,
                    attractAmplitude: 0.2,
                });
                setTransformFeedBackState(i, { attractType: TransformFeedbackAttractMode.Attract });
            }

            // tmp
            // const attractType = instancingInfo.attractType[i];
            // // TODO: follow cube edge から違うmodeに戻った時の処理
            // if (_currentFollowMode === FollowerAttractMode.FollowCubeEdge && !!_attractorTargetBox) {
            //     // set edge
            //     const lp = _attractorTargetBox.geometry.getRandomLocalPositionOnEdge(
            //         generateRandomValue(0, i),
            //         generateRandomValue(0, i + 1)
            //     );
            //     const wp = _attractorTargetBox.transform.localPointToWorld(lp);
            //     setInstanceAttractTargetPosition(i, wp, FollowerAttractMode.FollowCubeEdge);
            //     setTransformFeedBackState(i, { attractType: TransformFeedbackAttractMode.Attract });
            //     continue;
            // }

            // if (_currentFollowMode === FollowerAttractMode.FollowSphereSurface && !!_attractorTargetSphereActor) {
            //     // const size = _attractorTargetSphereActor.transform.scale.x * 0.5;
            //     const lp = randomOnUnitSphere(i).scale(0.5);
            //     const wp = _attractorTargetSphereActor.transform.localPointToWorld(lp);
            //     // for debug
            //     // console.log(i, randomOnUnitSphere(i).elements, randomOnUnitSphere(i).elements, lp.elements, wp.elements, _attractorTargetSphereActor.transform.worldMatrix, _attractorTargetSphereActor.transform.position.elements)
            //     setInstanceAttractTargetPosition(i, wp, FollowerAttractMode.FollowSphereSurface);
            //     setTransformFeedBackState(i, { attractType: TransformFeedbackAttractMode.Attract });
            //     continue;
            // }

            // //
            // // 先にuniformなfollowModeを確認してからinstanceごとのattractTypeを確認する
            // //

            // if (attractType === FollowerAttractMode.Attractor) {
            //     // attractTypeならTargetは必ずあるはず
            //     setInstanceAttractTargetPosition(i, attractTarget!.transform.position, FollowerAttractMode.Attractor);
            //     setTransformFeedBackState(i, { attractType: TransformFeedbackAttractMode.Attract });
            //     continue;
            // }
        }
    };

    // let attractorTargetBox: Actor | null;

    // mesh.subscribeOnStart((args) => {
    //     attractorTargetBox = args.scene.find("AB_1")
    // });

    // transform feedback の更新とかをするだけ
    // states準拠な更新をする
    mesh.beforeRender = () => {
        // tmp
        // for (let i = 0; i < instanceNum; i++) {
        //     switch (i % 4) {
        //         case 0:
        //             // setInstanceAttractTargetPosition(i, new Vector3(4, 2, 0));
        //             updateInstanceState(i, { attractEnabled: true });
        //             break;
        //         case 1:
        //             setInstanceAttractTargetPosition(i, new Vector3(4, 2, 0));
        //             updateInstanceState(i, { attractEnabled: false });
        //             break;
        //         case 2:
        //             setInstanceAttractTargetPosition(i, new Vector3(-4, 2, 0));
        //             updateInstanceState(i, { attractEnabled: true });
        //             break;
        //         case 3:
        //             setInstanceAttractTargetPosition(i, new Vector3(-4, 2, 0));
        //             updateInstanceState(i, { attractEnabled: false });
        //             break;
        //     }
        // }

        // 一括更新する場合
        // for(let i = 0; i < instanceNum; i++) {
        //     setInstancePosition(i, new Vector3(
        //         Math.random() * 5 - 2.5, Math.random() * 5 - 2.5, Math.random() * 5 - 2.5)
        //     );
        // }
        // mesh.geometry.vertexArrayObject.updateBufferData(AttributeNames.InstancePosition, instancingInfo.position);
        // transformFeedbackDoubleBuffer.uniforms.setValue('uTime', gpu.time);

        // buffer sub data が有効じゃない場合はバッファを一括で入れ替える
        if (!updateBufferSubDataEnabled) {
            mesh.geometry.vertexArrayObject.updateBufferData(
                AttributeNames.InstanceLookDirection,
                instancingInfo.lookDirection
            );
            mesh.geometry.vertexArrayObject.updateBufferData(
                AttributeNames.InstanceState,
                instancingInfo.instanceStates
            );
            mesh.geometry.vertexArrayObject.updateBufferData(AttributeNames.InstanceVertexColor, instancingInfo.color);
            mesh.geometry.vertexArrayObject.updateBufferData(
                AttributeNames.InstanceEmissiveColor,
                instancingInfo.emissiveColor
            );

            // transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferData(
            //     TRANSFORM_FEEDBACK_ATTRIBUTE_POSITION_NAME,
            //     instancingInfo.position
            // );
            // transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferData(
            //     TRANSFORM_FEEDBACK_ATTRIBUTE_VELOCITY_NAME,
            //     instancingInfo.velocity
            // );
            transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferData(
                TRANSFORM_FEEDBACK_ATTRIBUTE_ATTRACT_TARGET_POSITION,
                instancingInfo.attractPosition
            );

            transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferData(
                TRANSFORM_FEEDBACK_ATTRIBUTE_STATE_NAME,
                instancingInfo.transformFeedbackStates
            );
        }

        // transform feedback を更新
        // transformFeedbackDoubleBuffer.uniforms.setValue('uNeedsJumpPosition', needsJumpPosition ? 1 : 0);
        transformFeedbackDoubleBuffer.uniforms.setValue('uAttractRate', 0);
        gpu.updateTransformFeedback({
            shader: transformFeedbackDoubleBuffer.shader,
            uniforms: transformFeedbackDoubleBuffer.uniforms,
            vertexArrayObject: transformFeedbackDoubleBuffer.write.vertexArrayObject,
            transformFeedback: transformFeedbackDoubleBuffer.write.transformFeedback,
            drawCount: transformFeedbackDoubleBuffer.drawCount,
        });
        transformFeedbackDoubleBuffer.swap();

        //
        // インスタンスのメッシュのバッファを更新
        //

        mesh.geometry.vertexArrayObject.replaceBuffer(
            AttributeNames.InstancePosition,
            transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer(TRANSFORM_FEEDBACK_ATTRIBUTE_POSITION_NAME)!
        );
        mesh.geometry.vertexArrayObject.replaceBuffer(
            AttributeNames.InstanceVelocity,
            transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer(TRANSFORM_FEEDBACK_ATTRIBUTE_VELOCITY_NAME)!
        );

        mesh.geometry.instanceCount = instancingInfo.instanceNum;
    };

    mesh.onProcessPropertyBinder = (key: string, value: number) => {
        // diffuse mixer
        if (key === 'dm') {
            mesh.materials.forEach((material) => {
                material.uniforms.setValue(UNIFORM_DIFFUSE_MIXER_NAME, value);
            });
            return;
        }
        // emission mixer
        if (key === 'em') {
            mesh.materials.forEach((material) => {
                material.uniforms.setValue(UNIFORM_EMISSIVE_MIXER_NAME, value);
            });
            return;
        }
        // material index
        if (key === 'mi') {
            mesh.materials.forEach((_, i) => {
                mesh.setCanRenderMaterial(i, i === Math.round(value));
            });
        }

        //
        // forgeによる制御を受け付けている場合は以降は無視
        //

        if (_isControlled) {
            return;
        }

        // follower attract mode
        if (key === 'fm') {
            _currentFollowMode = Math.round(value) as FollowerAttractMode;
            //if (_currentFollowMode === FollowerAttractMode.FollowCubeEdge) {
            //}
            return;
        }

        // attract power
        if (key === 'ap') {
            // setInstanceAttractPower(value, value);
            return;
        }

        // morph rate
        if (key === 'mr') {
            setInstanceState(value, { morphRate: value });
            return;
        }

        // instance count
        if (key === 'ic') {
            setInstanceNum(value);
            return;
        }
    };

    mesh.onPostProcessTimeline = (time: number) => {
        if (isTimeInClip(time, 64, 72)) {
            const rr = clipRate(time, 64, 72);
            for (let i = 0; i < MAX_INSTANCE_NUM; i++) {
                if (i >= 96) {
                    setInstanceAttractPower(i, easeInOutQuad(rr));
                    setInstanceAttractorTarget(i, _orbitFollowTargetActor);
                    setInstanceState(i, { morphRate: easeOutQuad(rr) });
                }
            }
        }
    };
   
    // mesh.onLastUpdate = () => {
    //     mesh.geometry.instanceCount = MAX_INSTANCE_NUM;
    // }

    return {
        getActor: () => mesh,
        maxInstanceNum: MAX_INSTANCE_NUM,
        initialize,
        addInstance: () => {},
        activateInstance: () => {},
        setInstancePosition,
        setInstanceVelocity,
        setInstanceScale,
        setInstanceColor,
        setInstanceEmissiveColor,
        setInstanceLookDirection,
        setInstanceState,
        setInstanceAttractPower,
        setInstanceAttractorTarget,
        setInstanceAttractTargetPosition,
        setInstanceNum,
        getCurrentTransformFeedbackState,
        updateStatesAndBuffers,
        setControlled: (flag: boolean) => (_isControlled = flag),
        isControlled: () => _isControlled,
        setFollowAttractMode: (mode: FollowerAttractMode) => (_currentFollowMode = mode),
        // updateTransformFeedBackState,
    };
};
