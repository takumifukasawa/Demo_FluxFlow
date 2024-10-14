import { Component, createComponent } from '@/PaleGL/core/Component.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';

type OrbitMoverBinder = Component;

export function createOrbitMoverBinder(): OrbitMoverBinder {
    let radius = 0;
    let speed = 0;
    const offsetPosition = Vector3.zero;

    return {
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
                const p = new Vector3(
                    Math.cos(timelineTime * speed) * radius + offsetPosition.x,
                    offsetPosition.y,
                    -Math.sin(timelineTime * speed) * radius + offsetPosition.z
                );
                actor.transform.position = p;
            },
        }),
    };
}
