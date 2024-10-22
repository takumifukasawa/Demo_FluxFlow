export const isTimeInClip = (time: number, startTime: number, endTime: number) => {
    return startTime <= time && time < endTime;
};

export const buildTimelinePropertyX = (key: string) => {
    return `${key}.x`;
};

export const buildTimelinePropertyY = (key: string) => {
    return `${key}.y`;
};

export const buildTimelinePropertyZ = (key: string) => {
    return `${key}.z`;
};

export const buildTimelinePropertyR = (key: string) => {
    return `${key}.r`;
};

export const buildTimelinePropertyG = (key: string) => {
    return `${key}.g`;
};

export const buildTimelinePropertyB = (key: string) => {
    return `${key}.b`;
};

export const buildTimelinePropertyA = (key: string) => {
    return `${key}.a`;
};
