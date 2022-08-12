import {XenpaperGrammar} from '../grammar';

import Parser from 'rd-parse';

const parser = Parser(XenpaperGrammar);

const strip = <T>(data: T): T => {
    if(Array.isArray(data)) {
        return (data.map(value => strip(value)) as unknown) as T;
    }
    if(data instanceof Object) {
        const result = Object.keys(data).reduce((obj, key) => {
            if(key !== 'pos' && key !== 'delimiter') {
                // @ts-ignore
                obj[key] = strip(data[key]);
            }
            return obj;
        }, {} as {[key: string]: unknown});

        return (result as unknown) as T;
    }
    return data;
};

describe('grammar', () => {

    describe('sequence', () => {

        describe('sequence timing', () => {

            it('should parse sequence with one note', () => {
                expect(strip(parser('2')).sequence.items).toEqual([
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 2,
                                len: 1
                            },
                            len: 1
                        },
                        tail: undefined,
                        len: 1
                    }
                ]);
            });

            it('should parse sequence with comma separated notes', () => {
                expect(strip(parser('2,34,56')).sequence.items).toEqual([
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 2,
                                len: 1
                            },
                            len: 1
                        },
                        tail: undefined,
                        len: 1
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 34,
                                len: 2
                            },
                            len: 2
                        },
                        tail: undefined,
                        len: 2
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 56,
                                len: 2
                            },
                            len: 2
                        },
                        tail: undefined,
                        len: 2
                    }
                ]);
            });

            it('should parse sequence with space separated notes', () => {
                expect(strip(parser('2 34 56')).sequence.items).toEqual([
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 2,
                                len: 1
                            },
                            len: 1
                        },
                        tail: undefined,
                        len: 1
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 34,
                                len: 2
                            },
                            len: 2
                        },
                        tail: undefined,
                        len: 2
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 56,
                                len: 2
                            },
                            len: 2
                        },
                        tail: undefined,
                        len: 2
                    }
                ]);
            });

            it('should allow bar lines between items', () => {
                expect(strip(parser('2|34|56|')).sequence.items).toEqual([
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 2,
                                len: 1
                            },
                            len: 1
                        },
                        tail: undefined,
                        len: 1
                    },
                    {
                        type: 'BarLine',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 34,
                                len: 2
                            },
                            len: 2
                        },
                        tail: undefined,
                        len: 2
                    },
                    {
                        type: 'BarLine',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 56,
                                len: 2
                            },
                            len: 2
                        },
                        tail: undefined,
                        len: 2
                    },
                    {
                        type: 'BarLine',
                        len: 1
                    }
                ]);
            });

            it('should parse sequence with hold separated notes', () => {
                expect(strip(parser('2-34---56')).sequence.items).toEqual([
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 2,
                                len: 1
                            },
                            len: 1
                        },
                        tail: {
                            type: 'Hold',
                            length: 1,
                            len: 1
                        },
                        len: 2
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 34,
                                len: 2
                            },
                            len: 2
                        },
                        tail: {
                            type: 'Hold',
                            length: 3,
                            len: 3
                        },
                        len: 5
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 56,
                                len: 2
                            },
                            len: 2
                        },
                        tail: undefined,
                        len: 2
                    }
                ]);
            });

            it('should allow comma after hold', () => {
                expect(strip(parser('2-,3')).sequence.items).toEqual([
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 2,
                                len: 1
                            },
                            len: 1
                        },
                        tail: {
                            type: 'Hold',
                            length: 1,
                            len: 1
                        },
                        len: 2
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 3,
                                len: 1
                            },
                            len: 1
                        },
                        tail: undefined,
                        len: 1
                    }
                ]);
            });

            it('should parse sequence with rest separated notes', () => {
                expect(strip(parser('2.34--...56')).sequence.items).toEqual([
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 2,
                                len: 1
                            },
                            len: 1
                        },
                        tail: undefined,
                        len: 1
                    },
                    {
                        type: 'Rest',
                        length: 1,
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 34,
                                len: 2
                            },
                            len: 2
                        },
                        tail: {
                            type: 'Hold',
                            length: 2,
                            len: 2
                        },
                        len: 4
                    },
                    {
                        type: 'Rest',
                        length: 1,
                        len: 1
                    },
                    {
                        type: 'Rest',
                        length: 1,
                        len: 1
                    },
                    {
                        type: 'Rest',
                        length: 1,
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 56,
                                len: 2
                            },
                            len: 2
                        },
                        tail: undefined,
                        len: 2
                    }
                ]);
            });

            it('should allow rest to have comma', () => {
                expect(strip(parser('2.,3')).sequence.items).toEqual([
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 2,
                                len: 1
                            },
                            len: 1
                        },
                        tail: undefined,
                        len: 1
                    },
                    {
                        type: 'Rest',
                        length: 1,
                        len: 1
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 3,
                                len: 1
                            },
                            len: 1
                        },
                        tail: undefined,
                        len: 1
                    }
                ]);
            });

            it('should parse sequence and allow whitespace between items', () => {

                const seq = `|2.  34-- ...
                56`;

                expect(strip(parser(seq)).sequence.items).toEqual([
                    {
                        type: 'BarLine',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 2,
                                len: 1
                            },
                            len: 1
                        },
                        tail: undefined,
                        len: 1
                    },
                    {
                        type: 'Rest',
                        length: 1,
                        len: 1
                    },
                    {
                        type: 'Whitespace',
                        len: 2
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 34,
                                len: 2
                            },
                            len: 2
                        },
                        tail: {
                            type: 'Hold',
                            length: 2,
                            len: 2
                        },
                        len: 4
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Rest',
                        length: 1,
                        len: 1
                    },
                    {
                        type: 'Rest',
                        length: 1,
                        len: 1
                    },
                    {
                        type: 'Rest',
                        length: 1,
                        len: 1
                    },
                    {
                        type: 'Whitespace',
                        len: 17
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 56,
                                len: 2
                            },
                            len: 2
                        },
                        tail: undefined,
                        len: 2
                    }
                ]);
            });

            it('should error if hold is attempted after a rest', () => {
                expect(() => parser('2-.-')).toThrow('Unexpected token at 1:4. Remainder: -');
            });

            it('should parse sequence with a hold after a bar line', () => {
                expect(strip(parser('2---|----|')).sequence.items).toEqual([
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 2,
                                len: 1
                            },
                            len: 1
                        },
                        tail: {
                            type: 'Hold',
                            length: 7,
                            len: 8
                        },
                        len: 9
                    },
                    {
                        type: 'BarLine',
                        len: 1
                    }
                ]);
            });
        });

        describe('notes', () => {

            it('should parse sequence with octave modifiers on notes', () => {
                expect(strip(parser('\'0,"0,\'"0,`0,``0')).sequence.items).toEqual([
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 0,
                                len: 1
                            },
                            octave: {
                                type: 'OctaveModifier',
                                octave: 1,
                                len: 1
                            },
                            len: 2
                        },
                        tail: undefined,
                        len: 2
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 0,
                                len: 1
                            },
                            octave: {
                                type: 'OctaveModifier',
                                octave: 2,
                                len: 1
                            },
                            len: 2
                        },
                        tail: undefined,
                        len: 2
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 0,
                                len: 1
                            },
                            octave: {
                                type: 'OctaveModifier',
                                octave: 3,
                                len: 2
                            },
                            len: 3
                        },
                        tail: undefined,
                        len: 3
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 0,
                                len: 1
                            },
                            octave: {
                                type: 'OctaveModifier',
                                octave: -1,
                                len: 1
                            },
                            len: 2
                        },
                        tail: undefined,
                        len: 2
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchDegree',
                                degree: 0,
                                len: 1
                            },
                            octave: {
                                type: 'OctaveModifier',
                                octave: -2,
                                len: 2
                            },
                            len: 3
                        },
                        tail: undefined,
                        len: 3
                    }
                ]);
            });

            it('should parse sequence with fraction notes', () => {
                expect(strip(parser('2/3,3/4')).sequence.items).toEqual([
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchRatio',
                                numerator: 2,
                                denominator: 3,
                                len: 3
                            },
                            len: 3
                        },
                        tail: undefined,
                        len: 3
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchRatio',
                                numerator: 3,
                                denominator: 4,
                                len: 3
                            },
                            len: 3
                        },
                        tail: undefined,
                        len: 3
                    }
                ]);
            });

            it('should parse sequence with octave fraction notes', () => {
                expect(strip(parser('2/3o,3/4o3,3/4o3/2')).sequence.items).toEqual([
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchOctaveDivision',
                                numerator: 2,
                                denominator: 3,
                                octaveSize: 2,
                                len: 4
                            },
                            len: 4
                        },
                        tail: undefined,
                        len: 4
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchOctaveDivision',
                                numerator: 3,
                                denominator: 4,
                                octaveSize: 3,
                                len: 5
                            },
                            len: 5
                        },
                        tail: undefined,
                        len: 5
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchOctaveDivision',
                                numerator: 3,
                                denominator: 4,
                                octaveSize: 1.5,
                                len: 7
                            },
                            len: 7
                        },
                        tail: undefined,
                        len: 7
                    }
                ]);
            });

            it('should parse sequence with octave fraction notes (type 2)', () => {
                expect(strip(parser('2\\3')).sequence.items).toEqual([
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchOctaveDivision',
                                numerator: 2,
                                denominator: 3,
                                octaveSize: 2,
                                len: 3
                            },
                            len: 3
                        },
                        tail: undefined,
                        len: 3
                    }
                ]);
            });

            it('should parse sequence with cents notes', () => {
                expect(strip(parser('2c,2.c,2.2c')).sequence.items).toEqual([
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchCents',
                                cents: 2,
                                len: 2
                            },
                            len: 2
                        },
                        tail: undefined,
                        len: 2
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchCents',
                                cents: 2,
                                len: 3
                            },
                            len: 3
                        },
                        tail: undefined,
                        len: 3
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchCents',
                                cents: 2.2,
                                len: 4
                            },
                            len: 4
                        },
                        tail: undefined,
                        len: 4
                    }
                ]);
            });

            it('should parse sequence with hz notes', () => {
                expect(strip(parser('2hz,2.Hz,2.2HZ')).sequence.items).toEqual([
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchHz',
                                hz: 2,
                                len: 3
                            },
                            len: 3
                        },
                        tail: undefined,
                        len: 3
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchHz',
                                hz: 2,
                                len: 4
                            },
                            len: 4
                        },
                        tail: undefined,
                        len: 4
                    },
                    {
                        type: 'Whitespace',
                        len: 1
                    },
                    {
                        type: 'Note',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                type: 'PitchHz',
                                hz: 2.2,
                                len: 5
                            },
                            len: 5
                        },
                        tail: undefined,
                        len: 5
                    }
                ]);
            });
        });

        describe('chord', () => {

            it('should parse sequence with a chord', () => {
                expect(strip(parser('[0c,100c, 200c]--')).sequence.items).toEqual([
                    {
                        type: 'Chord',
                        pitches: [
                            {
                                type: 'Pitch',
                                value: {
                                    type: 'PitchCents',
                                    cents: 0,
                                    len: 2
                                },
                                len: 2
                            },
                            {
                                type: 'Whitespace',
                                len: 1
                            },
                            {
                                type: 'Pitch',
                                value: {
                                    type: 'PitchCents',
                                    cents: 100,
                                    len: 4
                                },
                                len: 4
                            },
                            {
                                type: 'Whitespace',
                                len: 2
                            },
                            {
                                type: 'Pitch',
                                value: {
                                    type: 'PitchCents',
                                    cents: 200,
                                    len: 4
                                },
                                len: 4
                            }
                        ],
                        tail: {
                            type: 'Hold',
                            length: 2,
                            len: 2
                        },
                        len: 17
                    }
                ]);
            });

            it('should error if chord is empty or not delimited properly', () => {
                expect(() => parser('[]')).toThrow('Unexpected token at 1:2. Remainder: ]');
            });

            it('should parse sequence with a ratio chord', () => {
                expect(strip(parser('4:5:6:7--')).sequence.items).toEqual([
                    {
                        type: 'RatioChord',
                        pitches: [
                            {
                                type: 'RatioChordPitch',
                                pitch: 4,
                                len: 1
                            },
                            {
                                type: 'Colon',
                                len: 1
                            },
                            {
                                type: 'RatioChordPitch',
                                pitch: 5,
                                len: 1
                            },
                            {
                                type: 'Colon',
                                len: 1
                            },
                            {
                                type: 'RatioChordPitch',
                                pitch: 6,
                                len: 1
                            },
                            {
                                type: 'Colon',
                                len: 1
                            },
                            {
                                type: 'RatioChordPitch',
                                pitch: 7,
                                len: 1
                            }
                        ],
                        tail: {
                            type: 'Hold',
                            length: 2,
                            len: 2
                        },
                        len: 9
                    }
                ]);
            });

            it('should parse sequence with a ratio chord in square brackets', () => {
                expect(strip(parser('[4:5:6:7]--')).sequence.items).toEqual([
                    {
                        type: 'Chord',
                        pitches: [
                            {
                                type: 'RatioChordPitch',
                                pitch: 4,
                                len: 1
                            },
                            {
                                type: 'Colon',
                                len: 1
                            },
                            {
                                type: 'RatioChordPitch',
                                pitch: 5,
                                len: 1
                            },
                            {
                                type: 'Colon',
                                len: 1
                            },
                            {
                                type: 'RatioChordPitch',
                                pitch: 6,
                                len: 1
                            },
                            {
                                type: 'Colon',
                                len: 1
                            },
                            {
                                type: 'RatioChordPitch',
                                pitch: 7,
                                len: 1
                            }
                        ],
                        tail: {
                            type: 'Hold',
                            length: 2,
                            len: 2
                        },
                        len: 11
                    }
                ]);
            });

            it('should parse sequence with a ratio chord with interpolation', () => {
                expect(strip(parser('4::7::10--')).sequence.items).toEqual([
                    {
                        type: 'RatioChord',
                        pitches: [
                            {
                                type: 'RatioChordPitch',
                                pitch: 4,
                                len: 1
                            },
                            {
                                type: 'Colon',
                                len: 1
                            },
                            {
                                type: 'Colon',
                                len: 1
                            },
                            {
                                type: 'RatioChordPitch',
                                pitch: 7,
                                len: 1
                            },
                            {
                                type: 'Colon',
                                len: 1
                            },
                            {
                                type: 'Colon',
                                len: 1
                            },
                            {
                                type: 'RatioChordPitch',
                                pitch: 10,
                                len: 2
                            }
                        ],
                        tail: {
                            type: 'Hold',
                            length: 2,
                            len: 2
                        },
                        len: 10
                    }
                ]);
            });

            it('should parse sequence with a chord with octave modifiers', () => {
                expect(strip(parser('[0,7,\'0]')).sequence.items).toEqual([
                    {
                        type: 'Chord',
                        pitches: [
                            {
                                type: 'Pitch',
                                value: {
                                    type: 'PitchDegree',
                                    degree: 0,
                                    len: 1
                                },
                                len: 1
                            },
                            {
                                type: 'Whitespace',
                                len: 1
                            },
                            {
                                type: 'Pitch',
                                value: {
                                    type: 'PitchDegree',
                                    degree: 7,
                                    len: 1
                                },
                                len: 1
                            },
                            {
                                type: 'Whitespace',
                                len: 1
                            },
                            {
                                type: 'Pitch',
                                value: {
                                    type: 'PitchDegree',
                                    degree: 0,
                                    len: 1
                                },
                                octave: {
                                    type: 'OctaveModifier',
                                    octave: 1,
                                    len: 1
                                },
                                len: 2
                            }
                        ],
                        tail: undefined,
                        len: 8
                    }
                ]);
            });
        });

        describe('scale setters', () => {

            it('should parse sequence with edo setter', () => {
                expect(strip(parser('{12edo}')).sequence.items).toEqual([
                    {
                        type: 'SetScale',
                        scale: {
                            type: 'EdoScale',
                            divisions: 12,
                            octaveSize: 2,
                            len: 5
                        },
                        len: 7
                    }
                ]);
            });

            it('should parse sequence with ed2 setter', () => {
                expect(strip(parser('{12ed2}')).sequence.items).toEqual([
                    {
                        type: 'SetScale',
                        scale: {
                            type: 'EdoScale',
                            divisions: 12,
                            octaveSize: 2,
                            len: 5
                        },
                        len: 7
                    }
                ]);
            });

            it('should parse sequence with ed3 setter', () => {
                expect(strip(parser('{12ed3}')).sequence.items).toEqual([
                    {
                        type: 'SetScale',
                        scale: {
                            type: 'EdoScale',
                            divisions: 12,
                            octaveSize: 3,
                            len: 5
                        },
                        len: 7
                    }
                ]);
            });

            it('should parse sequence with ed3/2 setter', () => {
                expect(strip(parser('{12ed3/2}')).sequence.items).toEqual([
                    {
                        type: 'SetScale',
                        scale: {
                            type: 'EdoScale',
                            divisions: 12,
                            octaveSize: 1.5,
                            len: 7
                        },
                        len: 9
                    }
                ]);
            });

            it('should parse sequence with ratio scale setter', () => {
                expect(strip(parser('{4:5:6}')).sequence.items).toEqual([
                    {
                        type: 'SetScale',
                        scale: {
                            type: 'RatioChordScale',
                            pitches: [
                                {
                                    type: 'RatioChordPitch',
                                    pitch: 4,
                                    len: 1
                                },
                                {
                                    type: 'Colon',
                                    len: 1
                                },
                                {
                                    type: 'RatioChordPitch',
                                    pitch: 5,
                                    len: 1
                                },
                                {
                                    type: 'Colon',
                                    len: 1
                                },
                                {
                                    type: 'RatioChordPitch',
                                    pitch: 6,
                                    len: 1
                                }
                            ],
                            scaleOctaveMarker: undefined,
                            len: 5
                        },
                        len: 7
                    }
                ]);

                expect(strip(parser("{4:5:6'}")).sequence.items).toEqual([
                    {
                        type: 'SetScale',
                        scale: {
                            type: 'RatioChordScale',
                            pitches: [
                                {
                                    type: 'RatioChordPitch',
                                    pitch: 4,
                                    len: 1
                                },
                                {
                                    type: 'Colon',
                                    len: 1
                                },
                                {
                                    type: 'RatioChordPitch',
                                    pitch: 5,
                                    len: 1
                                },
                                {
                                    type: 'Colon',
                                    len: 1
                                },
                                {
                                    type: 'RatioChordPitch',
                                    pitch: 6,
                                    len: 1
                                }
                            ],
                            scaleOctaveMarker: {
                                type: 'ScaleOctaveMarker',
                                len: 1
                            },
                            len: 6
                        },
                        len: 8
                    }
                ]);
            });

            it('should parse sequence with pitch set scale setter', () => {
                expect(strip(parser('{1/1,9/8,5/4}')).sequence.items).toEqual([
                    {
                        type: 'SetScale',
                        scale: {
                            type: 'PitchGroupScale',
                            pitchGroupScalePrefix: undefined,
                            pitches: [
                                {
                                    type: 'Pitch',
                                    value: {
                                        type: 'PitchRatio',
                                        numerator: 1,
                                        denominator: 1,
                                        len: 3
                                    },
                                    len: 3
                                },
                                {
                                    type: 'Whitespace',
                                    len: 1
                                },
                                {
                                    type: 'Pitch',
                                    value: {
                                        type: 'PitchRatio',
                                        numerator: 9,
                                        denominator: 8,
                                        len: 3
                                    },
                                    len: 3
                                },
                                {
                                    type: 'Whitespace',
                                    len: 1
                                },
                                {
                                    type: 'Pitch',
                                    value: {
                                        type: 'PitchRatio',
                                        numerator: 5,
                                        denominator: 4,
                                        len: 3
                                    },
                                    len: 3
                                }
                            ],
                            scaleOctaveMarker: undefined,
                            len: 11
                        },
                        len: 13
                    }
                ]);

                expect(strip(parser("{1/1,9/8,5/4'}")).sequence.items).toEqual([
                    {
                        type: 'SetScale',
                        scale: {
                            type: 'PitchGroupScale',
                            pitchGroupScalePrefix: undefined,
                            pitches: [
                                {
                                    type: 'Pitch',
                                    value: {
                                        type: 'PitchRatio',
                                        numerator: 1,
                                        denominator: 1,
                                        len: 3
                                    },
                                    len: 3
                                },
                                {
                                    type: 'Whitespace',
                                    len: 1
                                },
                                {
                                    type: 'Pitch',
                                    value: {
                                        type: 'PitchRatio',
                                        numerator: 9,
                                        denominator: 8,
                                        len: 3
                                    },
                                    len: 3
                                },
                                {
                                    type: 'Whitespace',
                                    len: 1
                                },
                                {
                                    type: 'Pitch',
                                    value: {
                                        type: 'PitchRatio',
                                        numerator: 5,
                                        denominator: 4,
                                        len: 3
                                    },
                                    len: 3
                                }
                            ],
                            scaleOctaveMarker: {
                                type: 'ScaleOctaveMarker',
                                len: 1
                            },
                            len: 12
                        },
                        len: 14
                    }
                ]);

                expect(strip(parser("{m 2 1}")).sequence.items).toEqual([
                    {
                        type: 'SetScale',
                        scale: {
                            type: 'PitchGroupScale',
                            pitchGroupScalePrefix: {
                                type: 'PitchGroupScalePrefix',
                                prefix: 'm',
                                len: 2
                            },
                            pitches: [
                                {
                                    type: 'Pitch',
                                    value: {
                                        type: 'PitchDegree',
                                        degree: 2,
                                        len: 1
                                    },
                                    len: 1
                                },
                                {
                                    type: 'Whitespace',
                                    len: 1
                                },
                                {
                                    type: 'Pitch',
                                    value: {
                                        type: 'PitchDegree',
                                        degree: 1,
                                        len: 1
                                    },
                                    len: 1
                                }
                            ],
                            scaleOctaveMarker: undefined,
                            len: 5
                        },
                        len: 7
                    }
                ]);

                expect(strip(parser("{m2 1}")).sequence.items).toEqual([
                    {
                        type: 'SetScale',
                        scale: {
                            type: 'PitchGroupScale',
                            pitchGroupScalePrefix: {
                                type: 'PitchGroupScalePrefix',
                                prefix: 'm',
                                len: 1
                            },
                            pitches: [
                                {
                                    type: 'Pitch',
                                    value: {
                                        type: 'PitchDegree',
                                        degree: 2,
                                        len: 1
                                    },
                                    len: 1
                                },
                                {
                                    type: 'Whitespace',
                                    len: 1
                                },
                                {
                                    type: 'Pitch',
                                    value: {
                                        type: 'PitchDegree',
                                        degree: 1,
                                        len: 1
                                    },
                                    len: 1
                                }
                            ],
                            scaleOctaveMarker: undefined,
                            len: 4
                        },
                        len: 6
                    }
                ]);
            });
        });

        describe('setters', () => {

            it('should parse sequence with bpm setter', () => {
                expect(strip(parser('(bpm:440; bpm: 432.5)')).sequence.items).toEqual([
                    {
                        type: 'SetterGroup',
                        setters: [
                            {
                                type: 'SetBpm',
                                bpm: 440,
                                len: 7
                            },
                            {
                                type: 'Semicolon',
                                len: 2
                            },
                            {
                                type: 'SetBpm',
                                bpm: 432.5,
                                len: 10
                            }
                        ],
                        len: 21
                    }
                ]);
            });

            it('should parse sequence with bms setter', () => {
                expect(strip(parser('(bms:100; bms: 999.2)')).sequence.items).toEqual([
                    {
                        type: 'SetterGroup',
                        setters: [
                            {
                                type: 'SetBms',
                                bms: 100,
                                len: 7
                            },
                            {
                                type: 'Semicolon',
                                len: 2
                            },
                            {
                                type: 'SetBms',
                                bms: 999.2,
                                len: 10
                            }
                        ],
                        len: 21
                    }
                ]);
            });

            it('should parse sequence with subdivision setter', () => {
                expect(strip(parser('(div:4; div:1/4)')).sequence.items).toEqual([
                    {
                        type: 'SetterGroup',
                        setters: [
                            {
                                type: 'SetSubdivision',
                                subdivision: 4,
                                denominator: undefined,
                                len: 5
                            },
                            {
                                type: 'Semicolon',
                                len: 2
                            },
                            {
                                type: 'SetSubdivision',
                                subdivision: 1,
                                denominator: 4,
                                len: 7
                            }
                        ],
                        len: 16
                    }
                ]);
            });

            it('should parse sequence with shorthand subdivision setter', () => {
                expect(strip(parser('(4)')).sequence.items).toEqual([
                    {
                        type: 'SetterGroup',
                        setters: [
                            {
                                type: 'SetSubdivision',
                                subdivision: 4,
                                denominator: undefined,
                                len: 1
                            }
                        ],
                        len: 3
                    }
                ]);
            });

            it('should parse sequence with root setter', () => {
                expect(strip(parser('{r6}{r7/5}{r300hz}{r400HZ}')).sequence.items).toEqual([
                    {
                        type: 'SetRoot',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                degree: 6,
                                type: 'PitchDegree',
                                len: 1
                            },
                            len: 1
                        },
                        len: 4
                    },
                    {
                        type: 'SetRoot',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                numerator: 7,
                                denominator: 5,
                                type: 'PitchRatio',
                                len: 3
                            },
                            len: 3
                        },
                        len: 6
                    },
                    {
                        type: 'SetRoot',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                hz: 300,
                                type: 'PitchHz',
                                len: 5
                            },
                            len: 5
                        },
                        len: 8
                    },
                    {
                        type: 'SetRoot',
                        pitch: {
                            type: 'Pitch',
                            value: {
                                hz: 400,
                                type: 'PitchHz',
                                len: 5
                            },
                            len: 5
                        },
                        len: 8
                    }
                ]);
            });

            it('should parse sequence with osc setter', () => {
                expect(strip(parser('(osc:sine; osc: saw4)')).sequence.items).toEqual([
                    {
                        type: 'SetterGroup',
                        setters: [
                            {
                                type: 'SetOsc',
                                osc: 'sine',
                                len: 8
                            },
                            {
                                type: 'Semicolon',
                                len: 2
                            },
                            {
                                type: 'SetOsc',
                                osc: 'saw4',
                                len: 9
                            }
                        ],
                        len: 21
                    }
                ]);
            });

            it('should parse sequence with primes tuning setter', () => {
                expect(strip(parser('(primes: 1200c 19 1100Hz 16/9)')).sequence.items).toEqual([
                    {
                        type: 'SetterGroup',
                        len: 30,
                        setters: [
                            {
                                type: 'SetPrimes',
                                len: 28,
                                primesPitches: [
                                    {
                                        type: 'Pitch',
                                        value: {
                                            type: 'PitchCents',
                                            cents: 1200,
                                            len: 5
                                        },
                                        len: 5
                                    },
                                    {
                                        type: 'Whitespace',
                                        len: 1
                                    },
                                    {
                                        type: 'Pitch',
                                        value: {
                                            type: 'PitchDegree',
                                            degree: 19,
                                            len: 2
                                        },
                                        len: 2
                                    },
                                    {
                                        type: 'Whitespace',
                                        len: 1
                                    },
                                    {
                                        type: 'Pitch',
                                        value: {
                                            type: 'PitchHz',
                                            hz: 1100,
                                            len: 6
                                        },
                                        len: 6
                                    },
                                    {
                                        type: 'Whitespace',
                                        len: 1
                                    },
                                    {
                                        type: 'Pitch',
                                        value: {
                                            type: 'PitchRatio',
                                            numerator: 16,
                                            denominator: 9,
                                            len: 4
                                        },
                                        len: 4
                                    }
                                ]
                            }
                        ]
                    }
                ]);
            });

            it('should parse sequence with env setter', () => {
                expect(strip(parser('(env:0123; env: 9873)')).sequence.items).toEqual([
                    {
                        type: 'SetterGroup',
                        setters: [
                            {
                                type: 'SetEnv',
                                a: 0,
                                d: 1,
                                s: 2,
                                r: 3,
                                len: 8
                            },
                            {
                                type: 'Semicolon',
                                len: 2
                            },
                            {
                                type: 'SetEnv',
                                a: 9,
                                d: 8,
                                s: 7,
                                r: 3,
                                len: 9
                            }
                        ],
                        len: 21
                    }
                ]);
            });

            it('should parse sequence with ruler setter', () => {
                expect(strip(parser('(rl:200c,400c)')).sequence.items).toEqual([
                    {
                        type: 'SetterGroup',
                        setters: [
                            {
                                type: 'SetRulerRange',
                                high: {
                                    len: 4,
                                    type: "Pitch",
                                    value: {
                                        cents: 400,
                                        len: 4,
                                        type: "PitchCents"
                                    }
                                },
                                len: 12,
                                low: {
                                    len: 4,
                                    type: "Pitch",
                                    value: {
                                        cents: 200,
                                        len: 4,
                                        type: "PitchCents"
                                    }
                                }
                            }
                        ],
                        len: 14
                    }
                ]);
            });

            it('should parse sequence with ruler plot', () => {
                expect(strip(parser('(plot)')).sequence.items).toEqual([
                    {
                        type: 'SetterGroup',
                        setters: [
                            {
                                type: 'SetRulerPlot',
                                len: 4
                            }
                        ],
                        len: 6
                    }
                ]);
            });

            it('should error if setter is empty or not delimited properly', () => {
                expect(() => parser('()')).toThrow('Unexpected token at 1:2. Remainder: )');
                expect(() => parser('(div:16;)')).toThrow('Unexpected token at 1:9. Remainder: )');
                expect(() => parser('(div:16;;div:16)')).toThrow('Unexpected token at 1:9. Remainder: ;div:16)');
                expect(() => parser('(env:123)')).toThrow('Unexpected token at 1:6. Remainder: 123)');
            });
        });
    });

    describe('params', () => {

        it('should parse sequence with param', () => {
            const output = strip(parser('embed:2'));
            expect(output.paramGroup).toEqual({
                len: 6,
                params: [
                    {
                        len: 5,
                        type: 'ParamEmbed'
                    }
                ],
                type: 'ParamGroup'
            });

            expect(output.sequence.items).toEqual([
                {
                    type: 'Note',
                    pitch: {
                        type: 'Pitch',
                        value: {
                            type: 'PitchDegree',
                            degree: 2,
                            len: 1
                        },
                        len: 1
                    },
                    tail: undefined,
                    len: 1
                }
            ]);
        });

        it('should not allow unknown params', () => {
            expect(() => strip(parser(':2'))).toThrow('Unexpected token at 1:1. Remainder: :2');
            expect(() => strip(parser('foo:2'))).toThrow('Unexpected token at 1:1. Remainder: foo:2');
        });
    });
});
