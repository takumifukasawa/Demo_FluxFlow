import { MaterialArgs, Material, MaterialTypes } from '@/PaleGL/materials/Material';
import { DepthFuncTypes, ShadingModelIds, UniformBlockNames, UniformNames, UniformTypes } from '@/PaleGL/constants';
import raymarchVert from '@/PaleGL/shaders/gbuffer-vertex.glsl';
import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
import { Vector3 } from '@/PaleGL/math/Vector3.ts';
import {Color} from "@/PaleGL/math/Color.ts";

// TODO: uniformsは一旦まっさらにしている。metallic,smoothnessの各種パラメーター、必要になりそうだったら適宜追加する
export type ObjectSpaceRaymarchMaterialArgs = {
    shadingModelId?: ShadingModelIds;
    metallic?: number;
    roughness?: number;
    emissiveColor?: Color;
    fragmentShader: string;
    depthFragmentShader: string;
} & MaterialArgs;

export class ObjectSpaceRaymarchMaterial extends Material {
    constructor({
        // TODO: 外部化
        fragmentShader,
        depthFragmentShader,
        shadingModelId = ShadingModelIds.Lit,
        metallic,
        roughness,
        emissiveColor,
        uniforms = [],
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
                name: UniformNames.EmissiveColor,
                type: UniformTypes.Color,
                value: emissiveColor || Color.black,
            },
            {
                name: 'uIsPerspective',
                type: UniformTypes.Float,
                value: 0,
            },
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
            
            // TODO: 追加のものを渡せるようにしたい
            uniformBlockNames: [UniformBlockNames.Common, UniformBlockNames.Transformations, UniformBlockNames.Camera],
        });
    }
}
