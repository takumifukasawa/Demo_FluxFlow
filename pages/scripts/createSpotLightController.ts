import { SpotLight } from '@/PaleGL/actors/SpotLight.ts';
import { PerspectiveCamera } from '@/PaleGL/actors/PerspectiveCamera.ts';
import { RenderTarget } from '@/PaleGL/core/RenderTarget.ts';
import { RenderTargetTypes, TextureDepthPrecisionType } from '@/PaleGL/constants.ts';
import { GPU } from '@/PaleGL/core/GPU.ts';

export function createSpotLightController(gpu: GPU, spotLight: SpotLight) {
    if (spotLight.shadowCamera) {
        spotLight.shadowCamera.visibleFrustum = false;
        spotLight.castShadow = true;
        spotLight.shadowCamera.near = 1;
        spotLight.shadowCamera.far = spotLight.distance;
        (spotLight.shadowCamera as PerspectiveCamera).setPerspectiveSize(1); // TODO: いらないかも
        const shadowMapSize = 1024;
        spotLight.shadowMap = new RenderTarget({
            gpu,
            width: shadowMapSize,
            height: shadowMapSize,
            type: RenderTargetTypes.Depth,
            depthPrecision: TextureDepthPrecisionType.High,
        });
    }

    spotLight.onProcessPropertyBinder = (key: string, value: number) => {
        if (key === 'ca') {
            spotLight.coneAngle = value;
            return;
        }
        if (key === 'pa') {
            spotLight.penumbraAngle = value;
            return;
        }
    };
}
