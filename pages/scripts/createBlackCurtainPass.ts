import { GPU } from '@/PaleGL/core/GPU';
import colorCoverFragment from '@/PaleGL/shaders/color-cover-fragment.glsl';
import { PostProcessPassParametersBase } from '@/PaleGL/postprocess/PostProcessPassBase';
import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass.ts';

export type BlackCurtainPassParameters = PostProcessPassParametersBase & {
    blendRate: number;
};

export type BlackCurtainPassParametersArgs = Partial<BlackCurtainPassParameters>;

export function createBlackCurtainPass(gpu: GPU) {
    const pass = new FragmentPass({ gpu, fragmentShader: colorCoverFragment });
    return pass;
}
