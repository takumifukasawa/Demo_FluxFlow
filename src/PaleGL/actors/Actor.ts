import { Transform } from '@/PaleGL/core/Transform';
import { ActorType, ActorTypes } from '@/PaleGL/constants';
import { uuidv4 } from '@/PaleGL/utilities/uuid';
import { Animator } from '@/PaleGL/core/Animator';
import { GPU } from '@/PaleGL/core/GPU';
import { Component } from '@/PaleGL/core/Component.ts';
import { Camera } from '@/PaleGL/actors/Camera';
import { Scene } from '@/PaleGL/core/Scene.ts';

export type ActorStartArgs = { scene: Scene; gpu: GPU };
export type ActorFixedUpdateArgs = { scene: Scene; gpu: GPU; fixedTime: number; fixedDeltaTime: number };
export type ActorUpdateArgs = { scene: Scene; gpu: GPU; time: number; deltaTime: number };
export type ActorLastUpdateArgs = { scene: Scene; gpu: GPU; time: number; deltaTime: number };

type OnStartCallback = (args: { scene: Scene; actor: Actor; gpu: GPU }) => void;
type OnFixedUpdateCallback = (args: {
    scene: Scene;
    actor: Actor;
    gpu: GPU;
    fixedTime: number;
    fixedDeltaTime: number;
}) => void;
type OnUpdateCallback = (args: { scene: Scene; actor: Actor; gpu: GPU; time: number; deltaTime: number }) => void;
type OnLastUpdateCallback = (args: { scene: Scene; actor: Actor; gpu: GPU; time: number; deltaTime: number }) => void;
type OnProcessClipFrame = (key: string, value: number) => void;

export type ActorArgs = { name?: string; type?: ActorType };

export class Actor {
    name: string;
    transform: Transform;
    type: ActorType;
    uuid: number;
    isStarted: boolean = false;
    animator: Animator; // TODO: いよいよcomponentっぽくしたくなってきた
    parent: Actor | null = null;
    children: Actor[] = [];
    components: Component[] = [];

    // lifecycle callback
    private _onStart: OnStartCallback[] = [];
    private _onFixedUpdate: OnFixedUpdateCallback | null = null;
    private _onUpdate: OnUpdateCallback | null = null;
    private _onLastUpdate: OnLastUpdateCallback | null = null;
    private _onProcessClipFrame: OnProcessClipFrame | null = null;
    private _enabled: boolean = true;

    get childCount() {
        return this.children.length;
    }

    get hasChild() {
        return this.childCount > 0;
    }

    set enabled(value: boolean) {
        this._enabled = value;
    }

    get enabled() {
        return this._enabled;
    }

    subscribeOnStart(value: OnStartCallback) {
        this._onStart.push(value);
    }

    // TODO: onStartと同じで配列方式にする
    set onFixedUpdate(value: OnFixedUpdateCallback) {
        this._onFixedUpdate = value;
    }

    // TODO: onStartと同じで配列方式にする
    set onUpdate(value: OnUpdateCallback) {
        this._onUpdate = value;
    }

    set onLastUpdate(value: OnLastUpdateCallback) {
        this._onLastUpdate = value;
    }
    
    set onProcessClipFrame(value: OnProcessClipFrame) {
        this._onProcessClipFrame = value;
    }

    constructor({ name = '', type = ActorTypes.Null }: ActorArgs = {}) {
        this.name = name;
        this.transform = new Transform(this);
        this.type = type || ActorTypes.Null;
        this.uuid = uuidv4();
        this.animator = new Animator();
    }

    addChild(child: Actor) {
        this.children.push(child);
        // this.transform.addChild(child);
        // // this.transform.addChild(child.transform); // NOTE: こっちが正しいはず？
        child.parent = this;
    }

    addComponent(component: Component) {
        this.components.push(component);
    }

    getComponent<T extends Component>(): T | null {
        return this.components.find((component) => component) as T;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setSize(width: number, height: number) {}

    #tryStart({ gpu, scene }: ActorStartArgs) {
        if (this.isStarted) {
            return;
        }
        this.isStarted = true;
        this.start({ gpu, scene });
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateTransform(camera?: Camera) {
        this.transform.updateMatrix();
    }

    // -----------------------------------------------------------------
    // actor lifecycle
    // -----------------------------------------------------------------

    start({ gpu, scene }: ActorStartArgs) {
        this.components.forEach((component) => {
            component.start({ actor: this, gpu, scene });
        });
        this._onStart.forEach((cb) => {
            cb({ actor: this, gpu, scene });
        });
    }

    // fixedUpdate({gpu, fixedTime, fixedDeltaTime}: { gpu: GPU, fixedTime: number, fixedDeltaTime: number } = {}) {
    fixedUpdate({ gpu, scene, fixedTime, fixedDeltaTime }: ActorFixedUpdateArgs) {
        this.#tryStart({ gpu, scene });
        this.components.forEach((component) => {
            component.fixedUpdate({ actor: this, gpu, fixedTime, fixedDeltaTime });
        });
        if (this.animator) {
            this.animator.update(fixedDeltaTime);
        }
        if (this._onFixedUpdate) {
            this._onFixedUpdate({ actor: this, gpu, scene, fixedTime, fixedDeltaTime });
        }
    }

    // update({gpu, time, deltaTime}: { gpu: GPU, time: number, deltaTime: number } = {}) {
    update({ gpu, scene, time, deltaTime }: ActorUpdateArgs) {
        this.#tryStart({ gpu, scene });
        this.components.forEach((component) => {
            component.update({ actor: this, gpu, time, deltaTime });
        });
        if (this._onUpdate) {
            this._onUpdate({ actor: this, gpu, scene, time, deltaTime });
        }
    }

    lastUpdate({ gpu, scene, time, deltaTime }: ActorLastUpdateArgs) {
        this.#tryStart({ gpu, scene });
        this.components.forEach((component) => {
            component.lastUpdate({ actor: this, gpu, time, deltaTime });
        });
        if (this._onLastUpdate) {
            this._onLastUpdate({ actor: this, gpu, scene, time, deltaTime });
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    beforeRender({ gpu }: { gpu: GPU }) {
        // TODO: 必要になったら実装する。component関連の処理とかで。
    }

    processClipFrame(key: string, value: number) {
        if (this._onProcessClipFrame) {
            this._onProcessClipFrame(key, value);
        }
    }
}
