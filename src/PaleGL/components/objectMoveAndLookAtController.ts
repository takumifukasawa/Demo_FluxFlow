import { Component, createComponent } from '@/PaleGL/core/Component.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { Scene } from '@/PaleGL/core/Scene.ts';

export type ObjectMoveAndLookAtController = Component & {
    execute: (args: { actor: Actor; localPosition: Vector3; scene: Scene }) => void;
};

// timeline から操作される
export function createObjectMoveAndLookAtController(args: {
    localPosition: Vector3;
    lookAtTargetName: string;
}): ObjectMoveAndLookAtController {
    const initialLocalPosition = args.localPosition;
    const lookAtTargetName = args.lookAtTargetName;
    let lookAtTargetActor: Actor | null = null;

    const update = (actor: Actor, scene: Scene, localPosition: Vector3) => {
        lookAtTargetActor = scene.find(lookAtTargetName);
        actor.transform.position = localPosition;
        if (lookAtTargetActor) {
            actor.transform.lookAtActor(lookAtTargetActor);
        }
    };

    return {
        ...createComponent({
            onStartCallback: (args) => {
                const { actor, scene } = args;
                update(actor, scene, initialLocalPosition);
            },
        }),
        ...{
            execute: (args) => {
                const { actor, scene, localPosition } = args;
                update(actor, scene, localPosition);
            },

            // onUpdateCallback: (args) => {
            //     // const { actor } = args;
            //     // actor.transform.position = localPosition;
            //     // if(lookAtTargetActor) {
            //     //     actor.transform.lookAtActor(lookAtTargetActor);
            //     // }
            // }
        },
    };
}
