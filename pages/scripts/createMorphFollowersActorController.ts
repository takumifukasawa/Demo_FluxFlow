import { maton } from '@/PaleGL/utilities/maton.ts';
import { TransformFeedbackDoubleBuffer } from '@/PaleGL/core/TransformFeedbackDoubleBuffer.ts';
import { Attribute } from '@/PaleGL/core/Attribute.ts';
import { AttributeNames, AttributeUsageType, FaceSide, UniformBlockNames } from '@/PaleGL/constants.ts';
import transformFeedbackVertexFollower from '@/PaleGL/shaders/custom/entry/transform-feedback-vertex-demo-follower.glsl';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/ObjectSpaceRaymarchMesh.ts';
// import litObjectSpaceRaymarchFragMetaMorphContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-meta-morph.glsl';
// import gBufferObjectSpaceRaymarchFragMetaMorphDepthContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-meta-morph.glsl';
import litObjectSpaceRaymarchFragMorphButterflyWithFlowerContent from '@/PaleGL/shaders/custom/entry/lit-object-space-raymarch-fragment-morph-butterly-with-flower.glsl';
import gBufferObjectSpaceRaymarchFragMetaMorphButterflyWithFlowerContent from '@/PaleGL/shaders/custom/entry/gbuffer-object-space-raymarch-depth-fragment-morph-butterfly-with-flower.glsl';
import { Color } from '@/PaleGL/math/Color.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import { Renderer } from '@/PaleGL/core/Renderer.ts';
import { Mesh } from '@/PaleGL/actors/Mesh.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';

const MAX_INSTANCE_NUM = 256;
const INITIAL_INSTANCE_NUM = 1;

const TRANSFORM_FEEDBACK_ATTRIBUTE_POSITION_NAME = 'aPosition';
const TRANSFORM_FEEDBACK_ATTRIBUTE_VELOCITY_NAME = 'aVelocity';
const TRANSFORM_FEEDBACK_ATTRIBUTE_ATTRACT_TARGET_POSITION = 'aAttractTargetPosition';
const TRANSFORM_FEEDBACK_ATTRIBUTE_STATE_NAME = 'aState';

// const attractTargetType = {
//     Attractor: 0,
//     Position: 1,
//     Circle: 2,
//     Line: 3,
// } as const;

export const FollowerAttractMode = {
    None: 0,
    Position: 1,
    Attractor: 2,
} as const;
export type FollowerAttractMode = (typeof FollowerAttractMode)[keyof typeof FollowerAttractMode];

const TransformFeedbackAttractMode = {
    None: 0,
    Jump: 1,
    Attract: 2,
} as const;
export type TransformFeedbackAttractMode =
    (typeof TransformFeedbackAttractMode)[keyof typeof TransformFeedbackAttractMode];

export type MorphFollowersActorController = {
    getActor: () => Mesh;
    updateBuffers: () => void;
    addInstance: () => void;
    activateInstance: () => void;
    setInstancePosition: (index: number, p: Vector3) => void;
    setInstanceVelocity: (index: number, v: Vector3) => void;
    setInstanceMorphRate: (index: number, morphRate: number) => void;
    setInstanceAttractorTarget: (index: number, actor: Actor | null) => void;
    setInstanceAttractTargetPosition: (index: number, p: Vector3) => void;
    setInstanceNum: (instanceNum: number) => void;
    getCurrentTransformFeedbackState: (index: number) => number[];
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
                return [0, 0, 0];
            })
            .flat()
    );

    const initialAttractTargetPosition = new Float32Array(
        maton
            .range(instanceNum)
            .map(() => {
                return [0, 0, 0];
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
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: TRANSFORM_FEEDBACK_ATTRIBUTE_ATTRACT_TARGET_POSITION,
                data: initialAttractTargetPosition,
                size: 3,
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
                name: 'vPosition',
                data: new Float32Array(initialPosition),
            },
            {
                name: 'vVelocity',
                data: new Float32Array(initialVelocity),
            },
        ],
        vertexShader: transformFeedbackVertexFollower,
        uniforms: [],
        uniformBlockNames: [UniformBlockNames.Common],
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
    gpu,
    renderer, // instanceNum,
} // attractorActor,
: {
    gpu: GPU;
    renderer: Renderer;
    // instanceNum: number;
    // attractorActor: Actor;
}): MorphFollowersActorController => {
    const instanceNum = INITIAL_INSTANCE_NUM;

    const mesh = new ObjectSpaceRaymarchMesh({
        name: 'Followers',
        gpu,
        size: 1,
        fragmentShaderContent: litObjectSpaceRaymarchFragMorphButterflyWithFlowerContent,
        depthFragmentShaderContent: gBufferObjectSpaceRaymarchFragMetaMorphButterflyWithFlowerContent,
        materialArgs: {
            // fragmentShader: litObjectSpaceRaymarchMetaMorphFrag,
            // depthFragmentShader: gBufferObjectSpaceRaymarchMetaMorphDepthFrag,
            metallic: 0,
            roughness: 0,
            emissiveColor: new Color(2, 1, 1, 1),
            receiveShadow: true,
            isInstancing: true,
            useInstanceLookDirection: true,
            useVertexColor: false,
            faceSide: FaceSide.Double,
        },
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
        instanceStates: number[][]; // [morphRate, 0, 0, 0]
        transformFeedbackStates: number[][]; // [seed, attractType, morphRate, 0]
    } = {
        position: [],
        scale: [],
        rotation: [],
        velocity: [],
        color: [],
        instanceStates: [],
        transformFeedbackStates: [],
    };

    maton.range(MAX_INSTANCE_NUM, true).forEach((i) => {
        // position
        tmpInstanceInfo.position.push([0, 0, 0]);

        // scale
        // tmp
        // const baseScale = 2;
        // const randomScaleRange = 0.25;
        // const s = Math.random() * randomScaleRange + baseScale;
        const s = 1;
        tmpInstanceInfo.scale.push([s, s, s]);

        // rotation
        tmpInstanceInfo.rotation.push([0, 0, 0]);

        // velocity
        tmpInstanceInfo.velocity.push([0, 0, 0]);

        // color
        const c = Color.fromRGB(
            Math.floor(Math.random() * 180 + 20),
            Math.floor(Math.random() * 20 + 20),
            Math.floor(Math.random() * 180 + 20)
        );
        tmpInstanceInfo.color.push([...c.elements]);

        // states
        tmpInstanceInfo.instanceStates.push([1, 0, 0, 0]);

        tmpInstanceInfo.transformFeedbackStates.push([i, 0, 0, 0]);
    });

    const instancingInfo: {
        position: Float32Array;
        scale: Float32Array;
        rotation: Float32Array;
        velocity: Float32Array;
        color: Float32Array;
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
        color: new Float32Array(tmpInstanceInfo.color.flat()),
        instanceStates: new Float32Array(tmpInstanceInfo.instanceStates.flat()),
        transformFeedbackStates: new Float32Array(tmpInstanceInfo.transformFeedbackStates.flat()),
        attractType: maton.range(MAX_INSTANCE_NUM).map(() => FollowerAttractMode.None),
        attractorTarget: maton.range(MAX_INSTANCE_NUM).map(() => null),
        attractPosition: new Float32Array(
            maton
                .range(MAX_INSTANCE_NUM)
                .map(() => [0, 0, 0])
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
            name: AttributeNames.InstanceVelocity,
            data: instancingInfo.velocity,
            size: 3,
            divisor: 1,
        })
    );
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceState,
            data: instancingInfo.instanceStates,
            size: 4,
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
        transformFeedbackDoubleBuffer.updateBufferSubData(
            TRANSFORM_FEEDBACK_ATTRIBUTE_POSITION_NAME,
            index,
            p.elements
        );

        // TODO: attractTypeを更新する
    };

    const setInstanceVelocity = (index: number, v: Vector3) => {
        // js側のデータとbufferのデータを更新
        instancingInfo.velocity[index * 3] = v.x;
        instancingInfo.velocity[index * 3 + 1] = v.y;
        instancingInfo.velocity[index * 3 + 2] = v.z;
        transformFeedbackDoubleBuffer.updateBufferSubData(
            TRANSFORM_FEEDBACK_ATTRIBUTE_VELOCITY_NAME,
            index,
            v.elements
        );
    };

    const setInstanceMorphRate = (index: number, morphRate: number) => {
        // js側のデータとbufferのデータを更新
        instancingInfo.instanceStates[index * 4 + 0] = morphRate;
        mesh.geometry.vertexArrayObject.updateBufferSubData(
            AttributeNames.InstanceState,
            index,
            new Float32Array([morphRate, 0, 0, 0])
        );

        setTransformFeedBackState(index, { morphRate });
    };

    const setInstanceAttractorTarget = (index: number, actor: Actor | null) => {
        instancingInfo.attractType[index] = FollowerAttractMode.Attractor;
        instancingInfo.attractorTarget[index] = actor;
    };

    const getCurrentTransformFeedbackState = (index: number) => {
        const seed = instancingInfo.transformFeedbackStates[index * 4 + 0];
        const morphRate = instancingInfo.transformFeedbackStates[index * 4 + 2];

        const attractType = 1;
        instancingInfo.transformFeedbackStates[index * 4 + 1] = attractType; // attract enabled

        return [seed, attractType, morphRate, 0];
    };

    const setTransformFeedBackState = (
        index: number,
        values: {
            seed?: number;
            attractType?: TransformFeedbackAttractMode;
            morphRate?: number;
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

        const data = [
            instancingInfo.transformFeedbackStates[index * 4 + 0],
            instancingInfo.transformFeedbackStates[index * 4 + 1],
            instancingInfo.transformFeedbackStates[index * 4 + 2],
            0,
        ];

        transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferSubData(
            TRANSFORM_FEEDBACK_ATTRIBUTE_STATE_NAME,
            index,
            new Float32Array(data)
        );

        return data;
    };

    const setInstanceAttractTargetPosition = (index: number, p: Vector3) => {
        //
        // transform feedback: 追従先の位置を更新
        //

        instancingInfo.attractPosition[index * 3] = p.x;
        instancingInfo.attractPosition[index * 3 + 1] = p.y;
        instancingInfo.attractPosition[index * 3 + 2] = p.z;
        transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferSubData(
            TRANSFORM_FEEDBACK_ATTRIBUTE_ATTRACT_TARGET_POSITION,
            index,
            p.elements
        );

        //
        // transform feedback: stateを更新
        //

        instancingInfo.attractType[index] = FollowerAttractMode.Position;

        const [seed, , ,] = getCurrentTransformFeedbackState(index);

        const newState = setTransformFeedBackState(index, {
            seed,
            attractType: TransformFeedbackAttractMode.Attract,
        });

        instancingInfo.transformFeedbackStates[index * 4] = newState[0];
        instancingInfo.transformFeedbackStates[index * 4 + 1] = newState[1];
        instancingInfo.transformFeedbackStates[index * 4 + 2] = newState[2];
        instancingInfo.transformFeedbackStates[index * 4 + 3] = newState[3];

        transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferSubData(
            TRANSFORM_FEEDBACK_ATTRIBUTE_STATE_NAME,
            index,
            new Float32Array(newState)
        );
    };

    const setInstanceNum = (instanceNum: number) => {
        instancingInfo.instanceNum = instanceNum;
        mesh.geometry.instanceCount = instanceNum;
    };

    // const updateInstanceState = (index: number, values: { seed?: number; attractEnabled?: boolean }) => {
    //     const { seed, attractEnabled } = values;
    //     const elementSize = 4;
    //     // TODO: getBufferSubDataをせずに、js内でstate管理する
    //     const currentData = transformFeedbackDoubleBuffer.read.vertexArrayObject.getBufferSubData(
    //         TRANSFORM_FEEDBACK_ATTRIBUTE_STATE_NAME,
    //         index,
    //         elementSize
    //     );
    //     const newSeed = seed ?? currentData[0];
    //     let newAttractEnabled = currentData[1];
    //     if (attractEnabled !== undefined) {
    //         newAttractEnabled = attractEnabled ? 1 : 0;
    //     }
    //     const newStates = new Float32Array([newSeed, newAttractEnabled, 0, 0]);
    //     transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferSubData(
    //         TRANSFORM_FEEDBACK_ATTRIBUTE_STATE_NAME,
    //         index,
    //         newStates
    //     );
    // };

    // const setInstanceState = (index: number, state: number) => {
    //     transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferSubData(
    //         TRANSFORM_FEEDBACK_ATTRIBUTE_ATTRACT_TARGET_POSITION,
    //         index,
    //         p.elements
    //     );
    // }

    // let needsUpdate = false;

    // for debug

    // // 増やすテスト
    // window.addEventListener('keydown', (e) => {
    //     if (e.key === 'a') {
    //         instancingInfo.instanceNum++;
    //         instancingInfo.instanceNum %= MAX_INSTANCE_NUM;
    //     }
    // });

    // window.addEventListener('keydown', (e) => {
    //     if (e.key === 'j') {
    //         // for(let i = 0; i < )
    //         setInstanceAttractTargetPosition(0, new Vector3(Math.random() * 5 - 2.5, 5, 0)// );
    //     }
    // });
    // window.addEventListener('keydown', (e) => {
    //     if (e.key === 'v') {
    //         setInstancePosition(0, new Vector3(Math.random() * 5 - 2.5, 5, 0));
    //         // setInstancePosition(0, new Vector3(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5, // Math.random() * 5 - 2.5));
    //         setInstanceVelocity(0, new Vector3(0, 0.1, 0));
    //     }
    // });

    const updateBuffers = () => {
        for (let i = 0; i < MAX_INSTANCE_NUM; i++) {
            const attractTarget = instancingInfo.attractorTarget[i];
            if (attractTarget != null) {
                setInstanceAttractTargetPosition(i, attractTarget.transform.position);
                setTransformFeedBackState(i, { attractType: TransformFeedbackAttractMode.Attract });
            }
        }

        // TODO: 全部setbufferしちゃう
    };

    mesh.onUpdate = () => {
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

        // attractorActor.transform.position = new Vector3(0, 4, 0);

        // インスタンスのメッシュを更新
        mesh.geometry.vertexArrayObject.replaceBuffer(
            AttributeNames.InstancePosition,
            transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer(TRANSFORM_FEEDBACK_ATTRIBUTE_POSITION_NAME)
        );
        mesh.geometry.vertexArrayObject.replaceBuffer(
            AttributeNames.InstanceVelocity,
            transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer(TRANSFORM_FEEDBACK_ATTRIBUTE_VELOCITY_NAME)
        );

        mesh.geometry.instanceCount = instancingInfo.instanceNum;

        // needsJumpPosition = false;
    };

    // mesh.onProcessPropertyBinder = (key: string, value: number) => {
    //     if (key === 'ic') {
    //         instancingInfo.instanceNum = Math.floor(value);
    //     }
    // };

    return {
        getActor: () => mesh,
        addInstance: () => {},
        activateInstance: () => {},
        setInstancePosition,
        setInstanceVelocity,
        setInstanceMorphRate,
        setInstanceAttractorTarget,
        setInstanceAttractTargetPosition,
        setInstanceNum,
        getCurrentTransformFeedbackState,
        updateBuffers,
        // updateTransformFeedBackState,
    };
};
