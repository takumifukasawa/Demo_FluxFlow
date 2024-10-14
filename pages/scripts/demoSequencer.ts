import { isTimeInClip } from '@/Marionetter/timelineUtilities.ts';
import {saturate} from "@/PaleGL/utilities/mathUtilities.ts";

export const SOUND_DURATION = 128;

export const SEQUENCER_DURATION = 128;

const phaseDuration = 16;

const phase1BeginTime = 0;
const phase2BeginTime = 16;

export const PhaseType = {
    Intro: 0,
    MelodyA: 1,
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
