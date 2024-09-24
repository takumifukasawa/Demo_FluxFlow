import { GLObject } from '@/PaleGL/core/GLObject';
import { GPU } from '@/PaleGL/core/GPU';
import {GL_ELEMENT_ARRAY_BUFFER, GL_STATIC_DRAW, glBindBuffer, glBufferData} from '@/PaleGL/core/webglWrapper.ts';

export class IndexBufferObject extends GLObject {
    private ibo: WebGLBuffer;
    private gpu: GPU;

    get glObject() {
        return this.ibo;
    }

    constructor({ gpu, indices }: { gpu: GPU; indices: number[] }) {
        super();

        this.gpu = gpu;

        const gl = this.gpu.gl;

        this.ibo = gl.createBuffer()!;

        this.bind();
        glBufferData(gl, GL_ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), GL_STATIC_DRAW);
    }

    bind() {
        const gl = this.gpu.gl;
        glBindBuffer(gl, GL_ELEMENT_ARRAY_BUFFER, this.ibo);
    }

    unbind() {
        const gl = this.gpu.gl;
        gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, null);
    }
}
