import { GPU } from '@/PaleGL/core/GPU.ts';
import { UniformNames } from '@/PaleGL/constants.ts';
import { Mesh, MeshOptionsArgs } from '@/PaleGL/actors/Mesh.ts';
// import { UniformsData } from '@/PaleGL/core/Uniforms.ts';
import {
    createObjectSpaceRaymarchMaterial,
    ObjectSpaceRaymarchMaterial,
    ObjectSpaceRaymarchMaterialArgs,
} from '@/PaleGL/materials/ObjectSpaceRaymarchMaterial.ts';
import { BoxGeometry } from '@/PaleGL/geometries/BoxGeometry.ts';
import { Camera } from '@/PaleGL/actors/Camera.ts';
import { ActorUpdateArgs } from '@/PaleGL/actors/Actor.ts';
// import {GBufferMaterial} from "@/PaleGL/materials/GBufferMaterial.ts";

const UNIFORM_NAME_PERSPECTIVE_FLAG = 'uIsPerspective';

type ObjectSpaceRaymarchMeshArgs = {
    name?: string;
    gpu: GPU;
    size?: number;
    // fragmentShader: string;
    // depthFragmentShader: string;
    // uniforms?: UniformsData;

    // 1: materialを渡す場合
    materials?: ObjectSpaceRaymarchMaterial[];

    // 2: templateとcontentを渡す場合
    fragmentShaderTemplate?: string;
    fragmentShaderContent?: string;
    depthFragmentShaderTemplate?: string;
    depthFragmentShaderContent?: string;
    materialArgs?: ObjectSpaceRaymarchMaterialArgs;
} & MeshOptionsArgs;

// NOTE: 今はbox限定. sphereも対応したい
export class ObjectSpaceRaymarchMesh extends Mesh {
    constructor(args: ObjectSpaceRaymarchMeshArgs) {
        // const { gpu, fragmentShader, depthFragmentShader, uniforms = [], castShadow } = args;
        const { gpu, name, materialArgs, castShadow, size } = args;
        // const {gpu, castShadow } = args;
        const geometry = new BoxGeometry({ gpu, size });

        // const fragmentShader = (args.fragmentShaderTemplate || litObjectSpaceRaymarchFragmentTemplate).replace(
        //     PRAGMA_RAYMARCH_SCENE,
        //     args.fragmentShaderContent
        // );
        // const depthFragmentShader = (
        //     args.depthFragmentShaderTemplate || gbufferObjectSpaceRaymarchDepthFragmentTemplate
        // ).replace(PRAGMA_RAYMARCH_SCENE, args.depthFragmentShaderContent);

        const materials = args.materials
            ? args.materials
            : [
                  createObjectSpaceRaymarchMaterial({
                      fragmentShaderContent: args.fragmentShaderContent!,
                      depthFragmentShaderContent: args.depthFragmentShaderContent!,
                      materialArgs: materialArgs!,
                  }),
              ];

        // const material = createObjectSpaceRaymarchMaterial({
        //     fragmentShader,
        //     depthFragmentShader,
        //     materialArgs
        // });

        // // const { fragmentShader, depthFragmentShader, uniforms = [] } = materialArgs;
        // const material = new ObjectSpaceRaymarchMaterial({
        //     // tmp
        //     // uniforms,
        //     // // metallic,
        //     // // roughness,
        //     // // receiveShadow,
        //     // // receiveShadow: !!receiveShadow,
        //     // primitiveType: PrimitiveTypes.Triangles,
        //     // uniformBlockNames: [
        //     //     UniformBlockNames.Common
        //     // ]

        //     // new
        //     ...materialArgs,
        //     // override
        //     fragmentShader,
        //     depthFragmentShader,
        //     primitiveType: PrimitiveTypes.Triangles,
        //     faceSide: FaceSide.Double,
        // });

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

        super({ name, geometry, materials, castShadow });
    }

    update(args: ActorUpdateArgs) {
        super.update(args);

        this.materials.forEach((material) => {
            material.uniforms.setValue(UniformNames.ObjectSpaceRaymarchBoundsScale, this.transform.scale);
        });
        this.depthMaterials.forEach((material) => {
            material.uniforms.setValue(UniformNames.ObjectSpaceRaymarchBoundsScale, this.transform.scale);
        });
    }

    updateMaterial({ camera }: { camera: Camera }) {
        super.updateMaterial({ camera });
        this.materials.forEach((material) => {
            material.uniforms.setValue(UNIFORM_NAME_PERSPECTIVE_FLAG, camera.isPerspective() ? 1 : 0);
        });
    }

    updateDepthMaterial({ camera }: { camera: Camera }) {
        super.updateMaterial({ camera });
        this.depthMaterials.forEach((material) => {
            material.uniforms.setValue(UNIFORM_NAME_PERSPECTIVE_FLAG, camera.isPerspective() ? 1 : 0);
        });
    }
}
