import { GPU } from '@/PaleGL/core/GPU';
import colorCoverFragment from '@/PaleGL/shaders/color-cover-fragment.glsl';
import { PostProcessPassParametersBase } from '@/PaleGL/postprocess/PostProcessPassBase';
import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass.ts';
import { UniformNames } from '@/PaleGL/constants.ts';

export type BlackCurtainPassParameters = PostProcessPassParametersBase & {
    blendRate: number;
};

export type BlackCurtainPassParametersArgs = Partial<BlackCurtainPassParameters>;

export function createBlackCurtainPass(gpu: GPU): {
    getPass: () => FragmentPass;
    setBlendRate: (rate: number) => void;
} {
    const pass = new FragmentPass({ gpu, fragmentShader: colorCoverFragment });
    return {
        getPass: () => pass,
        setBlendRate: (rate: number) => {
            pass.material.uniforms.setValue(UniformNames.BlendRate, rate);
        },
    };
}
