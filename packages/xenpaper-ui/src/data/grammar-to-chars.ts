import type {XenpaperAST} from './grammar';

export type HighlightColor = 'delimiter'
    |'pitch'
    |'chord'
    |'scaleGroup'
    |'scale'
    |'setterGroup'
    |'setter'
    |'comment'
    |'commentStart'
    |'unknown'
    |'error'
    |'errorMessage';

export type CharData = {
    color: HighlightColor;
    playTime?: [number, number];
};

const colorMap = new Map<string,HighlightColor>([
    ['Semicolon','delimiter'],
    ['Colon','delimiter'],
    // ['PitchCents','pitch'],
    // ['PitchOctaveDivision','pitch'],
    // ['PitchRatio','pitch'],
    // ['PitchDegree','pitch'],
    // ['PitchHz','pitch'],
    // ['OctaveModifier','pitch'],
    ['Pitch','pitch'],
    ['RatioChordPitch','pitch'],
    ['Chord','chord'],
    ['Chord.Whitespace','pitch'],
    // ['RatioChord'],
    ['Hold','pitch'],
    ['Rest','delimiter'],
    ['BarLine','delimiter'],
    ['Whitespace','delimiter'],
    ['EdoScale','scale'],
    ['PitchGroupScale','scale'],
    ['PitchGroupScale.Pitch','scale'],
    ['PitchGroupScale.Whitespace','scale'],
    ['RatioChordScale','scale'],
    ['RatioChordScale.RatioChordPitch','scale'],
    ['RatioChordScale.Colon','scale'],
    ['ScaleOctaveMarker','scale'],
    ['SetScale','scaleGroup'],
    ['SetRoot','scaleGroup'],
    ['SetRoot.Pitch','scale'],
    ['SetBpm','setter'],
    ['SetBms','setter'],
    ['SetSubdivision','setter'],
    ['SetOsc','setter'],
    ['SetEnv','setter'],
    ['SetPrimes', 'setter'],
    ['SetRulerPlot','setter'],
    ['SetRulerRange','setter'],
    ['SetRulerRange.Pitch','setter'],
    ['SetterGroup','setterGroup'],
    ['SetterGroup.Semicolon','setterGroup'],
    ['Comment','comment']
]);

// need to pass playhead time in
const extract = (chars: CharData[], data: any, parent: string, withinTime?: number): void => {
    if(Array.isArray(data)) {
        data.forEach(value => extract(chars, value, parent, withinTime));
        return;
    }
    if(data instanceof Object) {
        const color = colorMap.get(`${parent}.${data.type}`) || colorMap.get(data.type);
        const time = withinTime ?? data.time;

        if(typeof data.pos === 'number' && typeof data.len === 'number' && color) {
            for(let i = 0; i < data.len; i++) {
                chars[data.pos + i] = {
                    color: (color === 'comment' && i === 0) ? 'commentStart' : color,
                    playTime: time
                };
            }
        }
        Object.keys(data).forEach(key => {
            extract(chars, data[key], data.type, time);
        });
        return;
    }
};

export const grammarToChars = ({sequence}: XenpaperAST): CharData[] => {
    if(!sequence) return [];
    const {items} = sequence;
    const chars: CharData[] = [];
    extract(chars, items, '');
    return chars;
};
