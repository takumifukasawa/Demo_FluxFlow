import { GPU } from '@/PaleGL/core/GPU.ts';
import { GLObject } from '@/PaleGL/core/GLObject.ts';
import {
    GL_ARRAY_BUFFER,
    GL_TRANSFORM_FEEDBACK,
    GL_TRANSFORM_FEEDBACK_BUFFER, glBindBuffer, glBindBufferBase, glBindTransformFeedback,
    glCreateTransformFeedback
} from '@/PaleGL/core/webglWrapper.ts';

export class TransformFeedback extends GLObject {
    private transformFeedback: WebGLTransformFeedback;
    private gpu: GPU;

    get glObject() {
        return this.transformFeedback;
    }

    constructor({ gpu, buffers }: { gpu: GPU; buffers: WebGLBuffer[] }) {
        super();
        this.gpu = gpu;
        const { gl } = gpu;

        this.transformFeedback = glCreateTransformFeedback(gl)!;
        this.bind();
        for (let i = 0; i < buffers.length; i++) {
            glBindBufferBase(gl, GL_TRANSFORM_FEEDBACK_BUFFER, i, buffers[i]);
        }
        glBindBuffer(gl, GL_ARRAY_BUFFER, null);
        this.unbind();
    }

    bind() {
        const { gl } = this.gpu;
        glBindTransformFeedback(gl, GL_TRANSFORM_FEEDBACK, this.glObject);
    }

    unbind() {
        const { gl } = this.gpu;
        glBindTransformFeedback(gl, GL_TRANSFORM_FEEDBACK, null);
    }
}
