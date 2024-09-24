import { GLObject } from '@/PaleGL/core/GLObject';
// import { AttributeUsageType } from '@/PaleGL/constants.js';
import { IndexBufferObject } from '@/PaleGL/core/IndexBufferObject';
import { getAttributeUsage, GPU } from '@/PaleGL/core/GPU';
import { Attribute } from '@/PaleGL/core/Attribute';
import {
    GL_ARRAY_BUFFER,
    GL_FLOAT,
    GL_UNSIGNED_SHORT, glBindBuffer,
    glBindVertexArray, glBufferData, glBufferSubData, glCreateBuffer,
    glCreateVertexArray, glEnableVertexAttribArray, glVertexAttribDivisor, glVertexAttribIPointer, glVertexAttribPointer
} from '@/PaleGL/core/webglWrapper.ts';

type VertexBufferObject = {
    name: string;
    vbo: WebGLBuffer;
    usage: number;
    location: number;
    size: number;
    divisor: number;
};

export class VertexArrayObject extends GLObject {
    private gpu: GPU;
    private vao: WebGLVertexArrayObject;
    private vboList: VertexBufferObject[] = [];
    private ibo: IndexBufferObject | null = null;

    /**
     *
     */
    get hasIndices() {
        return !!this.ibo;
    }

    /**
     *
     */
    get glObject() {
        return this.vao;
    }

    constructor({ gpu, attributes = [], indices }: { gpu: GPU; attributes: Attribute[]; indices?: number[] | null }) {
        super();

        this.gpu = gpu;

        const gl = this.gpu.gl;
        const vao = glCreateVertexArray(gl)!;
        // if (!vao) {
        //     console.error('invalid vao');
        // }
        this.vao = vao;

        // bind vertex array to webgl context
        // gl.bindVertexArray(this.vao);
        this.bind();

        attributes.forEach((attribute) => {
            // this.setAttribute(attribute, true);
            this.setAttribute(attribute);
        });

        if (indices) {
            this.ibo = new IndexBufferObject({ gpu, indices });
        }

        // set attribute の方でやってるのでいらないはず
        // unbind array buffer
        // gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // unbind vertex array to webgl context
        // gl.bindVertexArray(null);
        this.unbind();

        // unbind index buffer
        if (this.ibo) {
            this.ibo.unbind();
        }
    }

    /**
     *
     * @param gl
     * @param usageType
     */
    // static getUsage(gl: WebGL2RenderingContext, usageType: AttributeUsageType) {
    //     switch (usageType) {
    //         case AttributeUsageType.StaticDraw:
    //             return gl.STATIC_DRAW;
    //         case AttributeUsageType.DynamicDraw:
    //             return gl.DYNAMIC_DRAW;
    //         default:
    //             throw '[VertexArrayObject.getUsage] invalid usage';
    //     }
    // }

    /**
     *
     */
    bind() {
        const { gl } = this.gpu;
        glBindVertexArray(gl, this.glObject);
    }

    /**
     *
     */
    unbind() {
        const { gl } = this.gpu;
        glBindVertexArray(gl, null);
    }

    /**
     *
     * @param attribute
     * @param push
     */
    // setAttribute(attribute: Attribute, push = false) {
    setAttribute(attribute: Attribute) {
        const gl = this.gpu.gl;

        // if (push) {
        // bind vertex array to webgl context
        glBindVertexArray(gl, this.vao);
        // }

        const { name, data, size, location, usageType, divisor } = attribute;
        const newLocation = location !== null && location !== undefined ? location : this.vboList.length;
        const vbo = glCreateBuffer(gl)!;
        // if (!vbo) {
        //     throw 'invalid vbo';
        // }
        glBindBuffer(gl, GL_ARRAY_BUFFER, vbo);
        const usage = getAttributeUsage(usageType);
        glBufferData(gl, GL_ARRAY_BUFFER, data, usage);
        glEnableVertexAttribArray(gl, newLocation);

        switch (data.constructor) {
            case Float32Array:
                // size ... 頂点ごとに埋める数
                // stride is always 0 because buffer is not interleaved.
                // ref: https://developer.mozilla.org/ja/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
                glVertexAttribPointer(gl, newLocation, size, GL_FLOAT, false, 0, 0);
                break;
            case Uint16Array:
                glVertexAttribIPointer(gl, newLocation, size, GL_UNSIGNED_SHORT, 0, 0);
                break;
            default:
                throw '[VertexArrayObject.setAttribute] invalid data type';
        }

        if (divisor) {
            glVertexAttribDivisor(gl, newLocation, divisor);
        }

        this.vboList.push({ name, vbo, usage, location, size, divisor });

        // if (push) {
        glBindVertexArray(gl, null);
        glBindBuffer(gl, GL_ARRAY_BUFFER, null);
        // }
    }

    /**
     *
     * @param key
     * @param data
     */
    updateBufferData(key: string, data: ArrayBufferView | BufferSource) {
        const { gl } = this.gpu;
        const vboInfo = this.findVertexBufferObjectInfo(key);

        // performance overhead
        // gl.bindBuffer(gl.ARRAY_BUFFER, vboInfo.vbo);
        // gl.bufferData(gl.ARRAY_BUFFER, data, vboInfo.usage);
        // gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // optimize
        glBindBuffer(gl, GL_ARRAY_BUFFER, vboInfo.vbo);
        glBufferSubData(gl, GL_ARRAY_BUFFER, 0, data);
        glBindBuffer(gl, GL_ARRAY_BUFFER, null);
    }

    /**
     *
     * @param key
     * @param buffer
     */
    replaceBuffer(key: string, buffer: WebGLBuffer) {
        const { gl } = this.gpu;

        // const { location, size } = this.findVertexBufferObjectInfo(key);
        const index = this.findVertexBufferObjectInfoIndex(key);
        const { location, size } = this.vboList[index];

        this.bind();

        glBindBuffer(gl, GL_ARRAY_BUFFER, buffer);
        glEnableVertexAttribArray(gl, location);
        // TODO: 毎フレームやるの重くない？大丈夫？
        glVertexAttribPointer(gl, location, size, GL_FLOAT, false, 0, 0);
        // divisorはもう一度指定しなくてもいいっぽい
        // if (divisor) {
        //     gl.vertexAttribDivisor(location, divisor);
        // }
        glBindBuffer(gl, GL_ARRAY_BUFFER, null);

        this.unbind();

        // replace buffer
        this.vboList[index].vbo = buffer;
    }

    // setBuffer(key: string, buffer: WebGLBuffer) {
    //     const gl = this.gpu.gl;
    //     // const targetVBO = this.vboList.find(({ name }) => key === name);
    //     const targetVBO = this.findVertexBufferObjectInfo(key);
    //     // if (!targetVBO) {
    //     //     throw 'invalid target vbo';
    //     // }
    //     gl.bindVertexArray(this.vao);
    //     gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    //     gl.bufferData(gl.ARRAY_BUFFER, , targetVBO.usage);
    //     gl.bindBuffer(gl.ARRAY_BUFFER, null);
    //     gl.bindVertexArray(null);
    // }

    /**
     *
     */
    getBuffers() {
        return this.vboList.map(({ vbo }) => vbo);
    }

    // getBuffer(name: string) {
    //     const buffer = this.vboList.find(({ name: key }) => key === name);
    //     if (!buffer) {
    //         throw 'invalid name';
    //     }
    //     return buffer;
    // }

    /**
     *
     * @param key
     */
    findVertexBufferObjectInfo(key: string): VertexBufferObject {
        // let vboInfo: VertexBufferObject | null = null;
        // let index: number = -1;
        // for (let i = 0; i < this.vboList.length; i++) {
        //     if (key === this.vboList[i].name) {
        //         vboInfo = this.vboList[i];
        //         index = i;
        //         break;
        //     }
        // }
        const vboInfo = this.vboList.find(({ name }) => key === name);
        // const vbo = this.vboList.find(({ name }) => key === name);
        if (!vboInfo) {
            throw 'invalid target vbo';
        }
        return vboInfo;
    }

    findVertexBufferObjectInfoIndex(key: string): number {
        for (let i = 0; i < this.vboList.length; i++) {
            if (key === this.vboList[i].name) {
                return i;
            }
        }
        throw 'invalid target vbo';
    }

    /**
     *
     * @param key
     */
    findBuffer(key: string): WebGLBuffer {
        const target = this.findVertexBufferObjectInfo(key);
        if (!target) {
            throw 'invalid name';
        }
        // return target.vboInfo.vbo;
        return target.vbo;
    }
}
