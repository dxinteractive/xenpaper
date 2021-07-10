import Parser, {All, Any, Optional, Star, Node} from 'rd-parse';

export type NodeType = {
    type: string;
    delimiter: boolean;
    pos: number;
    len: number;
    time?: [number, number];
};

export type Meta = {
    pos: number;
};

export type NodeCreator = (args: any) => {[key: string]: any};

function node/*<T extends NodeType>*/(type: string, match: RegExp|string, fn: NodeCreator) {
    return Node(match, (value: unknown, meta: Meta) => {
        return {
            type,
            delimiter: false,
            ...fn(value),
            pos: meta.pos
        };
    });
}

const sumLen = (nodes: NodeType[]): number => nodes.reduce((len: number, node: NodeType) => len + node.len, 0);

//
// delimiters and whitespace
//

const delimiter = ([text]: [string]) => ({
    delimiter: true,
    len: text.length
});

export type DelimiterType = NodeType & {
    delimiter: true;
};

export const Semicolon = node/*<DelimiterType>*/(
    'Semicolon',
    /(^[;]\s*)/,
    delimiter
);

export const Colon = node/*<DelimiterType>*/(
    'Colon',
    /(^[:]\s*)/,
    delimiter
);

export const BarLine = node/*<DelimiterType>*/(
    'BarLine',
    '|',
    () => ({
        len: 1,
        delimiter: true
    })
);

export const Whitespace = node/*<DelimiterType>*/(
    'Whitespace',
    /(^[,\s]+)/,
    ([whitespace]) => ({
        len: whitespace.length,
        delimiter: true
    })
);

//
// pitches
//

type OctaveModifierType = NodeType & {
    octave: number;
};

export const OctaveModifier = node/*<OctaveModifierType>*/(
    'OctaveModifier',
    /^(['"]+|`+)/,
    ([chars]) => ({
        octave: (chars.split("'").length - 1) + ((chars.split('"').length - 1) * 2) - (chars.split('`').length - 1),
        len: chars.length
    })
);

export type PitchCentsType = NodeType & {
    cents: number;
};

export const PitchCents = node/*<PitchCentsType>*/(
    'PitchCents',
    /^(\d+|\d+\.(\d+)?)c/,
    ([cents]) => ({
        cents: Number(cents),
        len: cents.length + 1
    })
);

export type PitchOctaveDivisionType = NodeType & {
    numerator: number;
    denominator: number;
    octaveSize: number;
};

export const PitchOctaveDivision = node/*<PitchOctaveDivisionType>*/(
    'PitchOctaveDivision',
    /^([\d]+)[\\/]([\d]+)o(\d)?(\/(\d))?/,
    ([numerator, denominator, octaveSize = '', slash = '', octaveDenom = '']) => ({
        numerator: Number(numerator),
        denominator: Number(denominator),
        octaveSize: Number(octaveSize || 2) / Number(octaveDenom || 1),
        len: numerator.length + denominator.length + octaveSize.length + 2 + slash.length
    })
);

export const PitchOctaveDivision2 = node/*<PitchOctaveDivisionType>*/(
    'PitchOctaveDivision',
    /^([\d]+)[\\]([\d]+)/,
    ([numerator, denominator]) => ({
        numerator: Number(numerator),
        denominator: Number(denominator),
        octaveSize: 2,
        len: numerator.length + denominator.length + 1
    })
);

export type PitchRatioType = NodeType & {
    numerator: number;
    denominator: number;
};

export const PitchRatio = node/*<PitchRatioType>*/(
    'PitchRatio',
    /^([\d]+)\/([\d]+)/,
    ([numerator, denominator]) => ({
        numerator: Number(numerator),
        denominator: Number(denominator),
        len: numerator.length + denominator.length + 1
    })
);

export type PitchDegreeType = NodeType & {
    degree: number;
};

export const PitchDegree = node/*<PitchDegreeType>*/(
    'PitchDegree',
    /^([\d]+)/,
    ([degree]) => ({
        degree: Number(degree),
        len: degree.length
    })
);

export type PitchHzType = NodeType & {
    hz: number;
};

export const PitchHz = node/*<PitchHzType>*/(
    'PitchHz',
    /^(\d+|\d+\.(\d+)?)hz/i,
    ([hz]: [string]) => ({
        hz: Number(hz),
        len: hz.length + 2
    })
);

export type PitchType = NodeType & {
    value: PitchCentsType|PitchOctaveDivisionType|PitchRatioType|PitchDegreeType|PitchHzType;
    octave?: OctaveModifierType;
};

export const Pitch = node/*<PitchType>*/(
    'Pitch',
    All(Optional(OctaveModifier), Any(PitchCents, PitchHz, PitchOctaveDivision, PitchOctaveDivision2, PitchRatio, PitchDegree)),
    (args) => {
        if(args.length === 1) {
            const [value] = args;
            return {
                value,
                len: value.len
            };
        }
        const [octave, value] = args;
        return {
            value,
            octave,
            len: octave.len + value.len
        };
    }
);

export type PitchGroupType = Array<PitchType|DelimiterType>;

export const PitchGroup = Node(
    All(Pitch, Star(All(Whitespace, Pitch))),
    (elements: unknown) => elements
);

//
// note
//

export type HoldType = NodeType & {
    length: number;
};

export const Hold = node/*<HoldType>*/(
    'Hold',
    /^(([|]?-)+)/,
    ([value]) => ({
        length: value.replace(/[|]+/g, '').length,
        len: value.length
    })
);

export type TailType = HoldType;

export const Tail = Any(Hold);

export type RestType = NodeType & {
    length: number;
};

export const Rest = node/*<RestType>*/(
    'Rest',
    All(/^(\.)/),
    ([value]: [unknown[]]) => ({
        length: value.length,
        len: value.length
    })
);

export type NoteType = NodeType & {
    pitch: PitchType;
    tail?: TailType;
};

export const Note = node/*<NoteType>*/(
    'Note',
    All(Pitch, Optional(Tail)),
    ([pitch, tail]: [PitchType, TailType?]) => ({
        pitch,
        tail,
        len: pitch.len + (tail ? tail.len : 0)
    })
);

//
// chords
//

export type RatioChordPitchType = NodeType & {
    pitch: number;
};

export const RatioChordPitch = node/*<RatioChordPitchType>*/(
    'RatioChordPitch',
    /^([\d]+)/,
    ([pitch]: [string]) => ({
        pitch: Number(pitch),
        len: pitch.length
    })
);

export type RatioChordPitchGroupType = Array<RatioChordPitchType|DelimiterType>;

export const RatioChordPitchGroup = Node(
    All(RatioChordPitch, Colon, RatioChordPitch, Star(All(Colon, RatioChordPitch))),
    (elements: RatioChordPitchGroupType) => elements
);

export type ChordType = NodeType & {
    pitches: Array<RatioChordPitchType|PitchType|DelimiterType>;
    tail?: TailType;
};

export const Chord = node/*<ChordType>*/(
    'Chord',
    All('[', Any(RatioChordPitchGroup, PitchGroup), ']', Optional(Tail)),
    ([pitches, tail]) => ({
        pitches,
        tail,
        len: sumLen(pitches) + (tail ? tail.len : 0) + 2
    })
);

export type RatioChordType = NodeType & {
    pitches: Array<RatioChordPitchType>;
    tail?: TailType;
};

export const RatioChord = node/*<RatioChordType>*/(
    'RatioChord',
    All(RatioChordPitchGroup, Optional(Tail)),
    ([pitches, tail]) => ({
        pitches,
        tail,
        len: sumLen(pitches) + (tail ? tail.len : 0)
    })
);

//
// scales
//

export type EdoScaleType = NodeType & {
    divisions: number;
    octaveSize: number;
};

export const EdoScale = node/*<EdoScaleType>*/(
    'EdoScale',
    /^(\d+)ed([o\d])(\/(\d))?/i,
    ([divisions, octaveSize, slash = '', denominator = '']: [string, string, string, string]) => ({
        divisions: Number(divisions),
        // TODO this math should not be in the grammar
        octaveSize: octaveSize === 'o' ? 2 : Number(octaveSize) / Number(denominator || 1),
        len: divisions.length + octaveSize.length + 2 + slash.length
    })
);

export type ScaleOctaveMarkerType = NodeType;

export const ScaleOctaveMarker = node/*<ScaleOctaveMarkerType>*/(
    'ScaleOctaveMarker',
    "'",
    () => ({
        len: 1
    })
);

export type PitchGroupScalePrefixType = NodeType & {
    prefix: string;
};

export const PitchGroupScalePrefix = node/*<EdoScaleType>*/(
    'PitchGroupScalePrefix',
    /(^[m])(\s*)/,
    ([prefix, space]: [string, string?]) => ({
        prefix,
        len: prefix.length + (space ? space.length : 0)
    })
);

export type PitchGroupScaleType = NodeType & {
    pitchGroupScalePrefix?: PitchGroupScalePrefixType;
    pitches: PitchGroupType;
    scaleOctaveMarker?: ScaleOctaveMarkerType;
};

export const PitchGroupScale = node/*<PitchGroupScaleType>*/(
    'PitchGroupScale',
    All(Optional(PitchGroupScalePrefix), PitchGroup, Optional(ScaleOctaveMarker)),
    (elements: any[]) => {

        const [pitchGroupScalePrefix, pitches, scaleOctaveMarker] = Array.isArray(elements[0])
            ? [undefined, ...elements]
            : elements;

        return {
            pitchGroupScalePrefix,
            pitches,
            scaleOctaveMarker,
            len: (pitchGroupScalePrefix ? pitchGroupScalePrefix.len : 0) + sumLen(pitches) + (scaleOctaveMarker ? scaleOctaveMarker.len : 0)
        };
    }
);

export type RatioChordScaleType = NodeType & {
    pitches: Array<RatioChordPitchType|DelimiterType>;
    scaleOctaveMarker?: ScaleOctaveMarkerType;
};

export const RatioChordScale = node/*<RatioChordScaleType>*/(
    'RatioChordScale',
    All(RatioChordPitchGroup, Optional(ScaleOctaveMarker)),
    ([pitches, scaleOctaveMarker]: [RatioChordPitchGroupType, ScaleOctaveMarkerType?]) => ({
        pitches,
        scaleOctaveMarker,
        len: sumLen(pitches) + (scaleOctaveMarker ? scaleOctaveMarker.len : 0)
    })
);

//
// scale setters
//

export const Scale = Any(EdoScale, RatioChordScale, PitchGroupScale);

export type SetScaleType = NodeType & {
    scale: EdoScaleType|RatioChordScaleType|PitchGroupScaleType;
};

export const SetScale = node/*<SetScaleType>*/(
    'SetScale',
    All('{', Scale, '}'),
    ([scale]) => ({
        scale,
        len: scale.len + 2
    })
);

export type SetRootType = NodeType & {
    pitch: PitchType
};

export const SetRoot = node/*<SetRootType>*/(
    'SetRoot',
    All('{r', Pitch, '}'),
    ([pitch]) => ({
        pitch,
        len: pitch.len + 3
    })
);

//
// setters
//

// bpm

export type SetBpmValue = NodeType & {
    bpm: number;
};

export const SetBpmValue = node/*<SetBpmValueType>*/(
    'SetBpmValue',
    /^(\d+(\.\d+)?)/,
    ([bpm]: [string]) => ({
        bpm: Number(bpm),
        len: bpm.length
    })
);

export type SetBpmType = NodeType & {
    bpm: number;
};

export type SetBpmValueType = NodeType & {
    bpm: number;
};

export const SetBpm = node/*<SetBpmType>*/(
    'SetBpm',
    All(/^(bpm:\s*)/, SetBpmValue),
    ([prefix, value]: [string, SetBpmValueType]) => ({
        bpm: value.bpm,
        len: prefix.length + value.len
    })
);

// bms (beat milliseconds)

export type SetBmsValue = NodeType & {
    bms: number;
};

export const SetBmsValue = node/*<SetBmsValueType>*/(
    'SetBmsValue',
    /^(\d+(\.\d+)?)/,
    ([bms]: [string]) => ({
        bms: Number(bms),
        len: bms.length
    })
);

export type SetBmsType = NodeType & {
    bms: number;
};

export type SetBmsValueType = NodeType & {
    bms: number;
};

export const SetBms = node/*<SetBmsType>*/(
    'SetBms',
    All(/^(bms:\s*)/, SetBmsValue),
    ([prefix, value]: [string, SetBmsValueType]) => ({
        bms: value.bms,
        len: prefix.length + value.len
    })
);


// subdivision

export type SetSubdivisionValueType = NodeType & {
    subdivision: number;
    denominator: number;
};

// TODO - could be a generic number matcher
export const SetSubdivisionValue = node/*<SetSubdivisionValueType>*/(
    'SetSubdivisionValue',
    /^([\d]+)(\/(\d))?/,
    ([subdivision, slash = '', denominator = '']: [string, string, string]) => ({
        subdivision: Number(subdivision),
        denominator: denominator ? Number(denominator) : undefined,
        len: subdivision.length + slash.length
    })
);

export type SetSubdivisionType = NodeType & {
    subdivision: number;
    denominator: number;
};

export const SetSubdivision = node/*<SetSubdivisionType>*/(
    'SetSubdivision',
    All(/^((div:)?\s*)/, SetSubdivisionValue),
    ([prefix,, value]: [string, string, SetSubdivisionValueType]) => ({
        subdivision: value.subdivision,
        denominator: value.denominator,
        len: prefix.length + value.len
    })
);

// osc

export type SetOscValueType = NodeType & {
    osc: string;
};

export const SetOscValue = node/*<SetOscValueType>*/(
    'SetOscValue',
    /^([a-z0-9]*)/,
    ([osc]: [string]) => ({
        osc,
        len: osc.length
    })
);

export type SetOscType = NodeType & {
    osc: string;
};

export const SetOsc = node/*<SetOscType>*/(
    'SetOsc',
    All(/^(osc:\s*)/, SetOscValue),
    ([prefix, value]: [string, SetOscValueType]) => ({
        osc: value.osc,
        len: prefix.length + value.len
    })
);

// env

export type SetEnvValueType = NodeType & {
    a: number;
    d: number;
    s: number;
    r: number;
};

export const SetEnvValue = node/*<SetEnvValueType>*/(
    'SetEnvValue',
    /^(([0-9])([0-9])([0-9])([0-9]))/,
    ([all, a, d, s, r]: [string, string, string, string, string]) => ({
        a: Number(a),
        d: Number(d),
        s: Number(s),
        r: Number(r),
        len: all.length
    })
);

export type SetEnvType = NodeType & {
    a: number;
    d: number;
    s: number;
    r: number;
};

export const SetEnv = node/*<SetEnvType>*/(
    'SetEnv',
    All(/^(env:\s*)/, SetEnvValue),
    ([prefix, value]: [string, SetEnvValueType]) => ({
        a: value.a,
        d: value.d,
        s: value.s,
        r: value.r,
        len: prefix.length + value.len
    })
);

// ruler

export type SetRulerRangeType = NodeType & {
    low: PitchType;
    high: PitchType;
};

export const SetRulerRange = node/*<SetRulerRangeType>*/(
    'SetRulerRange',
    All(/^(rl:)/, Pitch, ',', Pitch),
    ([prefix, low, high]: [string, PitchType, PitchType]) => ({
        low,
        high,
        len: prefix.length + 1 + low.len + high.len
    })
);

export type SetRulerGridType = NodeType;

export const SetRulerGrid = node/*<SetRulerGridType>*/(
    'SetRulerGrid',
    /^(rl:grid)/,
    ([str]: [string]) => ({
        len: str.length
    })
);

export type SetRulerType = SetRulerRangeType|SetRulerGridType;

export const SetRuler = Any(SetRulerRange, SetRulerGrid);

// setters

export type SetterType = SetBpmType|SetBmsType|SetSubdivisionType|SetOscType|SetEnvType|SetRulerType;

export const Setter = Any(SetBpm, SetBms, SetSubdivision, SetOsc, SetEnv, SetRuler);

export type SetterGroupType = NodeType & {
    setters: SetterType[];
};

export const SetterGroup = node/*<SetterGroupType>*/(
    'SetterGroup',
    All('(', Setter, Star(All(Semicolon, Setter)), ')'),
    (setters: SetterType[]) => ({
        setters,
        len: sumLen(setters) + 2
    })
);

//
// comments
//

export type CommentType = NodeType & {
    comment: string;
};

export const Comment = node/*<CommentType>*/(
    'Comment',
    /^#([^\n]*)/,
    ([comment]) => ({
        comment,
        len: comment.length + 1
    })
);

//
// sequence
//

export type SequenceItemsType = RatioChordType|NoteType|ChordType|RestType|SetterGroupType|SetScaleType|SetRootType|CommentType;

export type SequenceType = NodeType & {
    items: SequenceItemsType[];
};

export const Sequence = node/*<SequenceType>*/(
    'Sequence',
    Star(Any(Comment, RatioChord, Note, Chord, Rest, SetterGroup, SetScale, SetRoot, BarLine, Whitespace)),
    (items: SequenceItemsType[]) => ({
        items,
        len: sumLen(items)
    })
);

//
// params
//

export type ParamEmbedType = NodeType;

export const ParamEmbed = node/*<ParamEmbedType>*/(
    'ParamEmbed',
    'embed',
    () => ({
        len: 5
    })
);

export type ParamType = ParamEmbedType;

export const Param = Any(ParamEmbed);

export type ParamGroupType = NodeType & {
    params: ParamType[];
};

export const ParamGroup = node/*<ParamGroupType>*/(
    'ParamGroup',
    All(Param, Star(All(Semicolon, Param)), ':'),
    (params: ParamType[]) => ({
        params,
        len: sumLen(params) + 1
    })
);
export type XenpaperAST = NodeType & {
    sequence?: SequenceType;
    paramGroup?: ParamGroupType;
};

export const XenpaperGrammar = node/*<XenpaperAST>*/(
    'XenpaperGrammar',
    All(Optional(ParamGroup), Optional(Sequence)),
    (parts: Array<SequenceType>) => {
        const paramGroup = parts.find(part => part.type === 'ParamGroup');
        const sequence = parts.find(part => part.type === 'Sequence');
        return {
            sequence,
            paramGroup,
            len: sequence ? sequence.len : 0
        };
    }
);

const parser = Parser(XenpaperGrammar);

export const XenpaperGrammarParser = (input: string): XenpaperAST => {
    try {
        return parser(input);
    } catch(e) {
        // eslint-disable-next-line no-console
        console.error('e', e);
        throw new Error(e.message.replace(/Remainder:.*/s, ''));
    }
};
