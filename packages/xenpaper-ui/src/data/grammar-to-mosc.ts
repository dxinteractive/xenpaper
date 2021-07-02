import type {
    XenpaperAST,
    SetScaleType,
    NoteType,
    ChordType,
    RatioChordType,
    TailType,
    PitchType,
    PitchRatioType,
    PitchCentsType,
    PitchHzType,
    PitchOctaveDivisionType,
    PitchDegreeType,
    PitchGroupScaleType,
    EdoScaleType,
    RatioChordScaleType,
    RatioChordPitchType,
    HoldType,
    RestType,
    SetterGroupType,
    SetterType,
    SetSubdivisionType,
    SetBpmType,
    SetBmsType,
    SetRootType,
    SetOscType,
    SetEnvType,
    DelimiterType
} from './grammar';

import type {
    MoscScore,
    MoscItem,
    MoscNote,
    MoscTempo,
    MoscParam,
    MoscEnd
} from '@xenpaper/mosc';

import {
    centsToRatio,
    octaveDivisionToRatio,
    timeToMs
} from '@xenpaper/mosc';

//
// utils
//

const flatMap = <I,O>(arr: I[], mapper: (item: I) => O[]): O[] => {
    const out: O[] = [];
    arr.forEach(item => out.push(...mapper(item)));
    return out;
};

const limit = (name: string, value: number, min: number, max: number): void => {
    if(value < min || value > max) {
        throw new Error(`${name} must be between ${min} and ${max}, got ${value}`);
    }
};

//
// pitch math
//

export const pitchToRatio = (pitch: PitchType, scale: number[], octaveSize: number): number => {
    limit('Octave size', octaveSize, -20, 20);

    const {type} = pitch.value;
    const octaveMulti = Math.pow(octaveSize, pitch?.octave?.octave || 0);

    if(type === 'PitchRatio') {
        const {numerator, denominator} = pitch.value as PitchRatioType;
        const ratio = numerator / denominator;
        limit('Pitch ratio', ratio, 0, 100);
        return ratio * octaveMulti;
    }

    if(type === 'PitchCents') {
        const {cents} = pitch.value as PitchCentsType;
        limit('Cents', cents, -12000, 12000);
        return centsToRatio(cents) * octaveMulti;
    }

    if(type === 'PitchOctaveDivision') {
        const {numerator, denominator, octaveSize} = pitch.value as PitchOctaveDivisionType;
        return octaveDivisionToRatio(numerator, denominator, octaveSize) * octaveMulti;
    }

    if(type === 'PitchDegree') {
        const {degree} = pitch.value as PitchDegreeType;
        return pitchDegreeToRatio(degree, scale, octaveSize) * octaveMulti;
    }

    throw new Error(`Unknown pitch type "${type}"`);
};

const edoToRatios = (edoSize: number, octaveSize: number): number[] => {
    const ratios: number[] = [];
    for(let i = 0; i < edoSize; i++) {
        ratios.push(octaveDivisionToRatio(i, edoSize, octaveSize));
    }
    return ratios;
};

const pitchDegreeWrap = (degree: number, scale: number[]): [number, number] => {
    limit('Scale degree', degree, -1000, 1000);

    const steps = scale.length;
    let octave = 0;

    while(degree >= steps && octave > -20) {
        degree -= steps;
        octave++;
    }
    while(degree < 0 && octave < 20) {
        degree += steps;
        octave--;
    }

    return [degree, octave];
};

const pitchDegreeToRatio = (degree: number, scale: number[], octaveSize: number): number => {
    limit('Octave size', octaveSize, -20, 20);

    if(scale.length === 0) {
        return 1;
    }

    const [wrappedDegree, octave] = pitchDegreeWrap(degree, scale);
    return scale[wrappedDegree] * Math.pow(octaveSize, octave);
};

const pitchToHz = (pitch: PitchType, context: Context): number => {
    if(pitch.value.type === 'PitchHz') {
        const octaveMulti = Math.pow(context.octaveSize, pitch?.octave?.octave || 0);
        const hz = (pitch.value as PitchHzType).hz * octaveMulti;
        limit('Hz', hz, 0, 20000);
        return hz;
    }
    return pitchToRatio(pitch, context.scale, context.octaveSize) * context.rootHz;
};

const tailToTime = (tail: TailType|undefined, context: Context): {time: number, timeEnd: number} => {
    const time = context.time;

    const duration = tail && tail.type === 'Hold'
        ? (tail as HoldType).length + 1
        : 1;

    context.time += duration * context.subdivision;
    const timeEnd = context.time;

    return {
        time,
        timeEnd
    };
};

//
// labels
//

export const pitchToLabel = (pitch: PitchType, context: Context): string => {
    const {type} = pitch.value;

    if(type === 'PitchRatio') {
        const {numerator, denominator} = pitch.value as PitchRatioType;
        const ratio = numerator / denominator;
        limit('Pitch ratio', ratio, 0, 100);
        return `${numerator}/${denominator}`;
    }

    if(type === 'PitchCents') {
        const {cents} = pitch.value as PitchCentsType;
        return `${cents}c`;
    }

    if(type === 'PitchOctaveDivision') {
        const {numerator, denominator} = pitch.value as PitchOctaveDivisionType;
        return `${numerator}\\${denominator}`;
    }

    if(type === 'PitchDegree') {
        const {degree} = pitch.value as PitchDegreeType;
        const [wrappedDegree] = pitchDegreeWrap(degree, context.scale);
        return context.scaleLabels[wrappedDegree];
    }

    if(type === 'PitchHz') {
        const {hz} = pitch.value as PitchHzType;
        return `${hz}Hz`;
    }

    throw new Error(`Unknown pitch type "${type}"`);
};

const edoToLabels = (edoSize: number): string[] => {
    const labels: string[] = [];
    for(let i = 0; i < edoSize; i++) {
        labels.push(`${i}\\${edoSize}`);
    }
    return labels;
};

//
// converters
//

const ENV_VALUES = [0,0.003,0.006,0.01,0.033,0.1,0.33,1,3.3,10];

type Context = {
    rootHz: number;
    time: number;
    subdivision: number;
    scale: number[];
    scaleLabels: string[];
    octaveSize: number;
};

const times: [number,number][] = [];

const processNote = (note: NoteType, context: Context): MoscNote[] => {
    const timeProps = tailToTime(note.tail, context);

    // mutate ast node to add time
    const arr: [number,number] = [timeProps.time, timeProps.timeEnd];
    times.push(arr);
    note.time = arr;

    return [{
        type: 'NOTE_TIME',
        hz: pitchToHz(note.pitch, context),
        label: pitchToLabel(note.pitch, context),
        ...timeProps
    }];
};

const processChord = (chord: ChordType|RatioChordType, context: Context): MoscNote[] => {
    const {tail, pitches} = chord;
    const timeProps = tailToTime(tail, context);

    // mutate ast node to add time
    const arr: [number,number] = [timeProps.time, timeProps.timeEnd];
    times.push(arr);
    chord.time = arr;

    const pitchTypes: MoscNote[] = pitches
        .filter((pitch): pitch is PitchType => pitch.type === 'Pitch')
        .map((pitch: any) => {
            return {
                type: 'NOTE_TIME',
                hz: pitchToHz(pitch as PitchType, context),
                label: pitchToLabel(pitch as PitchType, context),
                ...timeProps
            };
        });

    const firstRatioPitch = pitches.find((pitch: PitchType|RatioChordPitchType|DelimiterType) => {
        return pitch.type === 'RatioChordPitch';
    }) as RatioChordPitchType|undefined;

    const ratioPitchTypes: MoscNote[] = pitches
        .filter((pitch): pitch is RatioChordPitchType => pitch.type === 'RatioChordPitch')
        .map((pitch: any) => {
            const numerator = (pitch as RatioChordPitchType).pitch;
            const denominator = (firstRatioPitch as RatioChordPitchType).pitch;
            return {
                type: 'NOTE_TIME',
                hz: numerator / denominator * context.rootHz,
                label: `${numerator}/${denominator}`,
                ...timeProps
            };
        });

    return pitchTypes.concat(ratioPitchTypes);
};

const setScale = (setScale: SetScaleType, context: Context): void => {
    const {scale} = setScale;
    const {type} = scale;
    if(type === 'PitchGroupScale') {
        const {pitches, scaleOctaveMarker, pitchGroupScalePrefix} = scale as PitchGroupScaleType;

        let filteredPitches: PitchType[] = pitches.filter((pitch): pitch is PitchType => !pitch.delimiter) as PitchType[];

        if(pitchGroupScalePrefix && pitchGroupScalePrefix.prefix === 'm') {
            const degreePitches: PitchDegreeType[] = [
                {
                    type: 'PitchDegree',
                    degree: 0,
                    delimiter: false,
                    pos: pitchGroupScalePrefix.pos,
                    len: 0
                }
            ];

            let degree = 0;
            filteredPitches.forEach(pitch => {
                if(pitch.value.type !== 'PitchDegree') {
                    throw new Error('Mode scales {m} should only contain pitch degrees (0, 1, etc), not ratios, hz or any other kind of pitch');
                }
                degree += (pitch.value as PitchDegreeType).degree;

                degreePitches.push({
                    ...pitch.value,
                    degree
                });
            });

            degreePitches.pop(); // ignore last degree which is assumed to complete the octave
            filteredPitches = degreePitches.map(value => ({value})) as PitchType[];
        }

        context.scale = filteredPitches.map(pitch => pitchToRatio(pitch, context.scale, context.octaveSize));
        context.scaleLabels = filteredPitches.map(pitch => pitchToLabel(pitch, context));

        if(scaleOctaveMarker) {
            context.octaveSize = context.scale.pop() || 2;
            context.scaleLabels.pop();
        }

        return;
    }

    if(type === 'EdoScale') {
        const {divisions, octaveSize} = scale as EdoScaleType;
        context.scale = edoToRatios(divisions, octaveSize);
        context.scaleLabels = edoToLabels(divisions);
        context.octaveSize = octaveSize;
        return;
    }

    if(type === 'RatioChordScale') {
        const {pitches, scaleOctaveMarker} = scale as RatioChordScaleType;

        const ratios: number[] = pitches
            .filter((pitch): pitch is RatioChordPitchType => !pitch.delimiter)
            .map(pitch => pitch.pitch);

        context.scale = ratios.map(ratio => ratio / ratios[0]);
        context.scaleLabels = ratios.map(ratio => `${ratio}/${ratios[0]}`);

        if(scaleOctaveMarker) {
            context.octaveSize = context.scale.pop() || 2;
            context.scaleLabels.pop();
        }

        return;
    }

    throw new Error(`Unknown scale type "${type}"`);
};

const processSetter = (setter: SetterType, context: Context): MoscItem[] => {
    const {type, delimiter} = setter;

    if(delimiter) return [];

    if(type === 'SetBpm') {
        const {bpm} = setter as SetBpmType;
        return [{
            type: 'TEMPO',
            time: context.time,
            bpm,
            lerp: false
        }];
    }

    if(type === 'SetBms') {
        const {bms} = setter as SetBmsType;
        return [{
            type: 'TEMPO',
            time: context.time,
            bpm: 60000 / bms,
            lerp: false
        }];
    }

    if(type === 'SetSubdivision') {
        const {subdivision, denominator} = setter as SetSubdivisionType;
        context.subdivision = (denominator ?? 1) / subdivision;
        return [];
    }

    if(type === 'SetOsc') {
        const {osc} = setter as SetOscType;
        return [{
            type: 'PARAM_TIME',
            time: context.time,
            value: {
                type: 'osc',
                osc
            }
        }];
    }

    if(type === 'SetEnv') {
        const {a,d,s,r} = setter as SetEnvType;
        return [{
            type: 'PARAM_TIME',
            time: context.time,
            value: {
                type: 'env',
                a: ENV_VALUES[a] || 0,
                d: ENV_VALUES[d] || 0,
                s: s / 9,
                r: ENV_VALUES[r] || 0
            }
        }];
    }

    if(type === 'SetRulerGrid') {
        // send some kind of external intstruction, in MoscScore but not used by moscscore
        // so that parsing can all be done here
        // snapshot
        // context.scale
        // context.scaleLabels
        return [];
    }

    if(type === 'SetRulerRange') {
        // send some kind of external intstruction, in MoscScore but not used by moscscore
        // so that parsing can all be done here
        // parse
        // high and low notes to hz
        return [];
    }

    throw new Error(`Unknown setters type "${type}"`);
};

export const grammarToMoscScore = (grammar: XenpaperAST): MoscScore|undefined => {

    const grammarSequence = grammar.sequence;
    if(!grammarSequence) return undefined;

    const INITIAL_TEMPO: MoscTempo = {
        type: 'TEMPO',
        time: 0,
        bpm: 120,
        lerp: false
    };

    const INITIAL_OSC: MoscParam = {
        type: 'PARAM_TIME',
        time: 0,
        value: {
            type: 'osc',
            osc: 'triangle'
        }
    };

    const INITIAL_ENV: MoscParam = {
        type: 'PARAM_TIME',
        time: 0,
        value: {
            type: 'env',
            a: ENV_VALUES[2],
            d: ENV_VALUES[8],
            s: 0.5,
            r: ENV_VALUES[6]
        }
    };

    const context: Context = {
        rootHz: 440,
        time: 0,
        subdivision: 0.5,
        scale: edoToRatios(12, 2),
        scaleLabels: edoToLabels(12),
        octaveSize: 2
    };

    const items: MoscItem[] = flatMap(grammarSequence.items, (item): MoscItem[] => {
        const {type} = item;
        if(type === 'Comment' || type === 'BarLine' || type === 'Whitespace') {
            // do nothing
            return [];
        }

        if(type === 'SetScale') {
            setScale(item as SetScaleType, context);
            return [];
        }

        if(type === 'SetRoot') {
            const {pitch} = item as SetRootType;
            context.rootHz = pitchToHz(pitch, context);
            return [];
        }

        if(type === 'Note') {
            return processNote(item as NoteType, context);
        }

        if(type === 'Rest') {
            const {time} = context;
            const rest = item as RestType;
            context.time += rest.length * context.subdivision;
            // mutate ast node to add time
            const arr: [number,number] = [time, context.time];
            times.push(arr);
            rest.time = arr;
            return [];
        }

        if(type === 'Chord') {
            return processChord(item as ChordType, context);
        }

        if(type === 'RatioChord') {
            return processChord(item as RatioChordType, context);
        }

        if(type === 'SetterGroup') {
            return flatMap((item as SetterGroupType).setters, setter => processSetter(setter, context));
        }

        throw new Error(`Unknown sequence item "${type}"`);
    });

    const sequence = [
        INITIAL_TEMPO,
        INITIAL_OSC,
        INITIAL_ENV,
        ...items,
        {
            type: 'END_TIME',
            time: context.time
        } as MoscEnd
    ];

    // translate times from steps to ms
    const thisTimeToMs = timeToMs(sequence);

    // omg are we really mutating many time items throughout the AST tree via mutations? golly!
    times.forEach(time => {
        time[0] = thisTimeToMs(time[0]);
        time[1] = thisTimeToMs(time[1]);
    });

    return {
        sequence,
        lengthTime: context.time
    };
};
