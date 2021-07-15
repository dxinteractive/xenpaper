//
// types
//

export type MoscNote = {
    type: 'NOTE_TIME';
    time: number;
    timeEnd: number;
    hz: number;
    label: string;
};

export type MoscNoteMs = {
    type: 'NOTE_MS';
    ms: number;
    msEnd: number;
    hz: number;
    label: string;
};

export type MoscParam = {
    type: 'PARAM_TIME';
    time: number;
    value: any;
};

export type MoscParamMs = {
    type: 'PARAM_MS';
    ms: number;
    value: any;
};

export type MoscTempo = {
    type: 'TEMPO';
    time: number;
    bpm: number;
    lerp: boolean;
};

export type MoscEnd = {
    type: 'END_TIME';
    time: number;
};

export type MoscEndMs = {
    type: 'END_MS';
    ms: number;
};

export type MoscItem = MoscNote|MoscTempo|MoscParam|MoscEnd;

export type MoscScore = {
    sequence: MoscItem[];
    lengthTime: number;
};

export type MoscItemMs = MoscNoteMs|MoscParamMs|MoscEndMs;

export type MoscScoreMs = {
    sequence: MoscItemMs[];
    lengthMs: number;
};

//
// utils
//

export const centsToRatio = (cents: number, octave: number = 0): number => {
    return octaveDivisionToRatio(cents, 1200, 2, octave);
};

export const octaveDivisionToRatio = (steps: number, stepsInOctave: number, octaveSize: number, octave: number = 0): number => {
    return Math.pow(octaveSize, (steps + (octave * stepsInOctave)) / stepsInOctave);
};

export const ratioToCents = (ratio: number, octave: number = 0): number => {
    return ratioToOctaveDivision(ratio, 1200, 2, octave);
};

export const ratioToOctaveDivision = (ratio: number, stepsInOctave: number, octaveSize: number, octave: number = 0): number => {
    return (Math.log(ratio) / Math.log(octaveSize) * stepsInOctave) - (octave * stepsInOctave);
};

export const sortByTime = <T extends {time: number}>(items: T[]): T[] => {
    return items.slice().sort((a, b) => {
        if(a.time < b.time) return -1;
        if(a.time > b.time) return 1;
        return 0;
    });
};

export const sortByMs = (items: Array<MoscNoteMs>): Array<MoscNoteMs> => {
    return items.slice().sort((a, b) => {
        if(a.ms < b.ms) return -1;
        if(a.ms > b.ms) return 1;
        return 0;
    });
};

//
// time-based to ms-based conversion
//

const tempoTimeToMs = (bpm1: number, bpm2: number, duration: number): number => {
    let u = bpm1 / 60;
    let v = bpm2 / 60;
    let s = duration;
    if(u === v) return s / v * 1000;
    return 2 * s * (v - u) / (v * v - u * u) * 1000;
};

type TempoChange = {
    bpm: number;
    bpmEnd: number;
    time: number;
    ms: number;
};

const findTempoRangeForTime = (tempoChanges: TempoChange[], time: number): TempoChange => {
    for(let i = tempoChanges.length - 1; i >= 0; i--) {
        if(time >= tempoChanges[i].time) {
            return tempoChanges[i];
        }
    }
    return tempoChanges[0];
};

export const timeToMs = (items: MoscItem[]): ((time: number) => number) => {

    const tempoChanges: TempoChange[] = [];
    tempoChanges.push({
        bpm: 60,
        bpmEnd: 60,
        time: 0,
        ms: 0
    });

    const tempoItems: MoscTempo[] = items.filter((item: MoscItem): item is MoscTempo => item.type === 'TEMPO');

    sortByTime(tempoItems).forEach((tempo: MoscTempo, index: number, all: MoscTempo[]) => {
        const lastChange = tempoChanges[tempoChanges.length - 1] as TempoChange;
        const nextTempo: MoscTempo|undefined = all[index + 1];

        const ms = tempoTimeToMs(lastChange.bpm, lastChange.bpmEnd, tempo.time - lastChange.time) + lastChange.ms;
        const bpmEnd = (nextTempo && nextTempo.lerp) ? nextTempo.bpm : tempo.bpm;

        tempoChanges.push({
            bpm: tempo.bpm,
            bpmEnd,
            time: tempo.time,
            ms
        });
    });

    return (time: number): number => {
        const tempoChange: TempoChange = findTempoRangeForTime(tempoChanges, time);
        return tempoTimeToMs(tempoChange.bpm, tempoChange.bpmEnd, time - tempoChange.time) + tempoChange.ms;
    };
};

export const scoreToMs = (score: MoscScore): MoscScoreMs => {
    const thisTimeToMs = timeToMs(score.sequence);

    const sequence: MoscItemMs[] = sortByTime(score.sequence)
        .map((item: MoscItem): MoscItemMs|undefined => {
            if(item.type === 'NOTE_TIME') {
                const note = item as MoscNote;
                return {
                    type: 'NOTE_MS',
                    hz: note.hz,
                    label: note.label,
                    ms: thisTimeToMs(note.time),
                    msEnd: thisTimeToMs(note.timeEnd)
                };
            }
            if(item.type === 'PARAM_TIME') {
                const param = item as MoscParam;
                return {
                    type: 'PARAM_MS',
                    value: param.value,
                    ms: thisTimeToMs(param.time)
                };
            }
            if(item.type === 'END_TIME') {
                const end = item as MoscEnd;
                return {
                    type: 'END_MS',
                    ms: thisTimeToMs(end.time)
                };
            }
            return undefined;
        })
        .filter((item): item is MoscItemMs => !!item);

    return {
        sequence,
        lengthMs: thisTimeToMs(score.lengthTime)
    };
};

//
// soud engine base class
//

type SoundEngineEndEventCallback = () => void;
type SoundEngineNoteEventCallback = (noteMs: MoscNoteMs, on: boolean) => void;
type SoundEngineEventCallbackCancel = () => void;

export class SoundEngine {

    scoreMs?: MoscScoreMs;

    playing(): boolean {
        return false;
    }

    looping(): boolean {
        return false;
    }

    position(): number {
        return 0;
    }

    endPosition(): number {
        return 0;
    }

    async play(): Promise<void> {}

    async pause(): Promise<void> {}

    async gotoMs(ms: number): Promise<void> {}

    setLoop(loop: boolean, startMs: number = 0, endMs: number = 0): void {}
    setLoopActive(loop: boolean): void {}
    setLoopStart(ms: number = 0): void {}
    setLoopEnd(ms: number = 0): void {}

    async setScore(scoreMs: MoscScoreMs): Promise<void> {}

    // events

    events = {
        end: new Set<SoundEngineEndEventCallback>(),
        note: new Set<SoundEngineNoteEventCallback>()
    };

    _triggerEvent(type: string, ...params: any) {
        // @ts-ignore
        this.events[type].forEach(cb => cb(...params));
    }

    onEnd(callback: SoundEngineEndEventCallback): SoundEngineEventCallbackCancel {
        this.events.end.add(callback);
        return () => {
            this.events.end.delete(callback);
        };
    }

    onNote(callback: SoundEngineNoteEventCallback): SoundEngineEventCallbackCancel {
        this.events.note.add(callback);
        return () => {
            this.events.note.delete(callback);
        };
    }
}
