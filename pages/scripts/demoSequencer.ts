import { isTimeInClip } from '@/Marionetter/timelineUtilities.ts';
import {saturate} from "@/PaleGL/utilities/mathUtilities.ts";

export const SOUND_DURATION = 144;

export const SEQUENCER_DURATION = 144;

const phaseDuration = 16;

const phase1BeginTime = 0;
const phase2BeginTime = 16;

export const PhaseType = {
    Intro: 0, // 0~8 : [0~16sec]
    MelodyA1: 1, // 8~16 : [16~32sec]
    MelodyA2: 2, // 16~24 : [32~48sec]
    MelodyA3: 3, // 24~32 : [48~64sec]
    MelodyB1: 4, // 32~40 : [64~80sec]
    MelodyB2: 5, // 40~48 : [80~96sec]
    Hook1: 6, // 48~56 : [96~112sec]
    Hook2: 7, // 56~64 : [112~128sec]
    Outro: 8 // 64~72 : [128~144sec]
} as const;

export const isSequencePhase1 = (time: number) => isTimeInClip(time, phase1BeginTime, phase1BeginTime + phaseDuration);
export const isSequencePhase2 = (time: number) => isTimeInClip(time, phase2BeginTime, phase2BeginTime + phaseDuration);

export const phase1NormalizedRate = (time: number) => {
    if (isSequencePhase1(time)) {
        return saturate((time - phase1BeginTime) / phaseDuration);
    }
    return -1;
};

export const phase2NormalizedRate = (time: number) => {
    if (isSequencePhase2(time)) {
        return saturate((time - phase2BeginTime) / phaseDuration);
    }
    return -1;
};
