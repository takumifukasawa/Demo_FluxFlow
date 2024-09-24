import { GLObject } from '@/PaleGL/core/GLObject';
import {
    GL_COLOR_ATTACHMENT0,
    GL_COLOR_ATTACHMENT1,
    GL_COLOR_ATTACHMENT2,
    GL_COLOR_ATTACHMENT3,
    GL_COLOR_ATTACHMENT4,
    GL_COLOR_ATTACHMENT5,
    GL_COLOR_ATTACHMENT6,
    GL_COLOR_ATTACHMENT7,
    GL_FRAMEBUFFER,
    glBindFramebuffer,
    glCreateFramebuffer,
} from '@/PaleGL/core/webglWrapper.ts';
import { GPU } from '@/PaleGL/core/GPU';

type GLColorAttachment =
    | GL_COLOR_ATTACHMENT0
    | GL_COLOR_ATTACHMENT1
    | GL_COLOR_ATTACHMENT2
    | GL_COLOR_ATTACHMENT3
    | GL_COLOR_ATTACHMENT4
    | GL_COLOR_ATTACHMENT5
    | GL_COLOR_ATTACHMENT6
    | GL_COLOR_ATTACHMENT7;

export class Framebuffer extends GLObject {
    #framebuffer: WebGLFramebuffer;
    #drawBuffersList: GLColorAttachment[] = [];
    #gpu;

    get drawBufferList() {
        return this.#drawBuffersList;
    }

    get glObject() {
        return this.#framebuffer;
    }

    get hasMultipleDrawBuffers() {
        return this.#drawBuffersList.length >= 2;
    }

    registerDrawBuffer(drawBufferName: GLColorAttachment) {
        this.#drawBuffersList.push(drawBufferName);
    }

    constructor({ gpu }: { gpu: GPU }) {
        super();

        this.#gpu = gpu;
        const gl = this.#gpu.gl;

        const fb = glCreateFramebuffer(gl)!;
        // if (!fb) {
        //     console.error('invalid framebuffer');
        // }
        this.#framebuffer = fb;
    }

    bind() {
        const gl = this.#gpu.gl;
        glBindFramebuffer(gl, GL_FRAMEBUFFER, this.#framebuffer);
    }

    unbind() {
        const gl = this.#gpu.gl;
        glBindFramebuffer(gl, GL_FRAMEBUFFER, null);
    }
}
