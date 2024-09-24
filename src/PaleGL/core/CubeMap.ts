import { GLObject } from '@/PaleGL/core/GLObject.js';
// import { CubeMapAxis } from '@/PaleGL/constants.js';
import { GPU } from '@/PaleGL/core/GPU';
import {
    GL_CLAMP_TO_EDGE,
    GL_LINEAR,
    GL_LINEAR_MIPMAP_LINEAR,
    GL_RGBA,
    GL_TEXTURE_CUBE_MAP,
    GL_TEXTURE_CUBE_MAP_NEGATIVE_X,
    GL_TEXTURE_CUBE_MAP_NEGATIVE_Y,
    GL_TEXTURE_CUBE_MAP_NEGATIVE_Z,
    GL_TEXTURE_CUBE_MAP_POSITIVE_X,
    GL_TEXTURE_CUBE_MAP_POSITIVE_Y,
    GL_TEXTURE_CUBE_MAP_POSITIVE_Z,
    GL_TEXTURE_MAG_FILTER,
    GL_TEXTURE_MIN_FILTER,
    GL_TEXTURE_WRAP_S,
    GL_TEXTURE_WRAP_T,
    GL_UNPACK_FLIP_Y_WEBGL,
    GL_UNSIGNED_BYTE,
    glBindTexture,
    glGenerateMipmap,
    glPixelStorei,
    glTexImage2D,
    glTexParameteri,
} from '@/PaleGL/core/webglWrapper.ts';

// type CubeMapArgs = {
//     gpu: GPU;
//     // images: {
//     //     [key in CubeMapAxis]: HTMLImageElement | HTMLCanvasElement | null;
//     // };
//     width: number;
//     height: number;
// };

export class CubeMap extends GLObject {
    #texture: WebGLTexture;
    width: number;
    height: number;
    maxLodLevel;

    get glObject() {
        return this.#texture;
    }

    constructor(
        gpu: GPU,
        width: number,
        height: number,
        posXImage: HTMLImageElement | HTMLCanvasElement,
        negXImage: HTMLImageElement | HTMLCanvasElement,
        posYImage: HTMLImageElement | HTMLCanvasElement,
        negYImage: HTMLImageElement | HTMLCanvasElement,
        posZImage: HTMLImageElement | HTMLCanvasElement,
        negZImage: HTMLImageElement | HTMLCanvasElement
        // images = {
        //     [CubeMapAxis.PositiveX]: null,
        //     [CubeMapAxis.NegativeX]: null,
        //     [CubeMapAxis.PositiveY]: null,
        //     [CubeMapAxis.NegativeY]: null,
        //     [CubeMapAxis.PositiveZ]: null,
        //     [CubeMapAxis.NegativeZ]: null,
        // },
    ) {
        super();

        const gl = gpu.gl;

        this.width = width;
        this.height = height;
        this.maxLodLevel = Math.log2(Math.max(this.width, this.height));

        // NOTE: 作れるはずという前提
        this.#texture = gl.createTexture()!;

        glBindTexture(gl, GL_TEXTURE_CUBE_MAP, this.#texture);

        // cubemapの場合は html img でも falseで良い。というのがよくわかってない。そういうもの？
        // ただ、たしかに反転すると上下が反転して見た目がおかしくなる
        glPixelStorei(gl, GL_UNPACK_FLIP_Y_WEBGL, false);

        glTexImage2D(gl, GL_TEXTURE_CUBE_MAP_POSITIVE_X, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, posXImage);
        glTexImage2D(gl, GL_TEXTURE_CUBE_MAP_NEGATIVE_X, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, negXImage);
        glTexImage2D(gl, GL_TEXTURE_CUBE_MAP_POSITIVE_Y, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, posYImage);
        glTexImage2D(gl, GL_TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, negYImage);
        glTexImage2D(gl, GL_TEXTURE_CUBE_MAP_POSITIVE_Z, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, posZImage);
        glTexImage2D(gl, GL_TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, GL_RGBA, GL_RGBA, GL_UNSIGNED_BYTE, negZImage);

        // tmp
        // Object.keys(images).forEach((key) => {
        //     const keyIndex = key as unknown as CubeMapAxis;
        //     let axis = null;
        //     if (keyIndex === CubeMapAxis.PositiveX) {
        //         axis = gl.TEXTURE_CUBE_MAP_POSITIVE_X;
        //     }
        //     else if (keyIndex === CubeMapAxis.NegativeX) {
        //         axis = gl.TEXTURE_CUBE_MAP_NEGATIVE_X;
        //     }
        //     else if (keyIndex === CubeMapAxis.PositiveY) {
        //         axis = gl.TEXTURE_CUBE_MAP_POSITIVE_Y;
        //     }
        //     else if (keyIndex === CubeMapAxis.NegativeY) {
        //         axis = gl.TEXTURE_CUBE_MAP_NEGATIVE_Y;
        //     }
        //     else if (keyIndex === CubeMapAxis.PositiveZ) {
        //         axis = gl.TEXTURE_CUBE_MAP_POSITIVE_Z;
        //     }
        //     else if (keyIndex === CubeMapAxis.NegativeZ) {
        //         axis = gl.TEXTURE_CUBE_MAP_NEGATIVE_Z;
        //     } else {
        //         console.log(images, keyIndex, axis)
        //         throw 'invalid axis';
        //     }
        //     // tmp
        //     // switch (key) {
        //     //     case CubeMapAxis.PositiveX:
        //     //         axis = gl.TEXTURE_CUBE_MAP_POSITIVE_X;
        //     //         break;
        //     //     case CubeMapAxis.NegativeX:
        //     //         axis = gl.TEXTURE_CUBE_MAP_NEGATIVE_X;
        //     //         break;
        //     //     case CubeMapAxis.PositiveY:
        //     //         axis = gl.TEXTURE_CUBE_MAP_POSITIVE_Y;
        //     //         break;
        //     //     case CubeMapAxis.NegativeY:
        //     //         axis = gl.TEXTURE_CUBE_MAP_NEGATIVE_Y;
        //     //         break;
        //     //     case CubeMapAxis.PositiveZ:
        //     //         axis = gl.TEXTURE_CUBE_MAP_POSITIVE_Z;
        //     //         break;
        //     //     case CubeMapAxis.NegativeZ:
        //     //         axis = gl.TEXTURE_CUBE_MAP_NEGATIVE_Z;
        //     //         break;
        //     //     default:
        //     //         throw 'invalid axis';
        //     // }
        //     // if (images[key] === null) {
        //     if (images[keyIndex] === null) {
        //         throw `[CubeMap] invalid img: ${key}`;
        //     }
        //     // TODO: なんで non null assertion 必要？？
        //     // gl.texImage2D(axis, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[key]!);
        //     gl.texImage2D(axis, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[keyIndex]!);
        // });

        // gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        glTexParameteri(gl, GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
        glTexParameteri(gl, GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(gl, GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        glTexParameteri(gl, GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

        glGenerateMipmap(gl, GL_TEXTURE_CUBE_MAP);

        // TODO: unbindしない方がよい？
        glBindTexture(gl, GL_TEXTURE_CUBE_MAP, null);
    }
}
