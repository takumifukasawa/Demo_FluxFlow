
export const isTimeInClip = (time: number, startTime: number, endTime: number) => {
    return startTime <= time && time < endTime;
}
