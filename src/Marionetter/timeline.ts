import { curveUtilityEvaluateCurve } from '@/Marionetter/curveUtilities.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import { Light } from '@/PaleGL/actors/Light.ts';
import { Scene } from '@/PaleGL/core/Scene.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera.ts';
import {
    MarionetterActivationControlClip,
    MarionetterActivationControlClipInfo,
    MarionetterAnimationClip,
    MarionetterAnimationClipInfo,
    MarionetterAnimationClipType,
    MarionetterClipArgs,
    MarionetterClipInfoKinds,
    MarionetterClipInfoType,
    MarionetterClipKinds,
    MarionetterDefaultTrackInfo,
    MarionetterLightControlClip,
    MarionetterLightControlClipInfo,
    MarionetterMarkerTrackInfo,
    MarionetterObjectMoveAndLookAtClip,
    MarionetterObjectMoveAndLookAtClipInfo,
    MarionetterObjectMoveAndLookAtClipInfoProperty,
    MarionetterPlayableDirectorComponentInfo,
    // MarionetterPostProcessBloom,
    // MarionetterPostProcessDepthOfField,
    // MarionetterPostProcessVignette,
    // MarionetterPostProcessVolumetricLight,
    MarionetterSignalEmitter,
    MarionetterTimeline,
    MarionetterTimelineDefaultTrack,
    MarionetterTimelineMarkerTrack,
    MarionetterTimelineSignalEmitter,
    MarionetterTimelineTrackExecuteArgs,
    MarionetterTimelineTrackKinds,
    MarionetterTrackInfoType,
} from '@/Marionetter/types';
import {
    PROPERTY_COLOR_A,
    PROPERTY_COLOR_B,
    PROPERTY_COLOR_G,
    PROPERTY_COLOR_R,
    PROPERTY_FIELD_OF_VIEW,
    PROPERTY_LIGHT_INTENSITY,
    PROPERTY_LOCAL_EULER_ANGLES_RAW_X,
    PROPERTY_LOCAL_EULER_ANGLES_RAW_Y,
    PROPERTY_LOCAL_EULER_ANGLES_RAW_Z,
    PROPERTY_LOCAL_POSITION_X,
    PROPERTY_LOCAL_POSITION_Y,
    PROPERTY_LOCAL_POSITION_Z,
    PROPERTY_LOCAL_SCALE_X,
    PROPERTY_LOCAL_SCALE_Y,
    PROPERTY_LOCAL_SCALE_Z,
    PROPERTY_MATERIAL_BASE_COLOR_A,
    PROPERTY_MATERIAL_BASE_COLOR_B,
    PROPERTY_MATERIAL_BASE_COLOR_G,
    PROPERTY_MATERIAL_BASE_COLOR_R,
    PROPERTY_SPOTLIGHT_RANGE,
} from '@/Marionetter/constants.ts';
import { Rotator } from '@/PaleGL/math/Rotator.ts';
import { Quaternion } from '@/PaleGL/math/Quaternion.ts';
import { Matrix4 } from '@/PaleGL/math/Matrix4.ts';
import { ActorTypes, DEG_TO_RAD, LightTypes } from '@/PaleGL/constants.ts';
import { SpotLight } from '@/PaleGL/actors/SpotLight.ts';
import { ObjectMoveAndLookAtController } from '@/PaleGL/components/objectMoveAndLookAtController.ts';
import { isTimeInClip } from '@/Marionetter/timelineUtilities.ts';

// import { resolveInvertRotationLeftHandAxisToRightHandAxis } from '@/Marionetter/buildMarionetterScene.ts';

/**
 *
 * @param marionetterPlayableDirectorComponentInfo
 */
export function buildMarionetterTimeline(
    marionetterActors: Actor[],
    marionetterPlayableDirectorComponentInfo: MarionetterPlayableDirectorComponentInfo
    // placedScene: Scene
    // needsSomeActorsConvertLeftHandAxisToRightHandAxis = false
): MarionetterTimeline {
    const tracks: MarionetterTimelineTrackKinds[] = [];

    // for debug
    // console.log(
    //     `[buildMarionetterTimeline] marionetterPlayableDirectorComponentInfo:`,
    //     marionetterPlayableDirectorComponentInfo,
    //     marionetterActors
    // );

    const buildSignalEmitter = (signalEmitter: MarionetterSignalEmitter): MarionetterTimelineSignalEmitter => {
        let triggered = false;
        const execute = (time: number) => {
            if (time > signalEmitter.t && triggered) {
                triggered = true;
            }
        };
        return {
            name: signalEmitter.n,
            time: signalEmitter.t,
            // ...signalEmitter,
            triggered,
            execute,
        };
    };

    //
    // build track
    //

    for (let i = 0; i < marionetterPlayableDirectorComponentInfo.ts.length; i++) {
        const track = marionetterPlayableDirectorComponentInfo.ts[i];

        if (track.t === MarionetterTrackInfoType.MarkerTrack) {
            const signalEmitters = (track as MarionetterMarkerTrackInfo).ses;
            tracks.push({
                signalEmitters: signalEmitters.map((signalEmitter) => {
                    return buildSignalEmitter(signalEmitter);
                }),
                execute: () => {},
            } as MarionetterTimelineMarkerTrack);
        } else {
            const targetName = (track as MarionetterDefaultTrackInfo).tn;
            const clips = (track as MarionetterDefaultTrackInfo).cs;
            const targetActors = [
                Scene.find(marionetterActors, targetName),
                // Scene.find(placedScene.children, targetName),
            ];
            //const marionetterClips = createMarionetterClips(clips, needsSomeActorsConvertLeftHandAxisToRightHandAxis);
            const marionetterClips = createMarionetterClips(clips);
            if (targetActors.length < 1) {
                console.warn(`[buildMarionetterTimeline] target actor is not found: ${targetName}`);
            }

            // for debug
            // console.log(
            //     `[buildMarionetterTimeline] targetName: ${targetName}, targetActor:`,
            //     targetActors,
            //     marionetterClips
            // );

            const data = {
                targetName,
                targetActors,
                clips: marionetterClips,
                // exec track
                // TODO: clip間の mixer,interpolate,extrapolate の挙動が必要
                execute: (args: MarionetterTimelineTrackExecuteArgs) => {
                    targetActors.forEach((targetActor) => {
                        const { time, scene } = args;
                        const clipAtTime = marionetterClips.find(
                            // (clip) => clip.clipInfo.s <= time && time < clip.clipInfo.s + clip.clipInfo.d
                            (clip) => isTimeInClip(time, clip.clipInfo.s, clip.clipInfo.s + clip.clipInfo.d)
                        );

                        // NOTE: 渡されるtimeそのものがframeTimeになった
                        // const frameTime = time % marionetterPlayableDirectorComponentInfo.d;

                        // まずactorのprocessTimelineを実行
                        targetActor?.preProcessTimeline(time);

                        if (track.t === MarionetterTrackInfoType.ActivationControlTrack) {
                            if (targetActor != null) {
                                // const clipAtTime = marionetterClips.find(
                                //     (clip) => clip.clipInfo.s < time && time < clip.clipInfo.s + clip.clipInfo.d
                                // );
                                if (clipAtTime) {
                                    targetActor.enabled = true;
                                } else {
                                    targetActor.enabled = false;
                                }
                            }
                        } else {
                            if (targetActor != null) {
                                // // tmp
                                // for (let j = 0; j < marionetterClips.length; j++) {
                                //     marionetterClips[j].execute({ actor: targetActor, time, scene });
                                // }
                                clipAtTime?.execute({ actor: targetActor, time, scene });
                            }
                        }

                        // clipの実行後にupdate
                        targetActor?.postProcessTimeline(time);
                    });
                },
            } as MarionetterTimelineDefaultTrack;
            tracks.push(data);
        }
    }

    //
    // exec timeline
    //

    const execute = (args: { time: number; scene: Scene }) => {
        const { time, scene } = args;
        // pattern1: use frame
        // const spf = 1 / fps;
        // const frameTime = Math.floor(rawTime / spf) * spf;
        // pattern2: use raw time
        const frameTime = time % marionetterPlayableDirectorComponentInfo.d;
        for (let i = 0; i < tracks.length; i++) {
            tracks[i].execute({ time: frameTime, scene });
        }
    };

    const bindActors = (actors: Actor[]) => {
        actors.forEach((actor) => {
            const targetName = actor.name;
            tracks.forEach((track) => {
                // TODO: ここなんかうまいことやりたい
                if (Object.hasOwn(track, 'targetName')) {
                    const t = track as MarionetterTimelineDefaultTrack;
                    if (t.targetName === targetName) {
                        t.targetActors.push(actor);
                    }
                }
            });
        });
    };

    // return { tracks, execute, bindActor };
    return { tracks, execute, bindActors };
}

/**
 *
 * @param clips
 */
function createMarionetterClips(
    clips: MarionetterClipInfoKinds[]
    // needsSomeActorsConvertLeftHandAxisToRightHandAxis = false
): MarionetterClipKinds[] {
    const marionetterClips = [] as MarionetterClipKinds[];

    for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        switch (clip.t) {
            case MarionetterClipInfoType.AnimationClip:
                marionetterClips.push(
                    createMarionetterAnimationClip(
                        clip as MarionetterAnimationClipInfo
                        // needsSomeActorsConvertLeftHandAxisToRightHandAxis
                    )
                );
                break;
            case MarionetterClipInfoType.LightControlClip:
                marionetterClips.push(createMarionetterLightControlClip(clip as MarionetterLightControlClipInfo));
                break;
            case MarionetterClipInfoType.ActivationControlClip:
                marionetterClips.push(
                    createMarionetterActivationControlClip(clip as MarionetterActivationControlClipInfo)
                );
                break;
            case MarionetterClipInfoType.ObjectMoveAndLookAtClip:
                marionetterClips.push(
                    createMarionetterObjectMoveAndLookAtClip(clip as MarionetterObjectMoveAndLookAtClipInfo)
                );
                break;
            default:
                console.error(`[createMarionetterClips] invalid animation clip type`);
        }
    }

    return marionetterClips;
}

/**
 *
 * @param animationClip
 */
function createMarionetterAnimationClip(
    animationClip: MarionetterAnimationClipInfo
    // needsSomeActorsConvertLeftHandAxisToRightHandAxis = false
): MarionetterAnimationClip {
    // actorに直接valueを割り当てる関数
    const execute = (args: MarionetterClipArgs) => {
        const { actor, time } = args;
        let hasLocalPosition: boolean = false;
        let hasLocalRotationEuler: boolean = false;
        let hasLocalScale: boolean = false;
        const localPosition: Vector3 = Vector3.zero;
        const localRotationEulerDegree: Vector3 = Vector3.zero;
        const localScale: Vector3 = Vector3.one;

        const start = animationClip.s;
        const bindings = animationClip.b;

        // TODO: typeがあった方がよい. ex) animation clip, light control clip
        bindings.forEach((binding) => {
            const propertyName = binding.n;
            const keyframes = binding.k;
            const value = curveUtilityEvaluateCurve(time - start, keyframes);

            switch (propertyName) {
                case PROPERTY_LOCAL_POSITION_X:
                    hasLocalPosition = true;
                    localPosition.x = value;
                    break;
                case PROPERTY_LOCAL_POSITION_Y:
                    hasLocalPosition = true;
                    localPosition.y = value;
                    break;
                case PROPERTY_LOCAL_POSITION_Z:
                    hasLocalPosition = true;
                    localPosition.z = value;
                    break;
                case PROPERTY_LOCAL_EULER_ANGLES_RAW_X:
                    hasLocalRotationEuler = true;
                    localRotationEulerDegree.x = value;
                    break;
                case PROPERTY_LOCAL_EULER_ANGLES_RAW_Y:
                    hasLocalRotationEuler = true;
                    localRotationEulerDegree.y = value;
                    break;
                case PROPERTY_LOCAL_EULER_ANGLES_RAW_Z:
                    hasLocalRotationEuler = true;
                    localRotationEulerDegree.z = value;
                    break;
                case PROPERTY_LOCAL_SCALE_X:
                    hasLocalScale = true;
                    localScale.x = value;
                    break;
                case PROPERTY_LOCAL_SCALE_Y:
                    hasLocalScale = true;
                    localScale.y = value;
                    break;
                case PROPERTY_LOCAL_SCALE_Z:
                    hasLocalScale = true;
                    localScale.z = value;
                    break;
                case PROPERTY_FIELD_OF_VIEW:
                    (actor as PerspectiveCamera).fov = value;
                    (actor as PerspectiveCamera).updateProjectionMatrix();
                    break;
                case PROPERTY_MATERIAL_BASE_COLOR_R:
                case PROPERTY_MATERIAL_BASE_COLOR_G:
                case PROPERTY_MATERIAL_BASE_COLOR_B:
                case PROPERTY_MATERIAL_BASE_COLOR_A:
                    // TODO: GBufferMaterialとの連携？
                    break;
                // TODO: marionetter じゃなくてもいいかもしれない
                // case MarionetterPostProcessBloom.bloomIntensity:
                //     const bloomParams = (actor as PostProcessVolume).findParameter<BloomPassParameters>(
                //         PostProcessPassType.Bloom
                //     );
                //     if (bloomParams) {
                //         bloomParams.bloomAmount = value;
                //     }
                //     break;
                // case MarionetterPostProcessDepthOfField.focusDistance:
                //     break;
                // case MarionetterPostProcessVignette.vignetteIntensity:
                //     break;
                // case MarionetterPostProcessVolumetricLight.volumetricLightRayStep:
                //     const volumetricLightParams = (
                //         actor as PostProcessVolume
                //     ).findParameter<VolumetricLightPassParameters>(PostProcessPassType.VolumetricLight);
                //     if (volumetricLightParams) {
                //         volumetricLightParams.rayStep = value;
                //     }
                //     console.log(actor)
                //     break;
                default:
                    // // 厳しい場合、propertyが紐づいていない場合はエラーを出す
                    // // console.error(`[createMarionetterAnimationClip] invalid declared property: ${propertyName}, value: ${value}`);
                    // 特に紐づいてない場合はactorに流す
                    actor.processPropertyBinder(propertyName, value);
            }
        });

        if (hasLocalScale) {
            actor.transform.scale.copy(localScale);
        } else {
            actor.transform.scale.copy(Vector3.one);
        }

        // TODO: なぜか一回行列に落とさないとうまく動かない. まわりくどいかつ余計な計算が走るが
        if (hasLocalRotationEuler) {
            const rm = Matrix4.multiplyMatrices(
                // TODO: 本当はc#側でxyを反転させて渡したいが、なぜかうまくいかないのでここだけフロント側で反転
                Matrix4.rotationYMatrix(-localRotationEulerDegree.y * DEG_TO_RAD),
                Matrix4.rotationXMatrix(-localRotationEulerDegree.x * DEG_TO_RAD),
                Matrix4.rotationZMatrix(localRotationEulerDegree.z * DEG_TO_RAD)
            );
            const q = Quaternion.rotationMatrixToQuaternion(rm);
            actor.transform.rotation = new Rotator(
                // actor.type === ActorTypes.Light && (actor as Light).lightType === LightTypes.Spot ? q.invertAxis() : q
                actor.type === ActorTypes.Light &&
                ((actor as Light).lightType === LightTypes.Spot ||
                    (actor as Light).lightType === LightTypes.Directional)
                    ? q.invertAxis()
                    : q
            );
        } else {
            actor.transform.rotation = Rotator.fromQuaternion(Quaternion.identity());
        }

        if (hasLocalPosition) {
            // localPosition.z *= -1;
            actor.transform.position.copy(localPosition);
        } else {
            actor.transform.position.copy(Vector3.zero);
        }
    };

    return {
        type: MarionetterAnimationClipType.AnimationClip,
        clipInfo: animationClip,
        // bind,
        execute,
    };
}

/**
 *
 * @param lightControlClip
 */
function createMarionetterLightControlClip(
    lightControlClip: MarionetterLightControlClipInfo
): MarionetterLightControlClip {
    // let obj: Light | null;
    // const bind = (targetObj: Light) => {
    //     obj = targetObj;
    // };
    const execute = (args: MarionetterClipArgs) => {
        const { actor, time } = args;
        const light = actor as Light;
        let hasPropertyColorR: boolean = false;
        let hasPropertyColorG: boolean = false;
        let hasPropertyColorB: boolean = false;
        let hasPropertyColorA: boolean = false;
        let hasPropertyLightIntensity: boolean = false;
        // let hasPropertyBounceIntensity: boolean = false;
        let hasPropertySpotLightRange: boolean = false;

        const color = new Color();
        let lightIntensity = 0;
        // let bounceIntensity = 0;
        // let range = 0;
        let spotLightRange = 0;

        // const { start, bindings } = lightControlClip;
        const start = lightControlClip.s;
        const bindings = lightControlClip.b;

        // TODO: typeがあった方がよい. ex) animation clip, light control clip
        bindings.forEach((binding) => {
            const propertyName = binding.n;
            const keyframes = binding.k;
            const value = curveUtilityEvaluateCurve(time - start, keyframes);

            switch (propertyName) {
                case PROPERTY_COLOR_R:
                    hasPropertyColorR = true;
                    color.r = value;
                    break;
                case PROPERTY_COLOR_G:
                    hasPropertyColorG = true;
                    color.g = value;
                    break;
                case PROPERTY_COLOR_B:
                    hasPropertyColorB = true;
                    color.b = value;
                    break;
                case PROPERTY_COLOR_A:
                    hasPropertyColorA = true;
                    color.a = value;
                    break;
                case PROPERTY_LIGHT_INTENSITY:
                    hasPropertyLightIntensity = true;
                    lightIntensity = value;
                    break;
                case PROPERTY_SPOTLIGHT_RANGE:
                    hasPropertySpotLightRange = true;
                    spotLightRange = value;
                    break;
                // case PROPERTY_BOUNCE_INTENSITY:
                //     hasPropertyBounceIntensity = true;
                //     bounceIntensity = value;
                //     break;
                // case PROPERTY_RANGE:
                //     hasPropertyRange = true;
                //     range = value;
                //     break;
            }
        });

        if (hasPropertyColorR) {
            light.color.r = color.r;
        }
        if (hasPropertyColorG) {
            light.color.g = color.g;
        }
        if (hasPropertyColorB) {
            light.color.b = color.b;
        }
        if (hasPropertyColorA) {
            light.color.a = color.a;
        }
        if (hasPropertyLightIntensity) {
            light.intensity = lightIntensity;
        }
        if (hasPropertySpotLightRange) {
            (light as SpotLight).distance = spotLightRange;
        }
        // if(hasPropertyBounceIntensity) {
        //     obj.bounceIntensity = bounceIntensity;
        // }
        // for spot light
        // if(hasPropertyRange) {
        //     obj.range = range;
        // }
    };

    return {
        type: MarionetterAnimationClipType.LightControlClip,
        clipInfo: lightControlClip,
        // bind,
        execute,
    };
}

/**
 *
 * @param lightControlClip
 */
function createMarionetterActivationControlClip(
    activationControlClip: MarionetterActivationControlClipInfo
): MarionetterActivationControlClip {
    // let obj: Light | null;
    // const bind = (targetObj: Light) => {
    //     obj = targetObj;
    // };
    // const execute = (actor: Actor, time: number) => {
    //     // const { start, duration} = activationControlClip;
    //     // console.log(start, duration, actor, time)
    // };

    return {
        type: MarionetterAnimationClipType.ActivationControlClip,
        clipInfo: activationControlClip,
        execute: () => {},
    };
}

function createMarionetterObjectMoveAndLookAtClip(
    objectMoveAndLookAtClip: MarionetterObjectMoveAndLookAtClipInfo
): MarionetterObjectMoveAndLookAtClip {
    return {
        type: MarionetterAnimationClipType.ObjectMoveAndLookAtClip,
        clipInfo: objectMoveAndLookAtClip,
        execute: (args: { actor: Actor; time: number; scene: Scene }) => {
            const { actor, time, scene } = args;

            // let hasLocalPosition: boolean = false;
            // let hasLocalRotationEuler: boolean = false;
            // let hasLocalScale: boolean = false;
            // const localPosition: Vector3 = Vector3.zero;
            // const localRotationEulerDegree: Vector3 = Vector3.zero;
            // const localScale: Vector3 = Vector3.one;

            // const start = animationClip.s;
            // const bindings = animationClip.b;

            const localPosition: Vector3 = Vector3.zero;

            const start = objectMoveAndLookAtClip.s;
            const bindings = objectMoveAndLookAtClip.b;

            // TODO: typeがあった方がよい. ex) animation clip, light control clip
            bindings.forEach((binding) => {
                const propertyName = binding.n;
                const keyframes = binding.k;
                const value = curveUtilityEvaluateCurve(time - start, keyframes);

                switch (propertyName) {
                    case MarionetterObjectMoveAndLookAtClipInfoProperty.localPositionX:
                        localPosition.x = value;
                        break;
                    case MarionetterObjectMoveAndLookAtClipInfoProperty.localPositionY:
                        localPosition.y = value;
                        break;
                    case MarionetterObjectMoveAndLookAtClipInfoProperty.localPositionZ:
                        localPosition.z = value;
                        break;
                    default:
                        // propertyが紐づいていない場合はエラーにする
                        console.error(`[createMarionetterAnimationClip] invalid declared property: ${propertyName}`);
                }
            });

            const component = actor.getComponent<ObjectMoveAndLookAtController>();
            component?.execute({ actor, scene, localPosition });
        },
    };
}
