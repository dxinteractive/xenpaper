import {processGrammar} from '../process-grammar';

expect.extend({
  toBeAround(actual, expected, precision = 2) {
    const pass = Math.abs(expected - actual) < Math.pow(10, -precision) / 2;
    if (pass) {
      return {
        message: () => `expected ${actual} not to be around ${expected}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${actual} to be around ${expected}`,
        pass: false
      }
    }
  }
});


const INITIAL_TEMPO = {
    type: 'TEMPO',
    time: 0,
    bpm: 120,
    lerp: false
};

const INITIAL_OSC = {
    type: 'PARAM_TIME',
    time: 0,
    value: {
        type: 'osc',
        osc: 'triangle'
    }
};

const INITIAL_ENV = {
    type: 'PARAM_TIME',
    time: 0,
    value: {
        type: 'env',
        a: 0.006,
        d: 3.3,
        s: 0.5,
        r: 0.33
    }
};

const INITIAL = [
    INITIAL_TEMPO,
    INITIAL_OSC,
    INITIAL_ENV
];

describe('grammar to mosc score', () => {

    //
    // # pitch types
    // 1/1,5/4,3/2,2/1
    // 0c,400c,700c,1200c
    // 220Hz,440Hz,880Hz,1760Hz
    // 0/4o,1/4o,2/4o,3/4o
    //

    const PITCH_TEST = JSON.parse(`{"type":"XenpaperGrammar","sequence":{"type":"Sequence","items":[{"type":"Comment","comment":" pitch types","pos":0},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchRatio","numerator":1,"denominator":1,"pos":14},"pos":14},"tail":{"type":"Comma","delimiter":true,"pos":17},"pos":14},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchRatio","numerator":5,"denominator":4,"pos":18},"pos":18},"tail":{"type":"Comma","delimiter":true,"pos":21},"pos":18},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchRatio","numerator":3,"denominator":2,"pos":22},"pos":22},"tail":{"type":"Comma","delimiter":true,"pos":25},"pos":22},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchRatio","numerator":2,"denominator":1,"pos":26},"pos":26},"pos":26},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchCents","cents":0,"pos":30},"pos":30},"tail":{"type":"Comma","delimiter":true,"pos":32},"pos":30},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchCents","cents":400,"pos":33},"pos":33},"tail":{"type":"Comma","delimiter":true,"pos":37},"pos":33},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchCents","cents":700,"pos":38},"pos":38},"tail":{"type":"Comma","delimiter":true,"pos":42},"pos":38},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchCents","cents":1200,"pos":43},"pos":43},"pos":43},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchHz","hz":220,"pos":49},"pos":49},"tail":{"type":"Comma","delimiter":true,"pos":54},"pos":49},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchHz","hz":440,"pos":55},"pos":55},"tail":{"type":"Comma","delimiter":true,"pos":60},"pos":55},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchHz","hz":880,"pos":61},"pos":61},"tail":{"type":"Comma","delimiter":true,"pos":66},"pos":61},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchHz","hz":1760,"pos":67},"pos":67},"pos":67},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchOctaveDivision","numerator":0,"denominator":4,"octaveSize":2,"pos":74},"pos":74},"tail":{"type":"Comma","delimiter":true,"pos":78},"pos":74},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchOctaveDivision","numerator":1,"denominator":4,"octaveSize":2,"pos":79},"pos":79},"tail":{"type":"Comma","delimiter":true,"pos":83},"pos":79},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchOctaveDivision","numerator":2,"denominator":4,"octaveSize":2,"pos":84},"pos":84},"tail":{"type":"Comma","delimiter":true,"pos":88},"pos":84},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchOctaveDivision","numerator":3,"denominator":4,"octaveSize":2,"pos":89},"pos":89},"pos":89}],"pos":0},"pos":0}`);

    it('should translate pitch types', () => {
        expect(processGrammar(PITCH_TEST).score).toEqual({
            sequence: [
                ...INITIAL,
                // pitch ratios
                {
                    type: 'NOTE_TIME',
                    time: 0,
                    timeEnd: 0.5,
                    hz: 440,
                    label: '1/1'
                },
                {
                    type: 'NOTE_TIME',
                    time: 0.5,
                    timeEnd: 1,
                    hz: 550,
                    label: '5/4'
                },
                {
                    type: 'NOTE_TIME',
                    time: 1,
                    timeEnd: 1.5,
                    hz: 660,
                    label: '3/2'
                },
                {
                    type: 'NOTE_TIME',
                    time: 1.5,
                    timeEnd: 2,
                    hz: 880,
                    label: '2/1'
                },
                // pitch cents
                {
                    type: 'NOTE_TIME',
                    time: 2,
                    timeEnd: 2.5,
                    hz: 440,
                    label: '0c'
                },
                {
                    type: 'NOTE_TIME',
                    time: 2.5,
                    timeEnd: 3,
                    hz: 554.3652619537442,
                    label: '400c'
                },
                {
                    type: 'NOTE_TIME',
                    time: 3,
                    timeEnd: 3.5,
                    hz: 659.2551138257398,
                    label: '700c'
                },
                {
                    type: 'NOTE_TIME',
                    time: 3.5,
                    timeEnd: 4,
                    hz: 880,
                    label: '1200c'
                },
                // pitch hz
                {
                    type: 'NOTE_TIME',
                    time: 4,
                    timeEnd: 4.5,
                    hz: 220,
                    label: '220Hz'
                },
                {
                    type: 'NOTE_TIME',
                    time: 4.5,
                    timeEnd: 5,
                    hz: 440,
                    label: '440Hz'
                },
                {
                    type: 'NOTE_TIME',
                    time: 5,
                    timeEnd: 5.5,
                    hz: 880,
                    label: '880Hz'
                },
                {
                    type: 'NOTE_TIME',
                    time: 5.5,
                    timeEnd: 6,
                    hz: 1760,
                    label: '1760Hz'
                },
                // pitch octave divisions
                {
                    type: 'NOTE_TIME',
                    time: 6,
                    timeEnd: 6.5,
                    hz: 440,
                    label: '0\\4'
                },
                {
                    type: 'NOTE_TIME',
                    time: 6.5,
                    timeEnd: 7,
                    // @ts-ignore
                    hz: expect.toBeAround(523.2511306011972),
                    label: '1\\4'
                },
                {
                    type: 'NOTE_TIME',
                    time: 7,
                    timeEnd: 7.5,
                    // @ts-ignore
                    hz: expect.toBeAround(622.2539674441618),
                    label: '2\\4'
                },
                {
                    type: 'NOTE_TIME',
                    time: 7.5,
                    timeEnd: 8,
                    // @ts-ignore
                    hz: expect.toBeAround(739.9888454232688),
                    label: '3\\4'
                },
                {
                    type: 'END_TIME',
                    time: 8
                }
            ],
            lengthTime: 8
        });
    });

    //
    // # scale degrees
    // 0,4,7,12
    //
    // {1/1,5/4,3/2,2/1}
    // 0,1,2,3
    //
    // {19edo}
    // 0,6,11,19
    //
    // {4:5:6:7:8}
    // 0,1,2,4
    //

    const SCALE_TEST = JSON.parse(`{"type":"XenpaperGrammar","sequence":{"type":"Sequence","items":[{"type":"Comment","comment":" scale degrees","pos":0},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":16},"pos":16},"tail":{"type":"Comma","delimiter":true,"pos":17},"pos":16},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":4,"pos":18},"pos":18},"tail":{"type":"Comma","delimiter":true,"pos":19},"pos":18},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":7,"pos":20},"pos":20},"tail":{"type":"Comma","delimiter":true,"pos":21},"pos":20},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":12,"pos":22},"pos":22},"pos":22},{"type":"SetScale","scale":{"type":"PitchGroupScale","pitches":[{"type":"Pitch","value":{"type":"PitchRatio","numerator":1,"denominator":1,"pos":27},"pos":27},{"type":"Comma","delimiter":true,"pos":30},{"type":"Pitch","value":{"type":"PitchRatio","numerator":5,"denominator":4,"pos":31},"pos":31},{"type":"Comma","delimiter":true,"pos":34},{"type":"Pitch","value":{"type":"PitchRatio","numerator":3,"denominator":2,"pos":35},"pos":35},{"type":"Comma","delimiter":true,"pos":38},{"type":"Pitch","value":{"type":"PitchRatio","numerator":2,"denominator":1,"pos":39},"pos":39}],"pos":27},"pos":26},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":44},"pos":44},"tail":{"type":"Comma","delimiter":true,"pos":45},"pos":44},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":1,"pos":46},"pos":46},"tail":{"type":"Comma","delimiter":true,"pos":47},"pos":46},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":2,"pos":48},"pos":48},"tail":{"type":"Comma","delimiter":true,"pos":49},"pos":48},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":3,"pos":50},"pos":50},"pos":50},{"type":"SetScale","scale":{"type":"EdoScale","divisions":19,"octaveSize":2,"pos":54},"pos":53},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":61},"pos":61},"tail":{"type":"Comma","delimiter":true,"pos":62},"pos":61},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":6,"pos":63},"pos":63},"tail":{"type":"Comma","delimiter":true,"pos":64},"pos":63},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":11,"pos":65},"pos":65},"tail":{"type":"Comma","delimiter":true,"pos":67},"pos":65},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":19,"pos":68},"pos":68},"pos":68},{"type":"SetScale","scale":{"type":"RatioChordScale","pitches":[{"type":"RatioChordPitch","pitch":4,"pos":73},{"type":"Colon","delimiter":true,"pos":74},{"type":"RatioChordPitch","pitch":5,"pos":75},{"type":"Colon","delimiter":true,"pos":76},{"type":"RatioChordPitch","pitch":6,"pos":77},{"type":"Colon","delimiter":true,"pos":78},{"type":"RatioChordPitch","pitch":7,"pos":79},{"type":"Colon","delimiter":true,"pos":80},{"type":"RatioChordPitch","pitch":8,"pos":81}],"pos":73},"pos":72},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":84},"pos":84},"tail":{"type":"Comma","delimiter":true,"pos":85},"pos":84},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":1,"pos":86},"pos":86},"tail":{"type":"Comma","delimiter":true,"pos":87},"pos":86},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":2,"pos":88},"pos":88},"tail":{"type":"Comma","delimiter":true,"pos":89},"pos":88},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":4,"pos":90},"pos":90},"pos":90}],"pos":0},"pos":0}`);

    it('should translate scale degrees', () => {
        expect(processGrammar(SCALE_TEST).score).toEqual({
            sequence: [
                ...INITIAL,
                // default scale (12edo)
                {
                    type: 'NOTE_TIME',
                    time: 0,
                    timeEnd: 0.5,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 0.5,
                    timeEnd: 1,
                    hz: 554.3652619537442,
                    label: '4\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 1,
                    timeEnd: 1.5,
                    hz: 659.2551138257398,
                    label: '7\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 1.5,
                    timeEnd: 2,
                    hz: 880,
                    label: '0\\12'
                },
                // ratios scale
                {
                    type: 'NOTE_TIME',
                    time: 2,
                    timeEnd: 2.5,
                    hz: 440,
                    label: '1/1'
                },
                {
                    type: 'NOTE_TIME',
                    time: 2.5,
                    timeEnd: 3,
                    hz: 550,
                    label: '5/4'
                },
                {
                    type: 'NOTE_TIME',
                    time: 3,
                    timeEnd: 3.5,
                    hz: 660,
                    label: '3/2'
                },
                {
                    type: 'NOTE_TIME',
                    time: 3.5,
                    timeEnd: 4,
                    hz: 880,
                    label: '2/1'
                },
                // 19edo scale
                {
                    type: 'NOTE_TIME',
                    time: 4,
                    timeEnd: 4.5,
                    hz: 440,
                    label: '0\\19'
                },
                {
                    type: 'NOTE_TIME',
                    time: 4.5,
                    timeEnd: 5,
                    hz: 547.6647393641703,
                    label: '6\\19'
                },
                {
                    type: 'NOTE_TIME',
                    time: 5,
                    timeEnd: 5.5,
                    hz: 657.2539431279737,
                    label: '11\\19'
                },
                {
                    type: 'NOTE_TIME',
                    time: 5.5,
                    timeEnd: 6,
                    hz: 880,
                    label: '0\\19'
                },
                // multi ratio scale
                {
                    type: 'NOTE_TIME',
                    time: 6,
                    timeEnd: 6.5,
                    hz: 440,
                    label: '4/4'
                },
                {
                    type: 'NOTE_TIME',
                    time: 6.5,
                    timeEnd: 7,
                    hz: 550,
                    label: '5/4'
                },
                {
                    type: 'NOTE_TIME',
                    time: 7,
                    timeEnd: 7.5,
                    hz: 660,
                    label: '6/4'
                },
                {
                    type: 'NOTE_TIME',
                    time: 7.5,
                    timeEnd: 8,
                    hz: 880,
                    label: '8/4'
                },
                {
                    type: 'END_TIME',
                    time: 8
                }
            ],
            lengthTime: 8
        });
    });

    //
    // # timing
    // 0,0,0-0-|0.0--.0.
    //

    const TIMING_TEST = JSON.parse(`{"type":"XenpaperGrammar","sequence":{"type":"Sequence","items":[{"type":"Comment","comment":" timing","pos":0},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":9},"pos":9},"tail":{"type":"Comma","delimiter":true,"pos":10},"pos":9},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":11},"pos":11},"tail":{"type":"Comma","delimiter":true,"pos":12},"pos":11},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":13},"pos":13},"tail":{"type":"Hold","length":1,"pos":14},"pos":13},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":15},"pos":15},"tail":{"type":"Hold","length":1,"pos":16},"pos":15},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":18},"pos":18},"pos":18},{"type":"Rest","length":1,"pos":19},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":20},"pos":20},"tail":{"type":"Hold","length":2,"pos":21},"pos":20},{"type":"Rest","length":1,"pos":23},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":24},"pos":24},"pos":24},{"type":"Rest","length":1,"pos":25}],"pos":0},"pos":0}`);

    it('should translate timing', () => {
        expect(processGrammar(TIMING_TEST).score).toEqual({
            sequence: [
                ...INITIAL,
                {
                    type: 'NOTE_TIME',
                    time: 0,
                    timeEnd: 0.5,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 0.5,
                    timeEnd: 1,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 1,
                    timeEnd: 2,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 2,
                    timeEnd: 3,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 3,
                    timeEnd: 3.5,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 4,
                    timeEnd: 5.5,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 6,
                    timeEnd: 6.5,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'END_TIME',
                    time: 7
                }
            ],
            lengthTime: 7
        });
    });

    //
    // # subdivision
    // 0,0,0
    //
    // (div:1)
    // 0,0,0
    //
    // (div:4)
    // 0,0,0
    //

    const SUBDIVISION_TEST = JSON.parse(`{"type":"XenpaperGrammar","delimiter":false,"sequence":{"type":"Sequence","delimiter":false,"items":[{"type":"Comment","delimiter":false,"comment":" subdivision","len":13,"pos":0},{"type":"Whitespace","delimiter":true,"len":1,"pos":13},{"type":"Note","delimiter":false,"pitch":{"type":"Pitch","delimiter":false,"value":{"type":"PitchDegree","delimiter":false,"degree":0,"len":1,"pos":14},"len":1,"pos":14},"tail":{"type":"Comma","delimiter":true,"len":1,"pos":15},"len":2,"pos":14},{"type":"Note","delimiter":false,"pitch":{"type":"Pitch","delimiter":false,"value":{"type":"PitchDegree","delimiter":false,"degree":0,"len":1,"pos":16},"len":1,"pos":16},"tail":{"type":"Comma","delimiter":true,"len":1,"pos":17},"len":2,"pos":16},{"type":"Note","delimiter":false,"pitch":{"type":"Pitch","delimiter":false,"value":{"type":"PitchDegree","delimiter":false,"degree":0,"len":1,"pos":18},"len":1,"pos":18},"len":1,"pos":18},{"type":"Whitespace","delimiter":true,"len":2,"pos":19},{"type":"SetterGroup","delimiter":false,"setters":[{"type":"SetSubdivision","delimiter":false,"subdivision":1,"len":5,"pos":22}],"len":7,"pos":21},{"type":"Whitespace","delimiter":true,"len":1,"pos":28},{"type":"Note","delimiter":false,"pitch":{"type":"Pitch","delimiter":false,"value":{"type":"PitchDegree","delimiter":false,"degree":0,"len":1,"pos":29},"len":1,"pos":29},"tail":{"type":"Comma","delimiter":true,"len":1,"pos":30},"len":2,"pos":29},{"type":"Note","delimiter":false,"pitch":{"type":"Pitch","delimiter":false,"value":{"type":"PitchDegree","delimiter":false,"degree":0,"len":1,"pos":31},"len":1,"pos":31},"tail":{"type":"Comma","delimiter":true,"len":1,"pos":32},"len":2,"pos":31},{"type":"Note","delimiter":false,"pitch":{"type":"Pitch","delimiter":false,"value":{"type":"PitchDegree","delimiter":false,"degree":0,"len":1,"pos":33},"len":1,"pos":33},"len":1,"pos":33},{"type":"Whitespace","delimiter":true,"len":2,"pos":34},{"type":"SetterGroup","delimiter":false,"setters":[{"type":"SetSubdivision","delimiter":false,"subdivision":4,"len":5,"pos":37}],"len":7,"pos":36},{"type":"Whitespace","delimiter":true,"len":1,"pos":43},{"type":"Note","delimiter":false,"pitch":{"type":"Pitch","delimiter":false,"value":{"type":"PitchDegree","delimiter":false,"degree":0,"len":1,"pos":44},"len":1,"pos":44},"tail":{"type":"Comma","delimiter":true,"len":1,"pos":45},"len":2,"pos":44},{"type":"Note","delimiter":false,"pitch":{"type":"Pitch","delimiter":false,"value":{"type":"PitchDegree","delimiter":false,"degree":0,"len":1,"pos":46},"len":1,"pos":46},"tail":{"type":"Comma","delimiter":true,"len":1,"pos":47},"len":2,"pos":46},{"type":"Note","delimiter":false,"pitch":{"type":"Pitch","delimiter":false,"value":{"type":"PitchDegree","delimiter":false,"degree":0,"len":1,"pos":48},"len":1,"pos":48},"len":1,"pos":48}],"len":49,"pos":0},"len":49,"pos":0}`);

    it('should translate subdivisions', () => {
        expect(processGrammar(SUBDIVISION_TEST).score).toEqual({
            sequence: [
                ...INITIAL,
                {
                    type: 'NOTE_TIME',
                    time: 0,
                    timeEnd: 0.5,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 0.5,
                    timeEnd: 1,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 1,
                    timeEnd: 1.5,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 1.5,
                    timeEnd: 2.5,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 2.5,
                    timeEnd: 3.5,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 3.5,
                    timeEnd: 4.5,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 4.5,
                    timeEnd: 4.75,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 4.75,
                    timeEnd: 5,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 5,
                    timeEnd: 5.25,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'END_TIME',
                    time: 5.25
                }
            ],
            lengthTime: 5.25
        });
    });

    //
    // # tempo changes
    // 0,0
    //
    // (200bpm)
    // 0,0
    //

    const TEMPO_TEST = JSON.parse(`{"type":"XenpaperGrammar","sequence":{"type":"Sequence","items":[{"type":"Comment","comment":" tempo changes","pos":0},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":16},"pos":16},"tail":{"type":"Comma","delimiter":true,"pos":17},"pos":16},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":18},"pos":18},"pos":18},{"type":"SetterGroup","setters":[{"type":"SetBpm","bpm":200,"pos":22}],"pos":21},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":30},"pos":30},"tail":{"type":"Comma","delimiter":true,"pos":31},"pos":30},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":32},"pos":32},"pos":32}],"pos":0},"pos":0}`);

    it('should translate tempo', () => {
        expect(processGrammar(TEMPO_TEST).score).toEqual({
            sequence: [
                ...INITIAL,
                {
                    type: 'NOTE_TIME',
                    time: 0,
                    timeEnd: 0.5,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 0.5,
                    timeEnd: 1,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'TEMPO',
                    time: 1,
                    bpm: 200,
                    lerp: false
                },
                {
                    type: 'NOTE_TIME',
                    time: 1,
                    timeEnd: 1.5,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 1.5,
                    timeEnd: 2,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'END_TIME',
                    time: 2
                }
            ],
            lengthTime: 2
        });
    });

    //
    // # tempo changes with bms
    // 0,0
    //
    // (300 ms per beat)
    // 0,0
    //

    const TEMPO_TEST_BMS = JSON.parse(`{"type":"XenpaperGrammar","sequence":{"type":"Sequence","items":[{"type":"Comment","comment":" tempo changes","pos":0},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":16},"pos":16},"tail":{"type":"Comma","delimiter":true,"pos":17},"pos":16},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":18},"pos":18},"pos":18},{"type":"SetterGroup","setters":[{"type":"SetBms","bms":300,"pos":22}],"pos":21},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":30},"pos":30},"tail":{"type":"Comma","delimiter":true,"pos":31},"pos":30},{"type":"Note","pitch":{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":32},"pos":32},"pos":32}],"pos":0},"pos":0}`);

    it('should translate tempo', () => {
        expect(processGrammar(TEMPO_TEST_BMS).score).toEqual({
            sequence: [
                ...INITIAL,
                {
                    type: 'NOTE_TIME',
                    time: 0,
                    timeEnd: 0.5,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 0.5,
                    timeEnd: 1,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'TEMPO',
                    time: 1,
                    bpm: 200,
                    lerp: false
                },
                {
                    type: 'NOTE_TIME',
                    time: 1,
                    timeEnd: 1.5,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 1.5,
                    timeEnd: 2,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'END_TIME',
                    time: 2
                }
            ],
            lengthTime: 2
        });
    });

    //
    // # chords
    // [0,4,7]-[2,8,11,13]-
    //

    const CHORDS_TEST = JSON.parse(`{"type":"XenpaperGrammar","sequence":{"type":"Sequence","items":[{"type":"Comment","comment":" chords","pos":0},{"type":"Chord","pitches":[{"type":"Pitch","value":{"type":"PitchDegree","degree":0,"pos":10},"pos":10},{"type":"Comma","delimiter":true,"pos":11},{"type":"Pitch","value":{"type":"PitchDegree","degree":4,"pos":12},"pos":12},{"type":"Comma","delimiter":true,"pos":13},{"type":"Pitch","value":{"type":"PitchDegree","degree":7,"pos":14},"pos":14}],"tail":{"type":"Hold","length":1,"pos":16},"pos":9},{"type":"Chord","pitches":[{"type":"Pitch","value":{"type":"PitchDegree","degree":2,"pos":18},"pos":18},{"type":"Comma","delimiter":true,"pos":19},{"type":"Pitch","value":{"type":"PitchDegree","degree":8,"pos":20},"pos":20},{"type":"Comma","delimiter":true,"pos":21},{"type":"Pitch","value":{"type":"PitchDegree","degree":11,"pos":22},"pos":22},{"type":"Comma","delimiter":true,"pos":24},{"type":"Pitch","value":{"type":"PitchDegree","degree":13,"pos":25},"pos":25}],"tail":{"type":"Hold","length":1,"pos":28},"pos":17}],"pos":0},"pos":0}`);

    it('should translate chords', () => {
        expect(processGrammar(CHORDS_TEST).score).toEqual({
            sequence: [
                ...INITIAL,
                {
                    type: 'NOTE_TIME',
                    time: 0,
                    timeEnd: 1,
                    hz: 440,
                    label: '0\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 0,
                    timeEnd: 1,
                    hz: 554.3652619537442,
                    label: '4\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 0,
                    timeEnd: 1,
                    hz: 659.2551138257398,
                    label: '7\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 1,
                    timeEnd: 2,
                    hz: 493.8833012561241,
                    label: '2\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 1,
                    timeEnd: 2,
                    hz: 698.4564628660078,
                    label: '8\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 1,
                    timeEnd: 2,
                    hz: 830.6093951598903,
                    label: '11\\12'
                },
                {
                    type: 'NOTE_TIME',
                    time: 1,
                    timeEnd: 2,
                    hz: 932.3275230361799,
                    label: '1\\12'
                },
                {
                    type: 'END_TIME',
                    time: 2
                }
            ],
            lengthTime: 2
        });
    });

    //
    // # ratio chords
    // 4:5-[4:5]-
    //

    const RATIOCHORDS_TEST = JSON.parse(`{"type":"XenpaperGrammar","sequence":{"type":"Sequence","items":[{"type":"Comment","comment":" ratio chords","pos":0},{"type":"RatioChord","pitches":[{"type":"RatioChordPitch","pitch":4,"pos":15},{"type":"Colon","delimiter":true,"pos":16},{"type":"RatioChordPitch","pitch":5,"pos":17}],"tail":{"type":"Hold","length":1,"pos":18},"pos":15},{"type":"Chord","pitches":[{"type":"RatioChordPitch","pitch":4,"pos":20},{"type":"Colon","delimiter":true,"pos":21},{"type":"RatioChordPitch","pitch":5,"pos":22}],"tail":{"type":"Hold","length":1,"pos":24},"pos":19}],"pos":0},"pos":0}`);

    it('should translate ratio chords', () => {
        expect(processGrammar(RATIOCHORDS_TEST).score).toEqual({
            sequence: [
                ...INITIAL,
                {
                    type: 'NOTE_TIME',
                    time: 0,
                    timeEnd: 1,
                    hz: 440,
                    label: '4/4'
                },
                {
                    type: 'NOTE_TIME',
                    time: 0,
                    timeEnd: 1,
                    hz: 550,
                    label: '5/4'
                },
                {
                    type: 'NOTE_TIME',
                    time: 1,
                    timeEnd: 2,
                    hz: 440,
                    label: '4/4'
                },
                {
                    type: 'NOTE_TIME',
                    time: 1,
                    timeEnd: 2,
                    hz: 550,
                    label: '5/4'
                },
                {
                    type: 'END_TIME',
                    time: 2
                }
            ],
            lengthTime: 2
        });
    });
});

describe('grammar to ruler state', () => {

    //
    // 1 (rl:0,'0) 2
    //

    const RULER_RANGE_TEST = JSON.parse(`{"type":"XenpaperGrammar","delimiter":false,"sequence":{"type":"Sequence","delimiter":false,"items":[{"type":"Note","delimiter":false,"pitch":{"type":"Pitch","delimiter":false,"value":{"type":"PitchDegree","delimiter":false,"degree":1,"len":1,"pos":0},"len":1,"pos":0},"len":1,"pos":0},{"type":"Whitespace","delimiter":true,"len":1,"pos":1},{"type":"SetterGroup","delimiter":false,"setters":[{"type":"SetRulerRange","delimiter":false,"low":{"type":"Pitch","delimiter":false,"value":{"type":"PitchDegree","delimiter":false,"degree":0,"len":1,"pos":6},"len":1,"pos":6},"high":{"type":"Pitch","delimiter":false,"value":{"type":"PitchDegree","delimiter":false,"degree":0,"len":1,"pos":9},"octave":{"type":"OctaveModifier","delimiter":false,"octave":1,"len":1,"pos":8},"len":2,"pos":8},"len":7,"pos":3}],"len":9,"pos":2},{"type":"Whitespace","delimiter":true,"len":1,"pos":11},{"type":"Note","delimiter":false,"pitch":{"type":"Pitch","delimiter":false,"value":{"type":"PitchDegree","delimiter":false,"degree":2,"len":1,"pos":12},"len":1,"pos":12},"len":1,"pos":12}],"len":13,"pos":0},"len":13,"pos":0}`);

    it('should translate ruler range', () => {
        expect(processGrammar(RULER_RANGE_TEST).initialRulerState).toEqual({
            lowHz: 440,
            highHz: 880
        });
    });
});
