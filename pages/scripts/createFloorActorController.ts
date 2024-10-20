import { Mesh } from '@/PaleGL/actors/Mesh.ts';
import { GBufferMaterial } from '@/PaleGL/materials/GBufferMaterial.ts';
import { Vector4 } from '@/PaleGL/math/Vector4.ts';
import { Texture } from '@/PaleGL/core/Texture.ts';

export function createFloorActorController(mesh: Mesh, surfaceMap: Texture) {
    const mat = mesh.mainMaterial as GBufferMaterial;
    const tiling = new Vector4(20, 20, 0, 0);
    mat.metallicMap = surfaceMap;
    mat.metallicMapTiling = tiling;
    mat.roughnessMap = surfaceMap;
    mat.roughnessMapTiling = tiling;
}
