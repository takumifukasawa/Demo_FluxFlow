import { GPU } from '@/PaleGL/core/GPU.ts';
import { DirectionalLight } from '@/PaleGL/actors/DirectionalLight.ts';
import { OrthographicCamera } from '@/PaleGL/actors/OrthographicCamera.ts';
import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { RenderTargetTypes } from '@/PaleGL/constants.ts';

export function createDirectionalLightController(gpu: GPU, directionalLight: DirectionalLight) {
    // TODO: directional light は constructor で shadow camera を生成してるのでこのガードいらない
    if (directionalLight && directionalLight.shadowCamera) {
        directionalLight.shadowCamera.visibleFrustum = false;
        directionalLight.castShadow = true;
        directionalLight.shadowCamera.near = 1;
        directionalLight.shadowCamera.far = 40;
        const size = 12.5;
        (directionalLight.shadowCamera as OrthographicCamera).setOrthoSize(null, null, -size, size, -size, size);
        directionalLight.shadowMap = new RenderTarget({
            gpu,
            width: 1024,
            height: 1024,
            type: RenderTargetTypes.Depth,
        });
    }
}
