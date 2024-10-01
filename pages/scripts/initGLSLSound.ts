import {createGLSLSound, GLSLSound} from '@/PaleGL/core/GLSLSound.ts';
import {GPU} from '@/PaleGL/core/GPU.ts';

export function initGLSLSound(gpu: GPU, shader: string, duration: number) {
    let glslSound: GLSLSound | null = null;

    const load = () => {
        glslSound = createGLSLSound(gpu, shader, duration);
    };

    // const warmup = () => {
    //     glslSound?.setVolume(0);
    //     glslSound?.play(0);
    // };

    const play = ({volume = 1, reload = false} : { volume?: number, reload?: boolean } = {}) => {
        if(reload) {
            stop();
            // 120BPM x 64measure = 128sec
            // 120BPM x 72measure = 144sec
            load();
        }
        glslSound?.setVolume(volume);
        glslSound?.play(0);
    };

    const stop = () => {
        glslSound?.stop();
    };

    return {
        glslSound,
        load,
        play,
        stop,
        // warmup,
    };
}
