import { maton } from '@/PaleGL/utilities/maton.ts';
import { TransformFeedbackDoubleBuffer } from '@/PaleGL/core/TransformFeedbackDoubleBuffer.ts';
import { Attribute } from '@/PaleGL/core/Attribute.ts';
import { AttributeNames, AttributeUsageType, FaceSide, UniformBlockNames, UniformTypes } from '@/PaleGL/constants.ts';
import demoMetaMorphTransformFeedbackVertex from '@/PaleGL/shaders/demo-meta-morph-transform-feedback-vertex.glsl';
import { Vector2 } from '@/PaleGL/math/Vector2.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { ObjectSpaceRaymarchMesh } from '@/PaleGL/actors/ObjectSpaceRaymarchMesh.ts';
import litObjectSpaceRaymarchMetaMorphFrag from '@/PaleGL/shaders/lit-object-space-raymarch-meta-morph-fragment.glsl';
import gBufferObjectSpaceRaymarchMetaMorphDepthFrag from '@/PaleGL/shaders/gbuffer-object-space-raymarch-meta-morph-depth-fragment.glsl';
import { Color } from '@/PaleGL/math/Color.ts';
import { saturate } from '@/PaleGL/utilities/mathUtilities.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';
import { AbstractInputController } from '@/PaleGL/inputs/AbstractInputController.ts';
import { Renderer } from '@/PaleGL/core/Renderer.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';

const MAX_INSTANCE_NUM = 1024;

const ATTRIBUTE_POSITION_NAME = 'aPosition';
const ATTRIBUTE_VELOCITY_NAME = 'aVelocity';
const ATTRIBUTE_STATE_NAME = 'aState';
const ATTRIBUTE_ATTRACT_TARGET_NAME = 'aAttractTargetPosition';

const createInstanceUpdater = ({
    gpu,
    renderer,
    instanceNum,
}: {
    gpu: GPU;
    renderer: Renderer;
    instanceNum: number;
}) => {
    //
    // begin create mesh
    //

    // const planeNum = 512;

    const initialPosition = new Float32Array(
        maton
            .range(instanceNum)
            .map(() => {
                const range = 10;
                return [
                    Math.random() * range - range * 0.5,
                    Math.random() * 4 + 2,
                    Math.random() * range - range * 0.5,
                ];
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

    const initialState = new Float32Array(
        maton
            .range(instanceNum, true)
            .map((i) => {
                return [i, 0, 0, 0];
            })
            .flat()
    );

    const transformFeedbackDoubleBuffer = new TransformFeedbackDoubleBuffer({
        gpu,
        attributes: [
            new Attribute({
                name: ATTRIBUTE_POSITION_NAME,
                data: initialPosition,
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: ATTRIBUTE_VELOCITY_NAME,
                data: initialVelocity,
                size: 3,
                usageType: AttributeUsageType.DynamicDraw,
            }),
            new Attribute({
                name: ATTRIBUTE_ATTRACT_TARGET_NAME,
                data: initialAttractTargetPosition,
                size: 3,
                usageType: AttributeUsageType.StaticDraw,
            }),
            new Attribute({
                name: ATTRIBUTE_STATE_NAME,
                data: initialState,
                size: 4,
                usageType: AttributeUsageType.StaticDraw,
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
        vertexShader: demoMetaMorphTransformFeedbackVertex,
        uniforms: [
            {
                name: 'uNormalizedInputPosition',
                type: UniformTypes.Vector2,
                value: Vector2.zero,
            },
            {
                name: 'uAttractTargetPosition',
                type: UniformTypes.Vector3,
                value: Vector3.zero,
            },
            {
                name: 'uAttractRate',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uNeedsJumpPosition',
                type: UniformTypes.Float,
                value: 0,
            },
        ],
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

export const createMetaMorphActor = ({
    gpu,
    renderer,
    inputController,
    instanceNum,
    attractorActor,
}: {
    gpu: GPU;
    renderer: Renderer;
    instanceNum: number;
    inputController: AbstractInputController;
    attractorActor: Actor;
}) => {
    const mesh = new ObjectSpaceRaymarchMesh({
        gpu,
        size: 0.5,
        materialArgs: {
            fragmentShader: litObjectSpaceRaymarchMetaMorphFrag,
            depthFragmentShader: gBufferObjectSpaceRaymarchMetaMorphDepthFrag,
            metallic: 0,
            roughness: 0,
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

    const instanceInfo: {
        position: number[][];
        scale: number[][];
        rotation: number[][];
        velocity: number[][];
        color: number[][];
    } = {
        position: [],
        scale: [],
        rotation: [],
        velocity: [],
        color: [],
    };
    maton.range(instanceNum).forEach(() => {
        instanceInfo.position.push([0, 0, 0]);

        // const baseScale = 0.25;
        const baseScale = 2;
        const randomScaleRange = 0.25;
        const s = Math.random() * randomScaleRange + baseScale;
        instanceInfo.scale.push([s, s, s]);

        instanceInfo.rotation.push([0, 0, 0]);

        instanceInfo.velocity.push([0, 0, 0]);

        const c = Color.fromRGB(
            Math.floor(Math.random() * 180 + 20),
            Math.floor(Math.random() * 20 + 20),
            Math.floor(Math.random() * 180 + 20)
        );
        instanceInfo.color.push([...c.elements]);
    });
    const animationOffsetInfo = maton
        .range(instanceNum)
        .map(() => {
            return Math.random() * 30;
        })
        .flat();

    mesh.castShadow = true;
    mesh.geometry.instanceCount = instanceNum;

    // TODO: instanceのoffset回りは予約語にしてもいいかもしれない
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstancePosition,
            data: new Float32Array(instanceInfo.position.flat()),
            size: 3,
            divisor: 1,
        })
    );
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceScale,
            data: new Float32Array(instanceInfo.scale.flat()),
            size: 3,
            divisor: 1,
        })
    );
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceRotation,
            data: new Float32Array(instanceInfo.rotation.flat()),
            size: 3,
            divisor: 1,
        })
    );
    // aInstanceAnimationOffsetは予約語
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceAnimationOffset,
            data: new Float32Array(animationOffsetInfo),
            size: 1,
            divisor: 1,
        })
    );
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceVertexColor,
            data: new Float32Array(instanceInfo.color.flat()),
            size: 4,
            divisor: 1,
        })
    );
    mesh.geometry.setAttribute(
        new Attribute({
            name: AttributeNames.InstanceVelocity,
            data: new Float32Array(instanceInfo.velocity.flat()),
            size: 3,
            divisor: 1,
        })
    );

    const transformFeedbackDoubleBuffer = createInstanceUpdater({ gpu, renderer, instanceNum: MAX_INSTANCE_NUM });

    let needsJumpPosition: boolean = false;

    // const setNeedsJumpPosition = (needsJump: boolean) => {
    //     needsJumpPosition = needsJump;
    // }

    const setInstancePosition = (index: number, p: Vector3) => {
        transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferSubData(
            ATTRIBUTE_POSITION_NAME,
            index,
            p.elements
        );
    };

    const setInstanceVelocity = (index: number, v: Vector3) => {
        transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferSubData(
            ATTRIBUTE_VELOCITY_NAME,
            index,
            v.elements
        );
    };

    const setInstanceAttractTargetPosition = (index: number, p: Vector3) => {
        transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferSubData(
            ATTRIBUTE_ATTRACT_TARGET_NAME,
            index,
            p.elements
        );
    };

    const updateInstanceState = (index: number, values: { seed?: number; attractEnabled?: boolean }) => {
        const { seed, attractEnabled } = values;
        const elementSize = 4;
        const currentData = transformFeedbackDoubleBuffer.read.vertexArrayObject.getBufferSubData(
            ATTRIBUTE_STATE_NAME,
            index,
            elementSize
        );
        const newSeed = seed ?? currentData[0];
        let newAttractEnabled = currentData[1];
        if (attractEnabled !== undefined) {
            newAttractEnabled = attractEnabled ? 1 : 0;
        }
        const newStates = new Float32Array([newSeed, newAttractEnabled, 0, 0]);
        transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferSubData(
            ATTRIBUTE_STATE_NAME,
            index,
            newStates
        );
    };

    // const setInstanceState = (index: number, state: number) => {
    //     transformFeedbackDoubleBuffer.read.vertexArrayObject.updateBufferSubData(
    //         ATTRIBUTE_ATTRACT_TARGET_NAME,
    //         index,
    //         p.elements
    //     );
    // }

    // for debug

    window.addEventListener('keydown', (e) => {
        if (e.key === 'j') {
            setInstancePosition(0, new Vector3(0, 0, 0));
        }
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'v') {
            setInstanceVelocity(0, new Vector3(0, 0.1, 0));
        }
    });

    let attractRate = 0;
    mesh.onUpdate = ({ deltaTime }) => {
        attractRate += (inputController.isDown ? 1 : -1) * deltaTime * 2;
        attractRate = saturate(attractRate);

        for (let i = 0; i < instanceNum; i++) {
            switch (i % 4) {
                case 0:
                    setInstanceAttractTargetPosition(i, new Vector3(4, 2, 0));
                    updateInstanceState(i, { attractEnabled: true });
                    break;
                case 1:
                    setInstanceAttractTargetPosition(i, new Vector3(4, 2, 0));
                    updateInstanceState(i, { attractEnabled: false });
                    break;
                case 2:
                    setInstanceAttractTargetPosition(i, new Vector3(-4, 2, 0));
                    updateInstanceState(i, { attractEnabled: true });
                    break;
                case 3:
                    setInstanceAttractTargetPosition(i, new Vector3(-4, 2, 0));
                    updateInstanceState(i, { attractEnabled: false });
                    break;
            }
        }

        // transform feedback を更新
        transformFeedbackDoubleBuffer.uniforms.setValue(
            'uNormalizedInputPosition',
            inputController.normalizedInputPosition
        );
        transformFeedbackDoubleBuffer.uniforms.setValue(
            'uAttractTargetPosition',
            Vector3.addVectors(attractorActor.transform.position, new Vector3(0, 0, 0))
        );
        transformFeedbackDoubleBuffer.uniforms.setValue('uNeedsJumpPosition', needsJumpPosition ? 1 : 0);
        transformFeedbackDoubleBuffer.uniforms.setValue('uAttractRate', attractRate);
        gpu.updateTransformFeedback({
            shader: transformFeedbackDoubleBuffer.shader,
            uniforms: transformFeedbackDoubleBuffer.uniforms,
            vertexArrayObject: transformFeedbackDoubleBuffer.write.vertexArrayObject,
            transformFeedback: transformFeedbackDoubleBuffer.write.transformFeedback,
            drawCount: transformFeedbackDoubleBuffer.drawCount,
        });
        transformFeedbackDoubleBuffer.swap();

        attractorActor.transform.position = new Vector3(0, 4, 0);

        // インスタンスのメッシュを更新
        mesh.geometry.vertexArrayObject.replaceBuffer(
            AttributeNames.InstancePosition,
            transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer(ATTRIBUTE_POSITION_NAME)
        );
        mesh.geometry.vertexArrayObject.replaceBuffer(
            AttributeNames.InstanceVelocity,
            transformFeedbackDoubleBuffer.read.vertexArrayObject.findBuffer(ATTRIBUTE_VELOCITY_NAME)
        );

        mesh.geometry.instanceCount = MAX_INSTANCE_NUM;

        needsJumpPosition = false;
    };

    return mesh;
};
