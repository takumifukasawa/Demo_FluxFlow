import { GPU } from '@/PaleGL/core/GPU.ts';
import { FaceSide, PrimitiveTypes, UniformNames } from '@/PaleGL/constants.ts';
import { Mesh, MeshOptionsArgs } from '@/PaleGL/actors/Mesh.ts';
// import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
import {
    ObjectSpaceRaymarchMaterial,
    ObjectSpaceRaymarchMaterialArgs,
} from '@/PaleGL/materials/ObjectSpaceRaymarchMaterial.ts';
import { BoxGeometry } from '@/PaleGL/geometries/BoxGeometry.ts';
import { Camera } from '@/PaleGL/actors/Camera.ts';
import { ActorUpdateArgs } from '@/PaleGL/actors/Actor.ts';
// import {GBufferMaterial} from "@/PaleGL/materials/GBufferMaterial.ts";

const PRAGMA_RAYMARCH_SCENE = "#pragma RAYMARCH_SCENE";

type ObjectSpaceRaymarchMeshArgs = {
    gpu: GPU;
    size?: number;
    // fragmentShader: string;
    // depthFragmentShader: string;
    // uniforms?: UniformsData;
    fragmentShaderTemplate: string;
    fragmentShaderContent: string;
    depthFragmentShaderTemplate: string;
    depthFragmentShaderContent: string

    materialArgs: ObjectSpaceRaymarchMaterialArgs;
    // receiveShadow?: boolean;
    // metallic?: number;
    // roughness?: number;
} & MeshOptionsArgs;

// NOTE: 今はbox限定. sphereも対応したい
export class ObjectSpaceRaymarchMesh extends Mesh {
    constructor(args: ObjectSpaceRaymarchMeshArgs) {
        // const { gpu, fragmentShader, depthFragmentShader, uniforms = [], castShadow } = args;
        const { gpu, materialArgs, castShadow, size } = args;
        // const {gpu, castShadow } = args;
        const geometry = new BoxGeometry({ gpu, size });
        
        const fragmentShader = args.fragmentShaderTemplate.replace(PRAGMA_RAYMARCH_SCENE, args.fragmentShaderContent);
        const depthFragmentShader = args.depthFragmentShaderTemplate.replace(PRAGMA_RAYMARCH_SCENE, args.depthFragmentShaderContent);

        // const { fragmentShader, depthFragmentShader, uniforms = [] } = materialArgs;
        const material = new ObjectSpaceRaymarchMaterial({
            // tmp
            // uniforms,
            // // metallic,
            // // roughness,
            // // receiveShadow,
            // // receiveShadow: !!receiveShadow,
            // primitiveType: PrimitiveTypes.Triangles,
            // uniformBlockNames: [
            //     UniformBlockNames.Common
            // ]

            // new
            ...materialArgs,
            // override
            fragmentShader,
            depthFragmentShader,
            primitiveType: PrimitiveTypes.Triangles,
            faceSide: FaceSide.Double,
        });

        // NOTE
        // const material = new GBufferMaterial({
        //     metallic: 0,
        //     roughness: 1,
        //     receiveShadow: true,
        //     isSkinning: false,
        //     gpuSkinning: false,
        //     isInstancing: true,
        //     useInstanceLookDirection: true,
        //     useVertexColor: true,
        //     faceSide: FaceSide.Double,
        //     primitiveType: PrimitiveTypes.Triangles,
        // });

        super({ name: 'ObjectSpaceRaymarchMesh', geometry, material, castShadow });
    }

    update(args: ActorUpdateArgs) {
        super.update(args);

        this.material.uniforms.setValue(UniformNames.ObjectSpaceRaymarchBoundsScale, this.transform.scale);
        this.depthMaterial!.uniforms.setValue(UniformNames.ObjectSpaceRaymarchBoundsScale, this.transform.scale);
    }

    updateMaterial({ camera }: { camera: Camera }) {
        super.updateMaterial({ camera });
        this.mainMaterial.uniforms.setValue('uIsPerspective', camera.isPerspective() ? 1 : 0);
    }

    updateDepthMaterial({ camera }: { camera: Camera }) {
        super.updateMaterial({ camera });
        this.depthMaterial?.uniforms.setValue('uIsPerspective', camera.isPerspective() ? 1 : 0);
    }
}
