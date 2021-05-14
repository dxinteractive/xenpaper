import {centsToRatio, octaveDivisionToRatio, sortByTime, scoreToMs} from '../mosc';

describe('centsToRatio', () => {
    it('should convert cent to ratio', () => {
        expect(centsToRatio(0)).toBe(1);
        expect(centsToRatio(-1200)).toBe(0.5);
        expect(centsToRatio(2400)).toBe(4);
        expect(Math.floor(centsToRatio(702) * 1000) / 1000).toBe(3/2);
    });

    it('should convert cent to ratio with octave', () => {
        expect(centsToRatio(0, 1)).toBe(2);
        expect(centsToRatio(0, 2)).toBe(4);
        expect(Math.floor(centsToRatio(702, 1) * 1000) / 1000).toBe(3);
    });
});

describe('octaveDivisionToRatio', () => {
    it('should octave division to ratio', () => {
        expect(octaveDivisionToRatio(4, 12, 2)).toBe(1.2599210498948732);
        expect(octaveDivisionToRatio(6, 6, 2)).toBe(2);
        expect(octaveDivisionToRatio(12, 6, 2)).toBe(4);
        expect(octaveDivisionToRatio(0, 6, 2, 2)).toBe(4);
    });
});

describe('sortByTime', () => {
    it('should sort items by time', () => {
        expect(sortByTime([
            {
                type: 'NOTE_TIME',
                time: 2,
                timeEnd: 2,
                hz: 440
            },
            {
                type: 'NOTE_TIME',
                time: 0,
                timeEnd: 2,
                hz: 550
            },
            {
                type: 'TEMPO',
                lerp: false,
                time: 0,
                bpm: 120
            }
        ])).toEqual([
            {
                type: 'NOTE_TIME',
                time: 0,
                timeEnd: 2,
                hz: 550
            },
            {
                type: 'TEMPO',
                lerp: false,
                time: 0,
                bpm: 120
            },
            {
                type: 'NOTE_TIME',
                time: 2,
                timeEnd: 2,
                hz: 440
            }
        ]);
    });
});


describe('scoreToMs', () => {
    it('should convert mosc items from beat time to real time (ms)', () => {
        expect(scoreToMs({
            sequence: [
                {
                    type: 'TEMPO',
                    lerp: false,
                    time: 0,
                    bpm: 120
                },
                {
                    type: 'NOTE_TIME',
                    time: 0,
                    timeEnd: 1,
                    hz: 440
                },
                {
                    type: 'NOTE_TIME',
                    time: 1,
                    timeEnd: 2,
                    hz: 550
                },
                {
                    type: 'TEMPO',
                    lerp: false,
                    time: 2,
                    bpm: 90
                },
                {
                    type: 'NOTE_TIME',
                    time: 2,
                    timeEnd: 3,
                    hz: 660
                },
                {
                    type: 'PARAM_TIME',
                    time: 4,
                    value: [1,2,3]
                },
                {
                    type: 'TEMPO',
                    lerp: false,
                    time: 5,
                    bpm: 1
                }
            ],
            lengthTime: 6
        })).toEqual({
            sequence: [
                {
                    type: 'NOTE_MS',
                    ms: 0,
                    msEnd: 500,
                    hz: 440
                },
                {
                    type: 'NOTE_MS',
                    ms: 500,
                    msEnd: 1000,
                    hz: 550
                },
                {
                    type: 'NOTE_MS',
                    ms: 1000,
                    msEnd: 1666.6666666666665,
                    hz: 660
                },
                {
                    type: 'PARAM_MS',
                    ms: 2333.333333333333,
                    value: [1,2,3]
                }
            ],
            lengthMs: 63000
        });
    });

    it('should convert mosc items from beat time to real time (ms) with interpolation', () => {
        expect(scoreToMs({
            sequence: [
                {
                    type: 'TEMPO',
                    lerp: false,
                    time: 0,
                    bpm: 120
                },
                {
                    type: 'TEMPO',
                    lerp: false,
                    time: 1,
                    bpm: 120
                },
                {
                    type: 'TEMPO',
                    lerp: true,
                    time: 4,
                    bpm: 60
                },
                {
                    type: 'NOTE_TIME',
                    time: 1,
                    timeEnd: 1,
                    hz: 440
                },
                {
                    type: 'NOTE_TIME',
                    time: 2,
                    timeEnd: 2,
                    hz: 550
                },
                {
                    type: 'NOTE_TIME',
                    time: 3,
                    timeEnd: 3,
                    hz: 660
                },
                {
                    type: 'NOTE_TIME',
                    time: 4,
                    timeEnd: 4,
                    hz: 770
                },
                {
                    type: 'NOTE_TIME',
                    time: 5,
                    timeEnd: 5,
                    hz: 880
                }
            ],
            lengthTime: 5
        })).toEqual({
            sequence: [
                {
                    type: 'NOTE_MS',
                    ms: 500,
                    msEnd: 500,
                    hz: 440
                },
                {
                    type: 'NOTE_MS',
                    ms: 1166.6666666666665,
                    msEnd: 1166.6666666666665,
                    hz: 550
                },
                {
                    type: 'NOTE_MS',
                    ms: 1833.3333333333333,
                    msEnd: 1833.3333333333333,
                    hz: 660
                },
                {
                    type: 'NOTE_MS',
                    ms: 2500,
                    msEnd: 2500,
                    hz: 770
                },
                {
                    type: 'NOTE_MS',
                    ms: 3500,
                    msEnd: 3500,
                    hz: 880
                }
            ],
            lengthMs: 3500
        });
    });
});
