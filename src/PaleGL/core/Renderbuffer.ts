import { GLObject } from '@/PaleGL/core/GLObject';
import { RenderbufferType, RenderbufferTypes } from '@/PaleGL/constants';
import { GPU } from '@/PaleGL/core/GPU';
import {
    GL_DEPTH_COMPONENT16,
    GL_RENDERBUFFER,
    glBindRenderbuffer,
    glRenderbufferStorage,
} from '@/PaleGL/core/webglWrapper.ts';

export class Renderbuffer extends GLObject {
    #gpu: GPU;
    #type: RenderbufferType;
    #renderbuffer: WebGLRenderbuffer;

    get glObject() {
        return this.#renderbuffer;
    }

    constructor({ gpu, type, width, height }: { gpu: GPU; type: RenderbufferType; width: number; height: number }) {
        super();

        this.#gpu = gpu;
        this.#type = type;

        const gl = this.#gpu.gl;

        const rb = gl.createRenderbuffer()!;
        this.#renderbuffer = rb;

        glBindRenderbuffer(gl, GL_RENDERBUFFER, this.#renderbuffer);

        switch (this.#type) {
            case RenderbufferTypes.Depth:
                glRenderbufferStorage(gl, GL_RENDERBUFFER, GL_DEPTH_COMPONENT16, width, height);
                break;
            default:
                throw '[Renderbuffer.constructor] invalid render buffer type.';
        }

        // TODO: あったほうがよい？
        glBindRenderbuffer(gl, GL_RENDERBUFFER, null);
    }

    setSize(width: number, height: number) {
        const gl = this.#gpu.gl;

        glBindRenderbuffer(gl, GL_RENDERBUFFER, this.#renderbuffer);

        switch (this.#type) {
            case RenderbufferTypes.Depth:
                glRenderbufferStorage(gl, GL_RENDERBUFFER, GL_DEPTH_COMPONENT16, width, height);
                break;
        }

        glBindRenderbuffer(gl, GL_RENDERBUFFER, null);
    }
}
