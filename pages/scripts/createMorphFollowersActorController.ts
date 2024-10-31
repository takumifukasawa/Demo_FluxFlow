import { maton } from '@/PaleGL/utilities/maton.ts';
import { TransformFeedbackDoubleBuffer } from '@/PaleGL/core/TransformFeedbackDoubleBuffer.ts';
import { Attribute } from '@/PaleGL/core/Attribute.ts';
import {
    AttributeNames,
    AttributeUsageType,
    FaceSide,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants.ts';
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
import { generateRandomValue, randomOnUnitCircle, randomOnUnitSphere } from '@/PaleGL/utilities/mathUtilities.ts';
import {
    createObjectSpaceRaymarchMaterial,
    ObjectSpaceRaymarchMaterialArgs,
} from '@/PaleGL/materials/ObjectSpaceRaymarchMaterial.ts';
import { Material } from '@/PaleGL/materials/Material.ts';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
import { OrbitMoverBinder } from './orbitMoverBinder.ts';
import {
    buildTimelinePropertyB,
    buildTimelinePropertyG,
    buildTimelinePropertyR,
    clipRate,
    isTimeInClip,
    // tryAssignTimelineProperty,
} from '@/Marionetter/timelineUtilities.ts';
import { easeInOutQuad } from '@/PaleGL/utilities/easingUtilities.ts';
import { BoxGeometry } from '@/PaleGL/geometries/BoxGeometry.ts';
import { MorphSurfaceParameters } from './originForgeActorController.ts';
// import {DefaultForgeSurfaceParameters} from "./originForgeActorController.ts";

const UPDATE_BUFFER_SUB_DATA_ENABLED = false;

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
const TRANSFORM_FEEDBACK_UNIFORM_ATTRACT_BASE_POWER = 'uAttractBasePower';
const TRANSFORM_FEEDBACK_UNIFORM_ATTRACT_MIN_POWER = 'uAttractMinPower';

const UNIFORM_DIFFUSE_MIXER_NAME = 'uDiffuseMixer';
const UNIFORM_EMISSIVE_MIXER_NAME = 'uEmissiveMixer';
const UNIFORM_ROT_MODE_NAME = 'uRotMode';

const SURFACE_DIFFUSE_PROPERTY_BASE = 'sdc';
const SURFACE_EMISSIVE_PROPERTY_BASE = 'sec';

const rotRateForVelocityValue = 0;
const rotRateForLookDirectionValue = 1;

const boxIndexPicker = [0, 1, 1, 1];
const sphereIndexPicker = [0, 1, 1, 1];

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
    // 0: sp -> butterfly
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
    // 1: sp -> primitive
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
    // 2: sp -> flower
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
    _morphFollowersActorController: MorphFollowersActorController;
    _orbitFollowTargetActorName: string;
};

export type MorphFollowerActorControllerEntity = {
    _morphFollowersActorController: MorphFollowersActorController;
    _orbitFollowTargetActor: Actor;
};

export type MorphFollowersActorController = {
    getActor: () => Mesh;
    maxInstanceNum: number;
    initialize: (
        followerIndex: number,
        followerSeed: number,
        // defaultForgeSurfaceParameters: DefaultForgeSurfaceParameters,
        orbitFollowTargetActor: Actor,
        attractorTargetBoxActors: Actor[],
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
    setSurfaceParameters: (surfaceParameters: MorphSurfaceParameters) => void;
    isControlled: () => boolean;
    setFollowAttractMode: (mode: FollowerAttractMode) => void;
};

//
// functions
//

export const generateKeepFlyingInstancePositions = (i: number) => {
    return new Vector3(Math.cos(i) * 60, Math.sin(i) * 50, Math.sin(i) * 20);
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
        uniforms: [
            {
                name: TRANSFORM_FEEDBACK_UNIFORM_ATTRACT_BASE_POWER,
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: TRANSFORM_FEEDBACK_UNIFORM_ATTRACT_MIN_POWER,
                type: UniformTypes.Float,
                value: 0,
            },
        ],
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

export const createMorphFollowersActor = (
    name: string,
    gpu: GPU,
    renderer: Renderer, // instanceNum,
    insternalInstanceNum: number, // 本当はあんまり決めうちで渡したくないが・・・
    instanceVertexColorGenerator: (rx: number, ry: number, rz: number) => Color,
    instanceEmissiveColorGenerator: (rx: number, ry: number, rz: number) => Color
): MorphFollowersActorController => {
    let _followerIndex: number;
    let _followerSeed: number;
    let _currentFollowMode: FollowerAttractMode = FollowerAttractMode.None;
    let _isControlled = false;
    let _orbitFollowTargetActor: Actor;
    let _attractorTargetBoxActors: Actor[] = [];
    let _attractorTargetSphereActors: Actor[] = [];
    let _refBoxGeometry: BoxGeometry;
    const _internalInstanceNum = insternalInstanceNum;

    const stateParameters = {
        diffuseMixer: 0,
        emissionMixer: 0,
        floorEmitRange: 0,
        attractBasePower: 2,
        attractMinPower: 0.2,
        // attractPower: 1,
        attractAmplitude: 0.2,
        morphRate: 0,
    };

    const surfaceParameters: Required<MorphSurfaceParameters> = {
        metallic: 0,
        roughness: 0,
        diffuseColor: new Color(1, 1, 1, 1),
        emissiveColor: new Color(0.1, 0.1, 0.1, 1),
    };

    const initialize = (
        followerIndex: number,
        followerSeed: number,
        // defaultForgeSurfaceParameters: DefaultForgeSurfaceParameters,
        orbitFollowTargetActor: Actor,
        attractorTargetBoxActors: Actor[],
        attractorTargetSphereActors: Actor[]
    ) => {
        _followerIndex = followerIndex;
        _followerSeed = followerSeed;
        _orbitFollowTargetActor = orbitFollowTargetActor;
        _attractorTargetBoxActors = attractorTargetBoxActors;
        _attractorTargetSphereActors = attractorTargetSphereActors;
        _refBoxGeometry = new BoxGeometry({ gpu, size: 1 });
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
        const c = instanceVertexColorGenerator(
            generateRandomValue(0, i),
            generateRandomValue(1, i),
            generateRandomValue(2, i)
        );
        tmpInstanceInfo.color.push([...c.e]);

        // emissive color
        const ec = instanceEmissiveColorGenerator(
            generateRandomValue(0, i),
            generateRandomValue(1, i),
            generateRandomValue(2, i)
        );
        tmpInstanceInfo.emissiveColor.push([...ec.e]);

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

    // いろいろとインスタンスの情報を格納しておく部分
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
        // if (UPDATE_BUFFER_SUB_DATA_ENABLED) {
        // TODO: ここはupdateBufferSubDataせざるを得ないが、dirtyFragでもいいかもしれない
        transformFeedbackDoubleBuffer.updateBufferSubData(TRANSFORM_FEEDBACK_ATTRIBUTE_POSITION_NAME, index, p.e);
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
        // if (UPDATE_BUFFER_SUB_DATA_ENABLED) {
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
        if (UPDATE_BUFFER_SUB_DATA_ENABLED) {
            mesh.geometry.vertexArrayObject.updateBufferSubData(AttributeNames.InstanceScale, index, s.e);
        }
    };

    const setInstanceColor = (index: number, c: Color) => {
        // js側のデータとbufferのデータを更新
        instancingInfo.color[index * 4 + 0] = c.r;
        instancingInfo.color[index * 4 + 1] = c.g;
        instancingInfo.color[index * 4 + 2] = c.b;
        instancingInfo.color[index * 4 + 3] = c.a;
        if (UPDATE_BUFFER_SUB_DATA_ENABLED) {
            mesh.geometry.vertexArrayObject.updateBufferSubData(AttributeNames.InstanceVertexColor, index, c.e);
        }
    };

    const setInstanceEmissiveColor = (index: number, c: Color) => {
        // js側のデータとbufferのデータを更新
        instancingInfo.emissiveColor[index * ATTRIBUTE_EMISSIVE_COLOR_ELEMENTS_NUM + 0] = c.r;
        instancingInfo.emissiveColor[index * ATTRIBUTE_EMISSIVE_COLOR_ELEMENTS_NUM + 1] = c.g;
        instancingInfo.emissiveColor[index * ATTRIBUTE_EMISSIVE_COLOR_ELEMENTS_NUM + 2] = c.b;
        instancingInfo.emissiveColor[index * ATTRIBUTE_EMISSIVE_COLOR_ELEMENTS_NUM + 3] = c.a;
        if (UPDATE_BUFFER_SUB_DATA_ENABLED) {
            mesh.geometry.vertexArrayObject.updateBufferSubData(AttributeNames.InstanceEmissiveColor, index, c.e);
        }
    };

    const setInstanceLookDirection = (index: number, lookDirection: Vector3) => {
        // js側のデータとbufferのデータを更新
        instancingInfo.lookDirection[index * ATTRIBUTE_LOOK_DIRECTION_ELEMENTS_NUM + 0] = lookDirection.x;
        instancingInfo.lookDirection[index * ATTRIBUTE_LOOK_DIRECTION_ELEMENTS_NUM + 1] = lookDirection.y;
        instancingInfo.lookDirection[index * ATTRIBUTE_LOOK_DIRECTION_ELEMENTS_NUM + 2] = lookDirection.z;
        if (UPDATE_BUFFER_SUB_DATA_ENABLED) {
            mesh.geometry.vertexArrayObject.updateBufferSubData(AttributeNames.InstanceState, index, lookDirection.e);
        }
    };

    const setInstanceState = (
        index: number,
        {
            morphRate,
            delayRate,
            scale,
        }: {
            morphRate?: number;
            delayRate?: number;
            scale?: number;
        }
    ) => {
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
        if (UPDATE_BUFFER_SUB_DATA_ENABLED) {
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

        if (UPDATE_BUFFER_SUB_DATA_ENABLED) {
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
        if (UPDATE_BUFFER_SUB_DATA_ENABLED) {
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

        if (UPDATE_BUFFER_SUB_DATA_ENABLED) {
            transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferSubData(
                TRANSFORM_FEEDBACK_ATTRIBUTE_STATE_NAME,
                index,
                new Float32Array(newState)
            );
        }
    };

    const setInstanceNum = (instanceNum: number) => {
        const n = Math.floor(instanceNum);
        instancingInfo.instanceNum = n;
        mesh.geometry.instanceCount = n;
    };

    const tmpPositions = maton.range(MAX_INSTANCE_NUM).map(() => Vector3.zero);

    // on post process timeline で上流から呼ばれる
    const updateStatesAndBuffers = () => {
        for (let i = 0; i < MAX_INSTANCE_NUM; i++) {
            //
            // コントロールされていない時の処理
            //
            if (!_isControlled) {
                // 最大instance数より遠い場合は適当な場所に飛ばす
                if (i >= instancingInfo.instanceNum) {
                    setInstancePosition(i, generateKeepFlyingInstancePositions(i));
                }
                // morph rate
                setInstanceState(i, { morphRate: stateParameters.morphRate });
            }

            //
            // follow mode に応じて追従先の位置を設定
            //
            const attractType = instancingInfo.attractType[i];
            const attractTarget = instancingInfo.attractorTarget[i];

            switch (_currentFollowMode) {
                case FollowerAttractMode.FollowCubeEdge:
                    const pickIndex = boxIndexPicker[i % boxIndexPicker.length];
                    const attractorTargetBoxActor = _attractorTargetBoxActors[pickIndex];
                    if (attractorTargetBoxActor) {
                        const seed = _followerSeed * 10;
                        // 1: set edge
                        const lp = _refBoxGeometry.getRandomLocalPositionOnEdge(
                            generateRandomValue(seed, i + _followerIndex * 2),
                            generateRandomValue(seed, i + _followerIndex * 3)
                        );
                        // // 2: set edge( surface)
                        // const lp = _refBoxGeometry.getRandomLocalPositionOnSurface(
                        //     i,
                        //     generateRandomValue(seed, i + _followerIndex * 2),
                        //     generateRandomValue(seed, i + _followerIndex * 3)
                        // );
                        // TODO: tmpPositionsそのもののvectorを渡したい
                        const wp = attractorTargetBoxActor.transform.localPointToWorld(lp);
                        tmpPositions[i].x = wp.x;
                        tmpPositions[i].y = wp.y;
                        tmpPositions[i].z = wp.z;
                        setInstanceAttractTargetPosition(i, FollowerAttractMode.FollowCubeEdge, {
                            p: tmpPositions[i],
                            attractAmplitude: stateParameters.attractAmplitude,
                        });
                        setTransformFeedBackState(i, { attractType: TransformFeedbackAttractMode.Attract });
                    }
                    continue;

                case FollowerAttractMode.FollowSphereSurface:
                    if (_attractorTargetSphereActors) {
                        // const size = _attractorTargetSphereActor.transform.scale.x * 0.5;
                        const pickIndex = sphereIndexPicker[i % sphereIndexPicker.length];
                        const lp = tmpPositions[i];
                        randomOnUnitSphere(_followerSeed + i, lp);
                        lp.scale(0.5);
                        // TODO: tmpPositionsそのもののvectorを渡したい
                        const wp = _attractorTargetSphereActors[pickIndex].transform.localPointToWorld(lp); // TODO: timelineの後でやるべき?
                        // for debug
                        // console.log(i, randomOnUnitSphere(i).e, randomOnUnitSphere(i).e, lp.e, wp.e, _attractorTargetSphereActor.transform.worldMatrix, _attractorTargetSphereActor.transform.position.e)
                        // tmpPositions[i].x = wp.x;
                        // tmpPositions[i].y = wp.y;
                        // tmpPositions[i].z = wp.z;
                        setInstanceAttractTargetPosition(i, FollowerAttractMode.FollowSphereSurface, {
                            p: wp,
                            attractAmplitude: stateParameters.attractAmplitude,
                        });
                        setTransformFeedBackState(i, { attractType: TransformFeedbackAttractMode.Attract });
                    }
                    continue;

                case FollowerAttractMode.Ground:
                    // TODO: tmpPositionsそのもののvectorを渡したい
                    const wp = tmpPositions[i];
                    randomOnUnitCircle(_followerSeed + i, stateParameters.floorEmitRange, wp); // TODO: scaleをfloor_actorから引っ張ってきたい
                    // tmpPositions[i].x = wp.x;
                    // tmpPositions[i].y = wp.y;
                    // tmpPositions[i].z = wp.z;
                    setInstanceAttractTargetPosition(i, FollowerAttractMode.FollowSphereSurface, {
                        p: wp,
                        attractAmplitude: stateParameters.attractAmplitude,
                    });
                    setTransformFeedBackState(i, { attractType: TransformFeedbackAttractMode.Attract });
                    continue;
            }

            if (attractType === FollowerAttractMode.Attractor) {
                const orbitMoverBinderComponent = attractTarget?.getComponent<OrbitMoverBinder>();
                const delayValue = i * 0.5;
                const p = orbitMoverBinderComponent
                    ? orbitMoverBinderComponent.calcPosition(delayValue) // ベクトルはcomponentの中で単一のものだが、ループで更新してるので大丈夫なはず
                    : attractTarget!.transform.position;
                // p.y += Math.sin((performance.now() / 1000) * 0.5 + i * 0.2) * 1;
                tmpPositions[i].x = p.x;
                tmpPositions[i].y = p.y + Math.sin((performance.now() / 1000) * 0.5 + i * 0.2) * 1;
                tmpPositions[i].z = p.z;
                // attractTypeならTargetは必ずあるはず
                setInstanceAttractTargetPosition(i, FollowerAttractMode.Attractor, {
                    // p,
                    p: tmpPositions[i],
                    attractAmplitude: stateParameters.attractAmplitude,
                });
                setTransformFeedBackState(i, { attractType: TransformFeedbackAttractMode.Attract });
            }
        }
    };

    const setSurfaceParameters = (_surfaceParameters: Partial<MorphSurfaceParameters>) => {
        if (_surfaceParameters.metallic !== undefined) {
            surfaceParameters.metallic = _surfaceParameters.metallic;
        }
        if (_surfaceParameters.roughness !== undefined) {
            surfaceParameters.roughness = _surfaceParameters.roughness;
        }
        if (_surfaceParameters.diffuseColor !== undefined) {
            surfaceParameters.diffuseColor.copy(_surfaceParameters.diffuseColor);
        }
        if (_surfaceParameters.emissiveColor !== undefined) {
            surfaceParameters.emissiveColor.copy(_surfaceParameters.emissiveColor);
        }
    };

    // transform feedback の更新とかをするだけ
    // states準拠な更新をする
    mesh.beforeRender = () => {
        //
        // surfaces
        //

        mesh.materials.forEach((material) => {
            material.uniforms.setValue(UNIFORM_DIFFUSE_MIXER_NAME, stateParameters.diffuseMixer);
        });
        mesh.materials.forEach((material) => {
            material.uniforms.setValue(UNIFORM_EMISSIVE_MIXER_NAME, stateParameters.emissionMixer);
        });

        mesh.materials.forEach((material) => {
            material.uniforms.setValue(UniformNames.Metallic, surfaceParameters.metallic);
        });
        mesh.materials.forEach((material) => {
            material.uniforms.setValue(UniformNames.Roughness, surfaceParameters.roughness);
        });
        mesh.materials.forEach((material) => {
            material.uniforms.setValue(UniformNames.DiffuseColor, surfaceParameters.diffuseColor);
        });
        mesh.materials.forEach((material) => {
            material.uniforms.setValue(UniformNames.EmissiveColor, surfaceParameters.emissiveColor);
        });

        //
        // buffers
        //
        // tmp: 一括更新する場合
        // for(let i = 0; i < instanceNum; i++) {
        //     setInstancePosition(i, new Vector3(
        //         Math.random() * 5 - 2.5, Math.random() * 5 - 2.5, Math.random() * 5 - 2.5)
        //     );
        // }
        // mesh.geometry.vertexArrayObject.updateBufferData(AttributeNames.InstancePosition, instancingInfo.position);
        // transformFeedbackDoubleBuffer.uniforms.setValue('uTime', gpu.time);

        // buffer sub data が有効じゃない場合はバッファを一括で入れ替える
        if (!UPDATE_BUFFER_SUB_DATA_ENABLED) {
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

            transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferData(
                TRANSFORM_FEEDBACK_ATTRIBUTE_ATTRACT_TARGET_POSITION,
                instancingInfo.attractPosition
            );
            transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferData(
                TRANSFORM_FEEDBACK_ATTRIBUTE_STATE_NAME,
                instancingInfo.transformFeedbackStates
            );
        }

        // update transform feedback uniforms
        transformFeedbackDoubleBuffer.uniforms.setValue(
            TRANSFORM_FEEDBACK_UNIFORM_ATTRACT_BASE_POWER,
            stateParameters.attractBasePower
        );
        transformFeedbackDoubleBuffer.uniforms.setValue(
            TRANSFORM_FEEDBACK_UNIFORM_ATTRACT_MIN_POWER,
            stateParameters.attractMinPower
        );

        // transform feedback を更新
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
            stateParameters.diffuseMixer = value;
            return;
        }
        // emission mixer
        if (key === 'em') {
            stateParameters.emissionMixer = value;
            return;
        }
        // material index
        if (key === 'mi') {
            mesh.materials.forEach((_, i) => {
                mesh.setCanRenderMaterial(i, i === Math.round(value));
            });
        }
        // floor range
        if (key === 'ffr') {
            stateParameters.floorEmitRange = value;
        }

        // attract base power
        if (key === 'abp') {
            stateParameters.attractBasePower = value;
            // setInstanceAttractPower(value, value);
            return;
        }

        // attract min power
        if (key === 'amp') {
            stateParameters.attractMinPower = value;
            return;
        }

        // morph rate
        // controlに関わらずセットはするが、実際にfollower自身で適用するのはcontrolがfalseの時@postProcessTimeline
        if (key === 'mr') {
            stateParameters.morphRate = value;
            return;
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

        // attract amplitude
        if (key === 'aa') {
            stateParameters.attractAmplitude = value;
            return;
        }

        // instance count
        if (key === 'ic') {
            setInstanceNum(value);
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
        // tryAssignTimelineProperty(key, value, buildTimelinePropertyB(SURFACE_DIFFUSE_PROPERTY_BASE), (v) => {
        //     surfaceParameters.diffuseColor.b = v;
        // })

        // emissive r
        if (key === buildTimelinePropertyR(SURFACE_EMISSIVE_PROPERTY_BASE)) {
            surfaceParameters.emissiveColor.r = value;
            return;
        }
        // tryAssignTimelineProperty(key, value, buildTimelinePropertyR(SURFACE_EMISSIVE_PROPERTY_BASE), (v) => {
        //     surfaceParameters.emissiveColor.r = v;
        // })
        // emissive g
        if (key === buildTimelinePropertyG(SURFACE_EMISSIVE_PROPERTY_BASE)) {
            surfaceParameters.emissiveColor.g = value;
            return;
        }
        // tryAssignTimelineProperty(key, value, buildTimelinePropertyG(SURFACE_EMISSIVE_PROPERTY_BASE), (v) => {
        //     surfaceParameters.emissiveColor.g = v;
        // })
        // emissive b
        if (key === buildTimelinePropertyB(SURFACE_EMISSIVE_PROPERTY_BASE)) {
            surfaceParameters.emissiveColor.b = value;
            return;
        }
        // tryAssignTimelineProperty(key, value, buildTimelinePropertyB(SURFACE_EMISSIVE_PROPERTY_BASE), (v) => {
        //     surfaceParameters.emissiveColor.b = v;
        // })
    };

    mesh.onPostProcessTimeline = (time: number) => {
        if (isTimeInClip(time, 64, 72)) {
            const rr = clipRate(time, 64, 72);
            for (let i = 0; i < MAX_INSTANCE_NUM; i++) {
                if (i >= _internalInstanceNum) {
                    setInstanceAttractPower(i, easeInOutQuad(rr));
                    setInstanceAttractorTarget(i, _orbitFollowTargetActor);
                    // timeline側からやるようになったのでいらないはず
                    // setInstanceState(i, { morphRate: easeOutQuad(rr) });
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
        setSurfaceParameters,
        setControlled: (flag: boolean) => (_isControlled = flag),
        isControlled: () => _isControlled,
        setFollowAttractMode: (mode: FollowerAttractMode) => (_currentFollowMode = mode),
        // updateTransformFeedBackState,
    };
};
