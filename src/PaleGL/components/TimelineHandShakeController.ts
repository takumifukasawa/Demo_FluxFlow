import { Component, createComponent } from '@/PaleGL/core/Component.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';

export type TimelineHandShakeController = Component & {
    // setAmplitude: ({ x, y, z }: { x?: number; y?: number; z?: number }) => void;
    // setSpeed: ({ x, y, z }: { x?: number; y?: number; z?: number }) => void;
};

// timeline から操作される
export function createTimelineHandShakeController(args: {
    amplitude: Vector3;
    speed: Vector3;
    offset: Vector3;
}): TimelineHandShakeController {
    const amplitude: Vector3 = args.amplitude;
    const speed: Vector3 = args.speed;
    const offset: Vector3 = args.offset;

    return {
        // setAmplitude: (args) => {
        //     amplitude = new Vector3(args.x ?? amplitude.x, args.y ?? amplitude.y, args.z ?? amplitude.z);
        // },
        // setSpeed: (args) => {
        //     speed = new Vector3(args.x ?? speed.x, args.y ?? speed.y, args.z ?? speed.z);
        // },
        
        // TODO: カメラの場合、forwardを考慮させるとよりよい気がする
        ...createComponent({
            onPostProcessTimeline: (actor, timelineTime) => {
                const time = timelineTime;
                const x = Math.sin(time * speed.x + offset.x) * amplitude.x;
                const y = Math.sin(time * speed.y + offset.y) * amplitude.y;
                const z = Math.sin(time * speed.z + offset.z) * amplitude.z;
                actor.transform.position.x += x;
                actor.transform.position.y += y;
                actor.transform.position.z += z;
            },
        }),
    };
}
