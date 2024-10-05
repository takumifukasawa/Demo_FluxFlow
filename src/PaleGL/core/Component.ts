import { GPU } from '@/PaleGL/core/GPU.ts';
import { Actor } from '@/PaleGL/actors/Actor.ts';
import { Scene } from '@/PaleGL/core/Scene.ts';

export type ComponentStartArgs = { scene: Scene; actor: Actor; gpu: GPU };
export type ComponentFixedUpdateArgs = { actor: Actor; gpu: GPU; fixedTime: number; fixedDeltaTime: number };
export type ComponentUpdateArgs = { actor: Actor; gpu: GPU; time: number; deltaTime: number };
export type ComponentLastUpdateArgs = { actor: Actor; gpu: GPU; time: number; deltaTime: number };

type OnStartCallback = (args: { scene: Scene, actor: Actor; gpu: GPU }) => void;
type OnFixedUpdateCallback = (args: { actor: Actor; gpu: GPU; fixedTime: number; fixedDeltaTime: number }) => void;
type OnUpdateCallback = (args: { actor: Actor; gpu: GPU; time: number; deltaTime: number }) => void;
type OnLastUpdateCallback = (args: { actor: Actor; gpu: GPU; time: number; deltaTime: number }) => void;

export type Component = {
    start: (args: ComponentStartArgs) => void;
    fixedUpdate: (args: ComponentFixedUpdateArgs) => void;
    update: (args: ComponentUpdateArgs) => void;
    lastUpdate: (args: ComponentLastUpdateArgs) => void;
};

export type ComponentArgs = {
    onStartCallback?: OnStartCallback;
    onUpdateCallback?: OnUpdateCallback;
    onFixedUpdateCallback?: OnFixedUpdateCallback;
    onLastUpdateCallback?: OnLastUpdateCallback;
};

export function createComponent(args: ComponentArgs): Component {
    const { onStartCallback, onFixedUpdateCallback, onUpdateCallback, onLastUpdateCallback } = args;

    const start = (args: ComponentStartArgs) => {
        if (onStartCallback) {
            onStartCallback(args);
        }
    };

    const fixedUpdate = (args: ComponentFixedUpdateArgs) => {
        if (onFixedUpdateCallback) {
            onFixedUpdateCallback(args);
        }
    };

    const update = (args: ComponentUpdateArgs) => {
        if (onUpdateCallback) {
            onUpdateCallback(args);
        }
    };

    const lastUpdate = (args: ComponentLastUpdateArgs) => {
        if (onLastUpdateCallback) {
            onLastUpdateCallback(args);
        }
    };

    return {
        start,
        fixedUpdate,
        update,
        lastUpdate,
    };
}
