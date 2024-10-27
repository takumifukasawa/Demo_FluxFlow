import { MaterialArgs, Material, MaterialTypes } from '@/PaleGL/materials/Material';
import {
    DepthFuncTypes,
    FaceSide,
    PRAGMA_RAYMARCH_SCENE,
    PrimitiveTypes,
    ShadingModelIds,
    UniformBlockNames,
    UniformNames,
    UniformTypes,
} from '@/PaleGL/constants';
import raymarchVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import { litObjectSpaceRaymarchFragmentTemplate } from '@/PaleGL/shaders/templates/lit-object-space-raymarch-fragment-template.ts';
import { gbufferObjectSpaceRaymarchDepthFragmentTemplate } from '@/PaleGL/shaders/templates/gbuffer-object-space-raymarch-depth-fragment-template.ts';
import { Texture } from '@/PaleGL/core/Texture.ts';

// TODO: uniformsは一旦まっさらにしている。metallic,smoothnessの各種パラメーター、必要になりそうだったら適宜追加する
export type ObjectSpaceRaymarchMaterialArgs = {
    shadingModelId?: ShadingModelIds;
    diffuseColor?: Color;
    metallic?: number;
    diffuseMap?: Texture;
    roughness?: number;
    emissiveColor?: Color;
    fragmentShader?: string;
    depthFragmentShader?: string;
    // rawFragmentShader?: string;
} & MaterialArgs;

export function createObjectSpaceRaymarchMaterial({
    fragmentShaderTemplate,
    fragmentShaderContent,
    depthFragmentShaderTemplate,
    depthFragmentShaderContent,
    materialArgs,
}: {
    fragmentShaderTemplate?: string;
    fragmentShaderContent: string;
    depthFragmentShaderTemplate?: string;
    depthFragmentShaderContent: string;
    materialArgs: ObjectSpaceRaymarchMaterialArgs;
}) {
    const fragmentShader = (fragmentShaderTemplate || litObjectSpaceRaymarchFragmentTemplate).replace(
        PRAGMA_RAYMARCH_SCENE,
        fragmentShaderContent
    );
    const depthFragmentShader = (
        depthFragmentShaderTemplate || gbufferObjectSpaceRaymarchDepthFragmentTemplate
    ).replace(PRAGMA_RAYMARCH_SCENE, depthFragmentShaderContent);

    const material = new ObjectSpaceRaymarchMaterial({
        fragmentShader,
        depthFragmentShader,
        ...materialArgs,
        primitiveType: PrimitiveTypes.Triangles,
        faceSide: FaceSide.Double,
        uniforms: materialArgs.uniforms,
    });

    return material;
}

export class ObjectSpaceRaymarchMaterial extends Material {
    constructor({
        // TODO: 外部化
        fragmentShader,
        depthFragmentShader,
        // rawFragmentShader,
        shadingModelId = ShadingModelIds.Lit,
        diffuseMap,
        diffuseColor,
        metallic,
        roughness,
        emissiveColor,
        uniforms = [],
        uniformBlockNames,
        ...options
    }: ObjectSpaceRaymarchMaterialArgs) {
        const commonUniforms: UniformsData = [
            {
                name: UniformNames.ObjectSpaceRaymarchBoundsScale,
                type: UniformTypes.Vector3,
                value: Vector3.one,
            },
            {
                name: UniformNames.DepthTexture,
                type: UniformTypes.Texture,
                value: null,
            },
            // {
            //     name: UniformNames.CameraNear,
            //     type: UniformTypes.Float,
            //     value: 0,
            // },
            // {
            //     name: UniformNames.CameraFar,
            //     type: UniformTypes.Float,
            //     value: 0,
            // },
            {
                name: UniformNames.Metallic,
                type: UniformTypes.Float,
                value: metallic || 0,
            },
            {
                name: UniformNames.Roughness,
                type: UniformTypes.Float,
                value: roughness || 0,
            },
            {
                name: UniformNames.DiffuseMap,
                type: UniformTypes.Texture,
                value: diffuseMap || null,
            },
            {
                name: UniformNames.DiffuseColor,
                type: UniformTypes.Color,
                value: diffuseColor || Color.white,
            },
            {
                name: UniformNames.EmissiveColor,
                type: UniformTypes.Color,
                value: emissiveColor || Color.black,
            },
            {
                name: 'uIsPerspective',
                type: UniformTypes.Float,
                value: 0,
            },
            {
                name: 'uUseWorld',
                type: UniformTypes.Float,
                value: 0
            }
        ];
        const shadingUniforms: UniformsData = [
            {
                name: UniformNames.ShadingModelId,
                type: UniformTypes.Int, // float,intどちらでもいい
                value: shadingModelId,
            },
        ];

        const mergedUniforms: UniformsData = [...commonUniforms, ...shadingUniforms, ...(uniforms ? uniforms : [])];

        // TODO: できるだけconstructorの直後に持っていきたい
        super({
            ...options,
            name: 'ObjectSpaceRaymarchMaterial',
            type: MaterialTypes.ObjectSpaceRaymarch,
            vertexShader: raymarchVert,
            fragmentShader,
            depthFragmentShader,
            // rawFragmentShader,
            uniforms: mergedUniforms,
            depthUniforms: commonUniforms,
            // NOTE: GBufferMaterialの設定
            // useNormalMap: !!normalMap,
            // depthTest: true,
            // depthWrite: false,
            // depthFuncType: DepthFuncTypes.Equal,
            // NOTE: GBufferMaterialと違う点
            depthTest: true,
            depthWrite: true,
            depthFuncType: DepthFuncTypes.Lequal,
            skipDepthPrePass: true,

            uniformBlockNames: [
                UniformBlockNames.Common,
                UniformBlockNames.Transformations,
                UniformBlockNames.Camera,
                ...(uniformBlockNames ? uniformBlockNames : []),
            ],
        });
    }
}
