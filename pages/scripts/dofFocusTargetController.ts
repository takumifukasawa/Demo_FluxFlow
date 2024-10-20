import { Component, createComponent } from '@/PaleGL/core/Component.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { DepthOfFieldPass } from '@/PaleGL/postprocess/DepthOfFieldPass.ts';
import { Camera } from '@/PaleGL/actors/Camera.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';

export type DofFocusTargetController = Component;

export function createDofFocusTargetController(
    targetActor: Actor,
    mainCamera: Camera,
    dofPass: DepthOfFieldPass
): DofFocusTargetController {
    return {
        ...createComponent({
            onPostProcessTimeline: () => {
                const distance = Vector3.subVectors(
                    targetActor.transform.position,
                    mainCamera.transform.position
                ).magnitude;
                dofPass.parameters.focusDistance = distance;
                console.log(distance)
            },
        }),
    };
}
