// constants -----------------------------------

// export const GLColorAttachment = {
//     COLOR_ATTACHMENT0: 36064, // gl.COLOR_ATTACHMENT0 + 0
//     COLOR_ATTACHMENT1: 36065, // gl.COLOR_ATTACHMENT0 + 1
//     COLOR_ATTACHMENT2: 36066, // gl.COLOR_ATTACHMENT0 + 2
//     COLOR_ATTACHMENT3: 36067, // gl.COLOR_ATTACHMENT0 + 3
//     COLOR_ATTACHMENT4: 36068, // gl.COLOR_ATTACHMENT0 + 4
//     COLOR_ATTACHMENT5: 36069, // gl.COLOR_ATTACHMENT0 + 5
//     COLOR_ATTACHMENT6: 36070, // gl.COLOR_ATTACHMENT0 + 6
//     COLOR_ATTACHMENT7: 36071, // gl.COLOR_ATTACHMENT0 + 7
// } as const;
//
// export type GLColorAttachment =
//     | 36064 // gl.COLOR_ATTACHMENT0 + 0
//     | 36065 // gl.COLOR_ATTACHMENT0 + 1
//     | 36066 // gl.COLOR_ATTACHMENT0 + 2
//     | 36067 // gl.COLOR_ATTACHMENT0 + 3
//     | 36068 // gl.COLOR_ATTACHMENT0 + 4
//     | 36069 // gl.COLOR_ATTACHMENT0 + 5
//     | 36070 // gl.COLOR_ATTACHMENT0 + 6
//     | 36071; // gl.COLOR_ATTACHMENT0 + 7
//
// export const GLFrameBufferStatus = {
//     FRAMEBUFFER_COMPLETE: 36053,
//     FRAMEBUFFER_INCOMPLETE_ATTACHMENT: 36054,
//     FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: 36055,
//     FRAMEBUFFER_INCOMPLETE_DIMENSIONS: 36057,
//     FRAMEBUFFER_UNSUPPORTED: 36061,
// } as const;
//
// export const GLExtensionName = {
//     ColorBufferFloat: 'EXT_color_buffer_float',
// } as const;
//
// export const GL = {
//     TEXTURE_2D: 3553,
// } as const;
//
// export type GL = (typeof GL)[keyof typeof GL];
//
// export const GLTextureFilterType = {
//     TEXTURE_MIN_FILTER: 10241,
//     TEXTURE_MAG_FILTER: 10240
// } as const;
//
// export type GLTextureFilterType = (typeof GLTextureFilterType)[keyof typeof GLTextureFilterType];
//
// export const GLTextureFilter = {
//     NEAREST: 9728,
//     LINEAR: 9729,
//     NEAREST_MIPMAP_NEAREST: 9984,
//     NEAREST_MIPMAP_LINEAR: 9986,
//     LINEAR_MIPMAP_NEAREST: 9985,
//     LINEAR_MIPMAP_LINEAR: 9987,
// } as const;
//
// export type GLTextureFilter = (typeof GLTextureFilter)[keyof typeof GLTextureFilter];
//
// export const GLTextureWrap = {
//     REPEAT: 10497,
//     CLAMP_TO_EDGE: 33071,
//     MIRRORED_REPEAT: 33648,
// } as const;
//
// export type GLTextureWrap = (typeof GLTextureWrap)[keyof typeof GLTextureWrap];

// ---

export const GL_EXT_color_buffer_float = 'EXT_color_buffer_float';

export const GL_TEXTURE_2D = 3553;
export type GL_TEXTURE_2D = typeof GL_TEXTURE_2D;
export const GL_TEXTURE_CUBE_MAP = 34067;
export type GL_TEXTURE_CUBE_MAP = typeof GL_TEXTURE_CUBE_MAP;

export const GL_TEXTURE0 = 33984;

export const GL_FRAMEBUFFER = 36160;
export type GL_FRAMEBUFFER = typeof GL_FRAMEBUFFER;

export const GL_DEPTH_BUFFER_BIT = 256;
export type GL_DEPTH_BUFFER_BIT = typeof GL_DEPTH_BUFFER_BIT;

export const GL_COLOR_BUFFER_BIT = 16384;
export type GL_COLOR_BUFFER_BIT = typeof GL_COLOR_BUFFER_BIT;

export const GL_POINTS = 0;
export type GL_POINTS = typeof GL_POINTS;
export const GL_LINES = 1;
export type GL_LINES = typeof GL_LINES;
export const GL_TRIANGLES = 4;
export type GL_TRIANGLES = typeof GL_TRIANGLES;

export const GL_RASTERIZER_DISCARD = 35977;
export type GL_RASTERIZER_DISCARD = typeof GL_RASTERIZER_DISCARD;

export const GL_TRANSFORM_FEEDBACK = 36386;
export type GL_TRANSFORM_FEEDBACK = typeof GL_TRANSFORM_FEEDBACK;
export const GL_TRANSFORM_FEEDBACK_BUFFER = 35982;
export type GL_TRANSFORM_FEEDBACK_BUFFER = typeof GL_TRANSFORM_FEEDBACK_BUFFER;

export const GL_CULL_FACE = 2884;
export type GL_CULL_FACE = typeof GL_CULL_FACE;
export const GL_BACK = 1029;
export type GL_BACK = typeof GL_BACK;
export const GL_CCW = 2305;
export type GL_CCW = typeof GL_CCW;
export const GL_FRONT = 1028;
export type GL_FRONT = typeof GL_FRONT;
export const GL_EQUAL = 514;
export type GL_EQUAL = typeof GL_EQUAL;
export const GL_LEQUAL = 515;
export type GL_LEQUAL = typeof GL_LEQUAL;
export const GL_DEPTH_TEST = 2929;
export type GL_DEPTH_TEST = typeof GL_DEPTH_TEST;

export const GL_BLEND = 3042;
export type GL_BLEND = typeof GL_BLEND;
export const GL_SRC_ALPHA = 770;
export type GL_SRC_ALPHA = typeof GL_SRC_ALPHA;
export const GL_ONE_MINUS_SRC_ALPHA = 771;
export type GL_ONE_MINUS_SRC_ALPHA = typeof GL_ONE_MINUS_SRC_ALPHA;
export const GL_ONE = 1;
export type GL_ONE = typeof GL_ONE;

export const GL_UNSIGNED_SHORT = 5123;
export type GL_UNSIGNED_SHORT = typeof GL_UNSIGNED_SHORT;

export const GL_UNIFORM_OFFSET = 35387;
export type GL_UNIFORM_OFFSET = typeof GL_UNIFORM_OFFSET;

export const GL_STATIC_DRAW = 35044;
export type GL_STATIC_DRAW = typeof GL_STATIC_DRAW;
export const GL_DYNAMIC_DRAW = 35048;
export type GL_DYNAMIC_DRAW = typeof GL_DYNAMIC_DRAW;
export const GL_DYNAMIC_COPY = 35050;
export type GL_DYNAMIC_COPY = typeof GL_DYNAMIC_COPY;

export const GL_UNIFORM_BLOCK_DATA_SIZE = 35392;
export type GL_UNIFORM_BLOCK_DATA_SIZE = typeof GL_UNIFORM_BLOCK_DATA_SIZE;

export const GL_ARRAY_BUFFER = 34962;
export type GL_ARRAY_BUFFER = typeof GL_ARRAY_BUFFER;

export const GL_FLOAT = 5126;
export type GL_FLOAT = typeof GL_FLOAT;

export const GL_RGBA = 6408;
export type GL_RGBA = typeof GL_RGBA;

export const GL_RGBA32F = 34836;
export type GL_RGBA32F = typeof GL_RGBA32F;

export const GL_RED = 6403;
export type GL_RED = typeof GL_RED;

export const GL_R16F = 33325;
export type GL_R16F = typeof GL_R16F;

export const GL_R11F_G11F_B10F = 35898;
export type GL_R11F_G11F_B10F = typeof GL_R11F_G11F_B10F;

export const GL_RGB = 6407;
export type GL_RGB = typeof GL_RGB;

export const GL_RGBA16F = 34842;
export type GL_RGBA16F = typeof GL_RGBA16F;

export const GL_DEPTH_COMPONENT = 6402;
export type GL_DEPTH_COMPONENT = typeof GL_DEPTH_COMPONENT;

export const GL_DEPTH_COMPONENT32F = 36012;
export type GL_DEPTH_COMPONENT32F = typeof GL_DEPTH_COMPONENT32F;
export const GL_DEPTH_COMPONENT16 = 33189;
export type GL_DEPTH_COMPONENT16 = typeof GL_DEPTH_COMPONENT16;

export const GL_UNSIGNED_BYTE = 5121;
export type GL_UNSIGNED_BYTE = typeof GL_UNSIGNED_BYTE;

export const GL_UNPACK_FLIP_Y_WEBGL = 37440;

export const GL_DEPTH_ATTACHMENT = 36096;
export type GL_DEPTH_ATTACHMENT = typeof GL_DEPTH_ATTACHMENT;

export const GL_RENDERBUFFER = 36161;
export type GL_RENDERBUFFER = typeof GL_RENDERBUFFER;

export const GL_READ_FRAMEBUFFER = 36008;
export type GL_READ_FRAMEBUFFER = typeof GL_READ_FRAMEBUFFER;
export const GL_DRAW_FRAMEBUFFER = 36009;
export type GL_DRAW_FRAMBUFFER = typeof GL_DRAW_FRAMEBUFFER;

export const GL_ELEMENT_ARRAY_BUFFER = 34963;
export type GL_ELEMENT_ARRAY_BUFFER = typeof GL_ELEMENT_ARRAY_BUFFER;

export const GL_UNIFORM_BUFFER = 35345;
export type GL_UNIFORM_BUFFER = typeof GL_UNIFORM_BUFFER;

export const GL_VERTEX_SHADER = 35633;
export const GL_FRAGMENT_SHADER = 35632 as const;

export const GL_SEPARATE_ATTRIBS = 35981;
export type GL_SEPARATE_ATTRIBS = typeof GL_SEPARATE_ATTRIBS;

export const GL_TEXTURE_CUBE_MAP_POSITIVE_X = 34069;
export type GL_TEXTURE_CUBE_MAP_POSITIVE_X = typeof GL_TEXTURE_CUBE_MAP_POSITIVE_X;
export const GL_TEXTURE_CUBE_MAP_NEGATIVE_X = 34070;
export type GL_TEXTURE_CUBE_MAP_NEGATIVE_X = typeof GL_TEXTURE_CUBE_MAP_NEGATIVE_X;
export const GL_TEXTURE_CUBE_MAP_POSITIVE_Y = 34071;
export type GL_TEXTURE_CUBE_MAP_POSITIVE_Y = typeof GL_TEXTURE_CUBE_MAP_POSITIVE_Y;
export const GL_TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072;
export type GL_TEXTURE_CUBE_MAP_NEGATIVE_Y = typeof GL_TEXTURE_CUBE_MAP_NEGATIVE_Y;
export const GL_TEXTURE_CUBE_MAP_POSITIVE_Z = 34073;
export type GL_TEXTURE_CUBE_MAP_POSITIVE_Z = typeof GL_TEXTURE_CUBE_MAP_POSITIVE_Z;
export const GL_TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074;
export type GL_TEXTURE_CUBE_MAP_NEGATIVE_Z = typeof GL_TEXTURE_CUBE_MAP_NEGATIVE_Z;

// filter -----------------------------------

export const GL_TEXTURE_MIN_FILTER = 10241;
export type GL_TEXTURE_MIN_FILTER = typeof GL_TEXTURE_MIN_FILTER;
export const GL_TEXTURE_MAG_FILTER = 10240;
export type GL_TEXTURE_MAG_FILTER = typeof GL_TEXTURE_MAG_FILTER;

export const GL_NEAREST = 9728;
export type GL_NEAREST = typeof GL_NEAREST;
export const GL_LINEAR = 9729;
export type GL_LINEAR = typeof GL_LINEAR;
export const GL_NEAREST_MIPMAP_NEAREST = 9984;
export type GL_NEAREST_MIPMAP_NEAREST = typeof GL_NEAREST_MIPMAP_NEAREST;
export const GL_NEAREST_MIPMAP_LINEAR = 9986;
export type GL_NEAREST_MIPMAP_LINEAR = typeof GL_NEAREST_MIPMAP_LINEAR;
export const GL_LINEAR_MIPMAP_NEAREST = 9985;
export type GL_LINEAR_MIPMAP_NEAREST = typeof GL_LINEAR_MIPMAP_NEAREST;
export const GL_LINEAR_MIPMAP_LINEAR = 9987;
export type GL_LINEAR_MIPMAP_LINEAR = typeof GL_LINEAR_MIPMAP_LINEAR;

// wrap -----------------------------------

export const GL_TEXTURE_WRAP_S = 10242;
export type GL_TEXTURE_WRAP_S = typeof GL_TEXTURE_WRAP_S;
export const GL_TEXTURE_WRAP_T = 10243;
export type GL_TEXTURE_WRAP_T = typeof GL_TEXTURE_WRAP_T;

export const GL_REPEAT = 10497;
export type GL_REPEAT = typeof GL_REPEAT;
export const GL_CLAMP_TO_EDGE = 33071;
export type GL_CLAMP_TO_EDGE = typeof GL_CLAMP_TO_EDGE;
export const GL_MIRRORED_REPEAT = 33648;
export type GL_MIRRORED_REPEAT = typeof GL_MIRRORED_REPEAT;

// framebuffer -----------------------------------

export const GL_FRAMEBUFFER_COMPLETE = 36053;
export const GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 36054;
export const GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 36055;
export const GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 36057;
export const GL_FRAMEBUFFER_UNSUPPORTED = 36061;

export const GL_COLOR_ATTACHMENT0 = 36064;
export type GL_COLOR_ATTACHMENT0 = typeof GL_COLOR_ATTACHMENT0;
export const GL_COLOR_ATTACHMENT1 = 36065;
export type GL_COLOR_ATTACHMENT1 = typeof GL_COLOR_ATTACHMENT1;
export const GL_COLOR_ATTACHMENT2 = 36066;
export type GL_COLOR_ATTACHMENT2 = typeof GL_COLOR_ATTACHMENT2;
export const GL_COLOR_ATTACHMENT3 = 36067;
export type GL_COLOR_ATTACHMENT3 = typeof GL_COLOR_ATTACHMENT3;
export const GL_COLOR_ATTACHMENT4 = 36068;
export type GL_COLOR_ATTACHMENT4 = typeof GL_COLOR_ATTACHMENT4;
export const GL_COLOR_ATTACHMENT5 = 36069;
export type GL_COLOR_ATTACHMENT5 = typeof GL_COLOR_ATTACHMENT5;
export const GL_COLOR_ATTACHMENT6 = 36070;
export type GL_COLOR_ATTACHMENT6 = typeof GL_COLOR_ATTACHMENT6;
export const GL_COLOR_ATTACHMENT7 = 36071;
export type GL_COLOR_ATTACHMENT7 = typeof GL_COLOR_ATTACHMENT7;

// functions --------------------------------------

export function glShaderSource(gl: WebGLRenderingContext, shader: WebGLShader, src: string) {
    gl.shaderSource(shader, src);
}

export function glCompileShader(gl: WebGLRenderingContext, shader: WebGLShader) {
    gl.compileShader(shader);
}

export function glGetShaderInfoLog(gl: WebGLRenderingContext, shader: WebGLShader) {
    return gl.getShaderInfoLog(shader);
}

export function glCreateProgram(gl: WebGLRenderingContext) {
    return gl.createProgram();
}

export function glAttachShader(gl: WebGLRenderingContext, program: WebGLProgram, shader: WebGLShader) {
    gl.attachShader(program, shader);
}

export function glTransformFeedbackVaryings(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    varyings: string[],
    bufferMode: GL_SEPARATE_ATTRIBS
) {
    gl.transformFeedbackVaryings(program, varyings, bufferMode);
}

export function glLinkProgram(gl: WebGLRenderingContext, program: WebGLProgram) {
    gl.linkProgram(program);
}

export function glGetProgramInfoLog(gl: WebGLRenderingContext, program: WebGLProgram) {
    return gl.getProgramInfoLog(program);
}

export function glDeleteShader(gl: WebGLRenderingContext, shader: WebGLShader | null) {
    gl.deleteShader(shader);
}

export function glBindTexture(
    gl: WebGLRenderingContext,
    target: GL_TEXTURE_2D | GL_TEXTURE_CUBE_MAP,
    texture: WebGLTexture | null
) {
    gl.bindTexture(target, texture);
}

export function glPixelStorei(gl: WebGLRenderingContext, pname: number, param: boolean) {
    gl.pixelStorei(pname, param);
}


export function glTexImage2D(
    gl: WebGLRenderingContext,
    target:
        | GL_TEXTURE_2D
        | GL_TEXTURE_CUBE_MAP_POSITIVE_X
        | GL_TEXTURE_CUBE_MAP_NEGATIVE_X
        | GL_TEXTURE_CUBE_MAP_POSITIVE_Y
        | GL_TEXTURE_CUBE_MAP_NEGATIVE_Y
        | GL_TEXTURE_CUBE_MAP_POSITIVE_Z
        | GL_TEXTURE_CUBE_MAP_NEGATIVE_Z,
    level: number,
    internalformat:
        | GL_R16F
        | GL_RGBA
        | GL_RGBA16F
        | GL_RGBA32F
        | GL_DEPTH_COMPONENT16
        | GL_DEPTH_COMPONENT32F
        | GL_R11F_G11F_B10F,
    format:
        | GL_RED
        | GL_RGB
        | GL_RGBA
        | GL_DEPTH_COMPONENT,
    type:
        | GL_UNSIGNED_BYTE
        | GL_FLOAT
        | GL_UNSIGNED_SHORT,
    pixels: HTMLImageElement | HTMLCanvasElement | null
) {
    gl.texImage2D(target, level, internalformat, format, type, pixels as TexImageSource);
}

export function glTexImage2D_withSize(
    gl: WebGLRenderingContext,
    target:
        | GL_TEXTURE_2D
        | GL_TEXTURE_CUBE_MAP_POSITIVE_X
        | GL_TEXTURE_CUBE_MAP_NEGATIVE_X
        | GL_TEXTURE_CUBE_MAP_POSITIVE_Y
        | GL_TEXTURE_CUBE_MAP_NEGATIVE_Y
        | GL_TEXTURE_CUBE_MAP_POSITIVE_Z
        | GL_TEXTURE_CUBE_MAP_NEGATIVE_Z,
    level: number,
    internalformat:
        | GL_R16F
        | GL_RGBA
        | GL_RGBA16F
        | GL_RGBA32F
        | GL_DEPTH_COMPONENT16
        | GL_DEPTH_COMPONENT32F
        | GL_R11F_G11F_B10F,
    width: number,
    height: number,
    border: number,
    format:
        | GL_RED
        | GL_RGB
        | GL_RGBA
        | GL_DEPTH_COMPONENT,
    type:
        | GL_UNSIGNED_BYTE
        | GL_FLOAT
        | GL_UNSIGNED_SHORT,
    pixels: HTMLImageElement | HTMLCanvasElement | null
) {
    gl.texImage2D(target, level, internalformat, width, height, border, format, type, pixels as unknown as (ArrayBufferView | null));
}

export function glTexParameteri(
    gl: WebGLRenderingContext,
    target:
        GL_TEXTURE_2D |
        GL_TEXTURE_CUBE_MAP,
    pname:
        GL_TEXTURE_MIN_FILTER |
        GL_TEXTURE_MAG_FILTER |
        GL_TEXTURE_WRAP_S |
        GL_TEXTURE_WRAP_T,
    param:
        GL_NEAREST |
        GL_LINEAR |
        GL_REPEAT |
        GL_CLAMP_TO_EDGE |
        GL_LINEAR_MIPMAP_LINEAR
) {
    gl.texParameteri(target, pname, param);
}

export function glGenerateMipmap(
    gl: WebGLRenderingContext,
    target: GL_TEXTURE_2D | GL_TEXTURE_CUBE_MAP) {
    gl.generateMipmap(target);
}

export function glCreateFramebuffer(gl: WebGLRenderingContext) {
    return gl.createFramebuffer();
}

export function glBindFramebuffer(
    gl: WebGLRenderingContext,
    target: GL_FRAMEBUFFER | GL_DRAW_FRAMBUFFER | GL_READ_FRAMEBUFFER,
    framebuffer: WebGLFramebuffer | null
) {
    gl.bindFramebuffer(target, framebuffer);
}

export function glFramebufferTexture2D(
    gl: WebGLRenderingContext,
    target: GL_FRAMEBUFFER,
    attachment:
        | GL_DEPTH_ATTACHMENT
        | GL_COLOR_ATTACHMENT0
        | GL_COLOR_ATTACHMENT1
        | GL_COLOR_ATTACHMENT2
        | GL_COLOR_ATTACHMENT3
        | GL_COLOR_ATTACHMENT4
        | GL_COLOR_ATTACHMENT5
        | GL_COLOR_ATTACHMENT6
        | GL_COLOR_ATTACHMENT7,
    textarget: GL_TEXTURE_2D,
    texture: WebGLTexture | null,
    level: number
) {
    gl.framebufferTexture2D(target, attachment, textarget, texture, level);
}

export function glGetBufferSubData(
    gl: WebGL2RenderingContext,
    target: GL_TRANSFORM_FEEDBACK_BUFFER,
    srcByteOffset: number,
    dstBuffer: ArrayBufferView
) {
    gl.getBufferSubData(target, srcByteOffset, dstBuffer);
}

export function glViewport(gl: WebGLRenderingContext, x: number, y: number, width: number, height: number) {
    gl.viewport(x, y, width, height);
}

export function glDrawBuffers(
    gl: WebGL2RenderingContext,
    buffers: (
        | GL_COLOR_ATTACHMENT0
        | GL_COLOR_ATTACHMENT1
        | GL_COLOR_ATTACHMENT2
        | GL_COLOR_ATTACHMENT3
        | GL_COLOR_ATTACHMENT4
        | GL_COLOR_ATTACHMENT5
        | GL_COLOR_ATTACHMENT6
        | GL_COLOR_ATTACHMENT7
    )[]
) {
    gl.drawBuffers(buffers);
}

export function glFlush(gl: WebGLRenderingContext) {
    gl.flush();
}

export function glDepthFunc(gl: WebGLRenderingContext, func: GL_EQUAL | GL_LEQUAL) {
    gl.depthFunc(func);
}

export function glDepthMask(gl: WebGLRenderingContext, flag: boolean) {
    gl.depthMask(flag);
}

export function glColorMask(gl: WebGLRenderingContext, r: boolean, g: boolean, b: boolean, a: boolean) {
    gl.colorMask(r, g, b, a);
}

export function glClearColor(gl: WebGLRenderingContext, r: number, g: number, b: number, a: number) {
    gl.clearColor(r, g, b, a);
}

export function glClear(gl: WebGLRenderingContext, mask: GL_DEPTH_BUFFER_BIT | GL_COLOR_BUFFER_BIT) {
    gl.clear(mask);
}

export function glGetExtension(gl: WebGLRenderingContext, name: string) {
    return gl.getExtension(name) != null;
}

export function glGetUniformLocation(gl: WebGLRenderingContext, program: WebGLProgram, name: string) {
    return gl.getUniformLocation(program, name);
}

export function glUniform1i(gl: WebGLRenderingContext, location: WebGLUniformLocation | null, v0: number) {
    gl.uniform1i(location, v0);
}

export function glUniform1f(gl: WebGLRenderingContext, location: WebGLUniformLocation | null, v0: number) {
    gl.uniform1f(location, v0);
}

export function glUniform1fv(gl: WebGLRenderingContext, location: WebGLUniformLocation | null, data: Float32Array) {
    gl.uniform1fv(location, data);
}

export function glUniform1iv(gl: WebGLRenderingContext, location: WebGLUniformLocation | null, data: number[]) {
    gl.uniform1iv(location, data);
}

export function glUniform2fv(
    gl: WebGLRenderingContext,
    location: WebGLUniformLocation | null,
    data: Float32Array | number[]
) {
    gl.uniform2fv(location, data);
}

export function glUniform3fv(
    gl: WebGLRenderingContext,
    location: WebGLUniformLocation | null,
    data: Float32Array | number[]
) {
    gl.uniform3fv(location, data);
}

export function glUniform4fv(
    gl: WebGLRenderingContext,
    location: WebGLUniformLocation | null,
    data: Float32Array | number[]
) {
    gl.uniform4fv(location, data);
}

export function glUniformMatrix4fv(
    gl: WebGLRenderingContext,
    location: WebGLUniformLocation | null,
    transpose: boolean,
    data: Float32Array | number[]
) {
    gl.uniformMatrix4fv(location, transpose, data);
}

export function glActiveTexture(gl: WebGLRenderingContext, texture: number) {
    gl.activeTexture(texture);
}

export function glBindVertexArray(gl: WebGL2RenderingContext, vao: WebGLVertexArrayObject | null) {
    gl.bindVertexArray(vao);
}

export function glUseProgram(gl: WebGLRenderingContext, program: WebGLProgram | null) {
    gl.useProgram(program);
}

export function glEnable(gl: WebGLRenderingContext, flag: GL_RASTERIZER_DISCARD | GL_DEPTH_TEST | GL_BLEND | GL_CULL_FACE) {
    gl.enable(flag);
}

export function glDisable(gl: WebGLRenderingContext, flag: GL_RASTERIZER_DISCARD | GL_DEPTH_TEST | GL_BLEND | GL_CULL_FACE) {
    gl.disable(flag);
}

export function glBlendFunc(
    gl: WebGLRenderingContext,
    sfactor: GL_SRC_ALPHA,
    dfactor:
        | GL_ONE_MINUS_SRC_ALPHA
        | GL_ONE
) {
    gl.blendFunc(sfactor, dfactor);
}

export function glCullFace(gl: WebGLRenderingContext, mode: GL_FRONT | GL_BACK) {
    gl.cullFace(mode);
}

export function glFrontFace(gl: WebGLRenderingContext, mode: GL_CCW) {
    gl.frontFace(mode);
}

export function glBindTransformFeedback(
    gl: WebGL2RenderingContext,
    target: GL_TRANSFORM_FEEDBACK,
    tf: WebGLTransformFeedback | null
) {
    gl.bindTransformFeedback(target, tf);
}

export function glBeginTransformFeedback(
    gl: WebGL2RenderingContext,
    primitiveMode: GL_POINTS | GL_LINES | GL_TRIANGLES
) {
    gl.beginTransformFeedback(primitiveMode);
}

export function glDrawArrays(
    gl: WebGLRenderingContext,
    mode: GL_POINTS | GL_LINES | GL_TRIANGLES,
    first: number,
    count: number
) {
    gl.drawArrays(mode, first, count);
}

export function glDrawArraysInstanced(
    gl: WebGL2RenderingContext,
    mode: GL_TRIANGLES | GL_POINTS | GL_LINES,
    first: number,
    count: number,
    instanceCount: number
) {
    gl.drawArraysInstanced(mode, first, count, instanceCount);
}

export function glDrawElementsInstanced(
    gl: WebGL2RenderingContext,
    mode: GL_TRIANGLES | GL_POINTS | GL_LINES,
    count: number,
    type: GL_UNSIGNED_SHORT,
    offset: number,
    instanceCount: number
) {
    gl.drawElementsInstanced(mode, count, type, offset, instanceCount);
}

export function glDrawElements(
    gl: WebGLRenderingContext,
    mode: GL_TRIANGLES | GL_POINTS | GL_LINES,
    count: number,
    type: GL_UNSIGNED_SHORT,
    offset: number
) {
    gl.drawElements(mode, count, type, offset);
}

export function glEndTransformFeedback(gl: WebGL2RenderingContext) {
    gl.endTransformFeedback();
}

export function glBufferData(
    gl: WebGLRenderingContext,
    target:
        | GL_ARRAY_BUFFER
        | GL_ELEMENT_ARRAY_BUFFER
        | GL_UNIFORM_BUFFER,
    data: ArrayBufferView | number,
    usage: GL_STATIC_DRAW | GL_DYNAMIC_DRAW | GL_DYNAMIC_COPY
) {
    gl.bufferData(target, data as (BufferSource | null), usage);
}

export function glBindBuffer(
    gl: WebGLRenderingContext,
    target: GL_ARRAY_BUFFER | GL_ELEMENT_ARRAY_BUFFER | GL_UNIFORM_BUFFER,
    buffer: WebGLBuffer | null
) {
    gl.bindBuffer(target, buffer);
}

export function glBindRenderbuffer(
    gl: WebGLRenderingContext,
    target: GL_RENDERBUFFER,
    renderbuffer: WebGLRenderbuffer | null
) {
    gl.bindRenderbuffer(target, renderbuffer);
}

export function glRenderbufferStorage(
    gl: WebGLRenderingContext,
    target: GL_RENDERBUFFER,
    internalformat: GL_DEPTH_COMPONENT16,
    width: number,
    height: number
) {
    gl.renderbufferStorage(target, internalformat, width, height);
}

export function glFramebufferRenderbuffer(
    gl: WebGLRenderingContext,
    target: GL_FRAMEBUFFER,
    attachment: GL_DEPTH_ATTACHMENT,
    renderbuffertarget: GL_RENDERBUFFER,
    renderbuffer: WebGLRenderbuffer | null
) {
    gl.framebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer);
}

export function glCheckFramebufferStatus(gl: WebGLRenderingContext, target: GL_READ_FRAMEBUFFER) {
    return gl.checkFramebufferStatus(target);
}

export function glBlitFramebuffer(
    gl: WebGL2RenderingContext,
    srcX0: number,
    srcY0: number,
    srcX1: number,
    srcY1: number,
    dstX0: number,
    dstY0: number,
    dstX1: number,
    dstY1: number,
    mask: GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT,
    filter: GL_NEAREST | GL_LINEAR
) {
    gl.blitFramebuffer(srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter);
}

export function glCreateTexture(gl: WebGLRenderingContext) {
    return gl.createTexture();
}

export function glCreateTransformFeedback(gl: WebGL2RenderingContext) {
    return gl.createTransformFeedback();
}

export function glBindBufferBase(
    gl: WebGL2RenderingContext,
    target: GL_TRANSFORM_FEEDBACK_BUFFER | GL_UNIFORM_BUFFER,
    index: number,
    buffer: WebGLBuffer | null
) {
    gl.bindBufferBase(target, index, buffer);
}

export function glCreateBuffer(gl: WebGLRenderingContext) {
    return gl.createBuffer();
}

export function glCreateVertexArray(gl: WebGL2RenderingContext) {
    return gl.createVertexArray();
}

export function glEnableVertexAttribArray(gl: WebGLRenderingContext, index: number) {
    gl.enableVertexAttribArray(index);
}

export function glVertexAttribPointer(
    gl: WebGLRenderingContext,
    index: number,
    size: number,
    type: GL_FLOAT,
    normalized: boolean,
    stride: number,
    offset: number
) {
    gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
}

export function glVertexAttribIPointer(
    gl: WebGL2RenderingContext,
    index: number,
    size: number,
    type: GL_UNSIGNED_SHORT,
    stride: number,
    offset: number
) {
    gl.vertexAttribIPointer(index, size, type, stride, offset);
}

export function glVertexAttribDivisor(gl: WebGL2RenderingContext, index: number, divisor: number) {
    gl.vertexAttribDivisor(index, divisor);
}

export function glBufferSubData(
    gl: WebGLRenderingContext,
    target: GL_ARRAY_BUFFER | GL_ELEMENT_ARRAY_BUFFER,
    offset: number,
    data: ArrayBufferView | BufferSource
) {
    gl.bufferSubData(target, offset, data);
}

export function glGetUniformBlockIndex(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    uniformBlockName: string
) {
    return gl.getUniformBlockIndex(program, uniformBlockName);
}

export function glGetActiveUniformBlockParameter(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    uniformBlockIndex: number,
    pname: GL_UNIFORM_BLOCK_DATA_SIZE
): unknown {
    return gl.getActiveUniformBlockParameter(program, uniformBlockIndex, pname);
}

export function glGetUniformIndices(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    uniformNames: string[]
) {
    return gl.getUniformIndices(program, uniformNames);
}

export function glGetActiveUniforms(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    uniformIndices: number[],
    pname: GL_UNIFORM_OFFSET
): unknown {
    return gl.getActiveUniforms(program, uniformIndices, pname);
}

export function glUniformBlockBinding(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
    uniformBlockIndex: number,
    uniformBlockBinding: number
) {
    gl.uniformBlockBinding(program, uniformBlockIndex, uniformBlockBinding);
}
 