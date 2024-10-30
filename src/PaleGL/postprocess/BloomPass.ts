import { PostProcessPassType, RenderTargetTypes, UniformNames, UniformTypes } from '@/PaleGL/constants';
import { IPostProcessPass } from '@/PaleGL/postprocess/IPostProcessPass';
import { FragmentPass } from '@/PaleGL/postprocess/FragmentPass';
// import { gaussianBlurFragmentShader } from '@/PaleGL/shaders/gaussianBlurShader';
import { RenderTarget } from '@/PaleGL/core/RenderTarget';
// import {CopyPass} from "./CopyPass";
import { Material } from '@/PaleGL/materials/Material';
import { getGaussianBlurWeights } from '@/PaleGL/utilities/gaussialBlurUtilities';
import { PlaneGeometry } from '@/PaleGL/geometries/PlaneGeometry';
import { GPU } from '@/PaleGL/core/GPU';
import { Camera } from '@/PaleGL/actors/Camera';
import { Renderer } from '@/PaleGL/core/Renderer';
import gaussianBlurFragmentShader from '@/PaleGL/shaders/gaussian-blur-fragment.glsl';
import extractBrightnessFragmentShader from '@/PaleGL/shaders/extract-brightness-fragment.glsl';
import bloomCompositeFragmentShader from '@/PaleGL/shaders/bloom-composite-fragment.glsl';
import {
    PostProcessPassBase,
    PostProcessPassParametersBase,
    PostProcessPassRenderArgs,
    // IPostProcessPassParameters
} from '@/PaleGL/postprocess/PostProcessPassBase.ts';

const BLUR_PIXEL_NUM = 7;

const UNIFORM_NAME_BLUR_WEIGHTS = 'uBlurWeights';
const UNIFORM_NAME_IS_HORIZONTAL = 'uIsHorizontal';

type BloomPassParametersBase = {
    threshold: number;
    tone: number;
    bloomAmount: number;
};

type BloomPassParametersProperties = 
    PostProcessPassParametersBase &
    BloomPassParametersBase;

export type BloomPassParameters =
    // BloomPassParametersProperties &
    BloomPassParametersProperties
    // Required<IPostProcessPassParameters<BloomPassParameters>>; // override

type BloomPassParametersArgs = Partial<BloomPassParameters>;

export function overrideBloomPassParameters(
    base: BloomPassParameters,
    override: BloomPassParametersArgs
): BloomPassParameters {
    return {
        ...base,
        enabled: override.enabled ?? base.enabled,
        threshold: override.threshold ?? base.threshold,
        tone: override.tone ?? base.tone,
        bloomAmount: override.bloomAmount ?? base.bloomAmount,
    };
}

export function generateDefaultBloomPassParameters({
    enabled,
    threshold,
    tone,
    bloomAmount,
}: BloomPassParametersArgs = {}): BloomPassParameters {
    const param = {
        enabled: enabled ?? true,
        threshold: threshold ?? 1.534,
        tone: tone ?? 0.46,
        bloomAmount: bloomAmount ?? 0.26,
        // update: (newParam: BloomPassParameters) => {
        //     param.enabled = newParam.enabled ?? param.enabled;
        //     param.threshold = newParam.threshold ?? param.threshold;
        //     param.tone = newParam.tone ?? param.tone;
        //     param.bloomAmount = newParam.bloomAmount ?? param.bloomAmount;
        // },
        // updateKey: (key: keyof BloomPassParametersProperties, value: BloomPassParametersProperties[keyof BloomPassParametersProperties]) => {
        //     param[key] = value;
        // },
    } as BloomPassParameters;
    return param;
}

// export function overrideBloomPassParameters(
//     base: BloomPassParameters,
//     override: BloomPassParametersArgs
// ): BloomPassParameters {
//     return {
//         ...base,
//         enabled: override.enabled ?? base.enabled,
//         threshold: override.threshold ?? base.threshold,
//         tone: override.tone ?? base.tone,
//         bloomAmount: override.bloomAmount ?? base.bloomAmount,
//     };
// }

// ref: https://techblog.kayac.com/unity-light-weight-bloom-effect
// TODO: mipmap使う方法に変えてみる
// export class BloomPass extends AbstractPostProcessPass {
export class BloomPass implements IPostProcessPass {
    // gpu: GPU;
    name: string = 'BloomPass';
    type: PostProcessPassType = PostProcessPassType.Bloom;
    
    width: number = 1;
    height: number = 1;

    materials: Material[] = [];

    _extractBrightnessPass: FragmentPass;

    parameters: BloomPassParameters;

    // enabled: boolean = true;
    // threshold: number = 1.534;
    // tone: number = 0.46;
    // bloomAmount: number = 0.26;

    // tmp
    // private renderTargetExtractBrightness: RenderTarget;
    _renderTargetBlurMip4_Horizontal: RenderTarget;
    _renderTargetBlurMip4_Vertical: RenderTarget;
    _renderTargetBlurMip8_Horizontal: RenderTarget;
    _renderTargetBlurMip8_Vertical: RenderTarget;
    _renderTargetBlurMip16_Horizontal: RenderTarget;
    _renderTargetBlurMip16_Vertical: RenderTarget;
    _renderTargetBlurMip32_Horizontal: RenderTarget;
    _renderTargetBlurMip32_Vertical: RenderTarget;
    _renderTargetBlurMip64_Horizontal: RenderTarget;
    _renderTargetBlurMip64_Vertical: RenderTarget;

    get renderTargetBlurMip4() {
        return this._renderTargetBlurMip4_Vertical;
    }

    get renderTargetBlurMip8() {
        return this._renderTargetBlurMip8_Vertical;
    }

    get renderTargetBlurMip16() {
        return this._renderTargetBlurMip16_Vertical;
    }

    get renderTargetBlurMip32() {
        return this._renderTargetBlurMip32_Vertical;
    }

    get renderTargetBlurMip64() {
        return this._renderTargetBlurMip64_Vertical;
    }

    // tmp
    // private horizontalBlurPass: FragmentPass;
    // private verticalBlurPass: FragmentPass;

    // #lastPass;
    _compositePass: FragmentPass;
    _geometry: PlaneGeometry;
    _horizontalBlurMaterial: Material;
    _verticalBlurMaterial: Material;

    get renderTarget() {
        return this._compositePass.renderTarget;
    }

    constructor({
        gpu,
        parameters, // threshold = 0,
    } // tone = 1,
    // bloomAmount = 1,
    : {
        gpu: GPU;
        parameters?: BloomPassParametersArgs;
        // threshold?: number;
        // tone?: number;
        // bloomAmount?: number;
    }) {
        // this.threshold = threshold;
        // this.tone = tone;
        // this.bloomAmount = bloomAmount;

        this.parameters = generateDefaultBloomPassParameters(parameters);

        // NOTE: _geometryは親から渡して使いまわしてもよい
        this._geometry = new PlaneGeometry({ gpu });

        // tmp
        // this.renderTargetExtractBrightness = new RenderTarget({gpu});
        this._renderTargetBlurMip4_Horizontal = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this._renderTargetBlurMip4_Vertical = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this._renderTargetBlurMip8_Horizontal = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this._renderTargetBlurMip8_Vertical = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this._renderTargetBlurMip16_Horizontal = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this._renderTargetBlurMip16_Vertical = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this._renderTargetBlurMip32_Horizontal = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this._renderTargetBlurMip32_Vertical = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this._renderTargetBlurMip64_Horizontal = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });
        this._renderTargetBlurMip64_Vertical = new RenderTarget({
            gpu,
            type: RenderTargetTypes.R11F_G11F_B10F,
            // type: RenderTargetTypes.RGBA
        });

        // const copyPass = new CopyPass({ gpu });
        // this.#passes.push(copyPass);

        this._extractBrightnessPass = new FragmentPass({
            gpu,
            fragmentShader: extractBrightnessFragmentShader,
            uniforms: [
                {
                    name: 'uThreshold',
                    type: UniformTypes.Float,
                    value: this.parameters.threshold,
                },
            ],
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            // renderTargetType: RenderTargetTypes.RGBA
        });
        this.materials.push(...this._extractBrightnessPass.materials);

        // const blurWeights = getGaussianBlurWeights(BLUR_PIXEL_NUM, Math.floor(BLUR_PIXEL_NUM / 2));
        const blurWeights = getGaussianBlurWeights(BLUR_PIXEL_NUM, 0.92);
        console.log('blurWeights', blurWeights);

        this._horizontalBlurMaterial = new Material({
            vertexShader: PostProcessPassBase.baseVertexShader,
            fragmentShader: gaussianBlurFragmentShader,
            uniforms: [
                {
                    name: UniformNames.SrcTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_BLUR_WEIGHTS,
                    type: UniformTypes.FloatArray,
                    value: new Float32Array(blurWeights),
                },
                {
                    name: UNIFORM_NAME_IS_HORIZONTAL,
                    type: UniformTypes.Float,
                    value: 1,
                },
                ...PostProcessPassBase.commonUniforms,
            ],
        });
        this.materials.push(this._horizontalBlurMaterial);

        this._verticalBlurMaterial = new Material({
            vertexShader: PostProcessPassBase.baseVertexShader,
            fragmentShader: gaussianBlurFragmentShader,
            uniforms: [
                {
                    name: UniformNames.SrcTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: UNIFORM_NAME_BLUR_WEIGHTS,
                    type: UniformTypes.FloatArray,
                    value: new Float32Array(blurWeights),
                },
                {
                    name: UNIFORM_NAME_IS_HORIZONTAL,
                    type: UniformTypes.Float,
                    value: 0,
                },
                ...PostProcessPassBase.commonUniforms,
            ],
        });
        this.materials.push(this._verticalBlurMaterial);

        this._compositePass = new FragmentPass({
            gpu,
            fragmentShader: bloomCompositeFragmentShader,
            uniforms: [
                {
                    name: UniformNames.SrcTexture,
                    type: UniformTypes.Texture,
                    value: null,
                },
                // uBrightnessTexture: {
                //     type: UniformTypes.Texture,
                //     value: null,
                // },
                {
                    name: 'uBlur4Texture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uBlur8Texture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uBlur16Texture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uBlur32Texture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                {
                    name: 'uTone',
                    type: UniformTypes.Float,
                    value: this.parameters.tone,
                },
                {
                    name: 'uBloomAmount',
                    type: UniformTypes.Float,
                    value: this.parameters.bloomAmount,
                },
                {
                    name: 'uExtractTexture',
                    type: UniformTypes.Texture,
                    value: null,
                },
                ...PostProcessPassBase.commonUniforms,
            ],
            renderTargetType: RenderTargetTypes.R11F_G11F_B10F,
            // renderTargetType: RenderTargetTypes.RGBA
        });
        this.materials.push(...this._compositePass.materials);
    }

    setSize(width: number, height: number) {
        this.width = width;
        this.height = height;

        this._extractBrightnessPass.setSize(width, height);

        this._renderTargetBlurMip4_Horizontal.setSize(this.width / 4, this.height / 4);
        this._renderTargetBlurMip4_Vertical.setSize(this.width / 4, this.height / 4);
        this._renderTargetBlurMip8_Horizontal.setSize(this.width / 8, this.height / 8);
        this._renderTargetBlurMip8_Vertical.setSize(this.width / 8, this.height / 8);
        this._renderTargetBlurMip16_Horizontal.setSize(this.width / 16, this.height / 16);
        this._renderTargetBlurMip16_Vertical.setSize(this.width / 16, this.height / 16);
        this._renderTargetBlurMip32_Horizontal.setSize(this.width / 32, this.height / 32);
        this._renderTargetBlurMip32_Vertical.setSize(this.width / 32, this.height / 32);
        this._renderTargetBlurMip64_Horizontal.setSize(this.width / 64, this.height / 64);
        this._renderTargetBlurMip64_Vertical.setSize(this.width / 64, this.height / 64);

        this._compositePass.setSize(width, height);
    }

    // TODO: 空メソッド書かなくていいようにしたい
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setRenderTarget(renderer: Renderer, camera: Camera, isLastPass: boolean) {}

    update() {}

    $renderBlur (
        renderer: Renderer,
        horizontalRenderTarget: RenderTarget,
        verticalRenderTarget: RenderTarget,
        beforeRenderTarget: RenderTarget,
        downSize: number
    ) {
        const w = this.width / downSize;
        const h = this.height / downSize;

        renderer.setRenderTarget(horizontalRenderTarget, true);
        // renderer.clearColor(0, 0, 0, 1);
        this._horizontalBlurMaterial.uniforms.setValue(
            UniformNames.SrcTexture,
            // this._extractBrightnessPass.renderTarget.texture
            beforeRenderTarget.$getTexture()
        );
        this._horizontalBlurMaterial.uniforms.setValue(UniformNames.TargetWidth, w);
        this._horizontalBlurMaterial.uniforms.setValue(UniformNames.TargetHeight, w);
        renderer.renderMesh(this._geometry, this._horizontalBlurMaterial);

        renderer.setRenderTarget(verticalRenderTarget, true);
        // renderer.clearColor(0, 0, 0, 1);
        this._verticalBlurMaterial.uniforms.setValue(UniformNames.SrcTexture, horizontalRenderTarget.$getTexture());
        this._verticalBlurMaterial.uniforms.setValue(UniformNames.TargetWidth, w);
        this._verticalBlurMaterial.uniforms.setValue(UniformNames.TargetHeight, h);
        renderer.renderMesh(this._geometry, this._verticalBlurMaterial);
    };


    render({
        gpu,
        camera,
        renderer,
        prevRenderTarget,
        isLastPass,
        gBufferRenderTargets,
        targetCamera,
        time,
    }: PostProcessPassRenderArgs) {
        // 一回だけ呼びたい
        this._geometry.start();
        // ppの場合はいらない気がする
        // this.mesh.updateTransform();

        if (!this._horizontalBlurMaterial.isCompiledShader) {
            this._horizontalBlurMaterial.start({ gpu, attributeDescriptors: this._geometry.getAttributeDescriptors() });
        }
        if (!this._verticalBlurMaterial.isCompiledShader) {
            this._verticalBlurMaterial.start({ gpu, attributeDescriptors: this._geometry.getAttributeDescriptors() });
        }

        this.assignParameters();

        // this._extractBrightnessPass.material.uniforms.setValue('uThreshold', this.parameters.threshold);
        this._extractBrightnessPass.render({
            gpu,
            camera,
            renderer,
            prevRenderTarget,
            isLastPass: false,
            targetCamera,
            time,
        });

        // 1 / 4
        this.$renderBlur(
            renderer,
            this._renderTargetBlurMip4_Horizontal,
            this._renderTargetBlurMip4_Vertical,
            this._extractBrightnessPass.renderTarget,
            4
        );
        // 1 / 8
        this.$renderBlur(
            renderer,
            this._renderTargetBlurMip8_Horizontal,
            this._renderTargetBlurMip8_Vertical,
            this._renderTargetBlurMip4_Vertical,
            8
        );
        // 1 / 16
        this.$renderBlur(
            renderer,
            this._renderTargetBlurMip16_Horizontal,
            this._renderTargetBlurMip16_Vertical,
            this._renderTargetBlurMip8_Vertical,
            16
        );
        // 1 / 32
        this.$renderBlur(
            renderer,
            this._renderTargetBlurMip32_Horizontal,
            this._renderTargetBlurMip32_Vertical,
            this._renderTargetBlurMip16_Vertical,
            32
        );
        // 1 / 64
        this.$renderBlur(
            renderer,
            this._renderTargetBlurMip64_Horizontal,
            this._renderTargetBlurMip64_Vertical,
            this._renderTargetBlurMip32_Vertical,
            64
        );

        if (prevRenderTarget) {
            this._compositePass.material.uniforms.setValue(UniformNames.SrcTexture, prevRenderTarget.$getTexture());
        } else {
            console.error('invalid prev render target');
        }
        // this._compositePass.material.uniforms.setValue('uBrightnessTexture', this._extractBrightnessPass.renderTarget.$getTexture());
        this._compositePass.material.uniforms.setValue('uBlur4Texture', this._renderTargetBlurMip4_Vertical.$getTexture());
        this._compositePass.material.uniforms.setValue('uBlur8Texture', this._renderTargetBlurMip8_Vertical.$getTexture());
        this._compositePass.material.uniforms.setValue('uBlur16Texture', this._renderTargetBlurMip16_Vertical.$getTexture());
        this._compositePass.material.uniforms.setValue('uBlur32Texture', this._renderTargetBlurMip32_Vertical.$getTexture());
        this._compositePass.material.uniforms.setValue('uBlur64Texture', this._renderTargetBlurMip64_Vertical.$getTexture());
        this._compositePass.material.uniforms.setValue(
            'uExtractTexture',
            this._extractBrightnessPass.renderTarget.$getTexture()
        );
        
        // this._compositePass.material.uniforms.setValue('uTone', this.parameters.tone);
        // this._compositePass.material.uniforms.setValue('uBloomAmount', this.parameters.bloomAmount);

        this._compositePass.render({
            gpu,
            camera,
            renderer,
            prevRenderTarget: null,
            isLastPass,
            targetCamera,
            gBufferRenderTargets,
            time,
        });
    }

    updateParameters(parameters: BloomPassParameters) {
        this.parameters = overrideBloomPassParameters(this.parameters, parameters);
        // this.parameters.update(parameters);
        this.assignParameters();
    }
    
    assignParameters() {
        this._extractBrightnessPass.material.uniforms.setValue('uThreshold', this.parameters.threshold);
        this._compositePass.material.uniforms.setValue('uTone', this.parameters.tone);
        this._compositePass.material.uniforms.setValue('uBloomAmount', this.parameters.bloomAmount);
    }
}
