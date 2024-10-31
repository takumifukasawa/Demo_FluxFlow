import { Component, createComponent } from '@/PaleGL/core/Component.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';

export type OrbitMoverBinder = Component & {
    calcPosition: (delay?: number, timelineTime?: number) => Vector3;
};

export function createOrbitMoverBinder(): OrbitMoverBinder {
    let radius = 0;
    let speed = 0;
    const offsetPosition = Vector3.zero;
    const currentP = Vector3.zero;
    const sharedP = Vector3.zero;

    let cacheTimelineTime = 0;

    const calcPosition = (delay?: number, timelineTime?: number) => {
        const t = (timelineTime !== undefined ? timelineTime : cacheTimelineTime) - (delay ?? 0);
        // return new Vector3(
        //     Math.cos(t * speed) * radius + offsetPosition.x,
        //     offsetPosition.y,
        //     -Math.sin(t * speed) * radius + offsetPosition.z
        // );
        sharedP.x = Math.cos(t * speed) * radius + offsetPosition.x;
        sharedP.y = offsetPosition.y;
        sharedP.z = -Math.sin(t * speed) * radius + offsetPosition.z;
        return sharedP;
    };

    return {
        calcPosition,
        ...createComponent({
            onProcessPropertyBinder: (key, value) => {
                switch (key) {
                    case 'r':
                        radius = value;
                        break;
                    case 's':
                        speed = value;
                        break;
                    case 'op.x':
                        offsetPosition.x = value;
                        break;
                    case 'op.y':
                        offsetPosition.y = value;
                        break;
                    case 'op.z':
                        offsetPosition.z = value;
                        break;
                }
            },

            onPostProcessTimeline: (actor, timelineTime) => {
                currentP.x = Math.cos(timelineTime * speed) * radius + offsetPosition.x;
                currentP.y = offsetPosition.y;
                currentP.z = -Math.sin(timelineTime * speed) * radius + offsetPosition.z;
                actor.transform.position = currentP;
                cacheTimelineTime = timelineTime;
            },
        }),
    };
}
