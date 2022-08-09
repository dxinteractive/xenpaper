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
    SetPrimesType,
    SetRulerRangeType,
    DelimiterType,
} from "./grammar";

import type {
    MoscScore,
    MoscItem,
    MoscNote,
    MoscNoteMs,
    MoscTempo,
    MoscParam,
    MoscEnd,
} from "@xenpaper/mosc";

import {
    centsToRatio,
    octaveDivisionToRatio,
    timeToMs,
    ratioToCents,
} from "@xenpaper/mosc";

//
// utils
//

const limit = (name: string, value: number, min: number, max: number): void => {
    if (value < min || value > max) {
        throw new Error(
            `${name} must be between ${min} and ${max}, got ${value}`
        );
    }
};

/**
 * An arbitrarily long list of primes so that prime decomposition of ratios can happen more efficiently.
 * Hope that no one uses anything more than 6691-limit just intonation.
 */
const LIST_OF_PRIMES: number[] = [
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89,
    97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191,
    193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293,
    307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419,
    421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541,
    547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653,
    659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787,
    797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919,
    929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997, 1009, 1013, 1019, 1021, 1031, 1033, 1039, 1049,
    1051, 1061, 1063, 1069, 1087, 1091, 1093, 1097, 1103, 1109, 1117, 1123, 1129, 1151, 1153, 1163, 1171, 1181, 1187, 1193,
    1201, 1213, 1217, 1223, 1229, 1231, 1237, 1249, 1259, 1277, 1279, 1283, 1289, 1291, 1297, 1301, 1303, 1307, 1319, 1321,
    1327, 1361, 1367, 1373, 1381, 1399, 1409, 1423, 1427, 1429, 1433, 1439, 1447, 1451, 1453, 1459, 1471, 1481, 1483, 1487,
    1489, 1493, 1499, 1511, 1523, 1531, 1543, 1549, 1553, 1559, 1567, 1571, 1579, 1583, 1597, 1601, 1607, 1609, 1613, 1619,
    1621, 1627, 1637, 1657, 1663, 1667, 1669, 1693, 1697, 1699, 1709, 1721, 1723, 1733, 1741, 1747, 1753, 1759, 1777, 1783,
    1787, 1789, 1801, 1811, 1823, 1831, 1847, 1861, 1867, 1871, 1873, 1877, 1879, 1889, 1901, 1907, 1913, 1931, 1933, 1949,
    1951, 1973, 1979, 1987, 1993, 1997, 1999, 2003, 2011, 2017, 2027, 2029, 2039, 2053, 2063, 2069, 2081, 2083, 2087, 2089,
    2099, 2111, 2113, 2129, 2131, 2137, 2141, 2143, 2153, 2161, 2179, 2203, 2207, 2213, 2221, 2237, 2239, 2243, 2251, 2267,
    2269, 2273, 2281, 2287, 2293, 2297, 2309, 2311, 2333, 2339, 2341, 2347, 2351, 2357, 2371, 2377, 2381, 2383, 2389, 2393,
    2399, 2411, 2417, 2423, 2437, 2441, 2447, 2459, 2467, 2473, 2477, 2503, 2521, 2531, 2539, 2543, 2549, 2551, 2557, 2579,
    2591, 2593, 2609, 2617, 2621, 2633, 2647, 2657, 2659, 2663, 2671, 2677, 2683, 2687, 2689, 2693, 2699, 2707, 2711, 2713,
    2719, 2729, 2731, 2741, 2749, 2753, 2767, 2777, 2789, 2791, 2797, 2801, 2803, 2819, 2833, 2837, 2843, 2851, 2857, 2861,
    2879, 2887, 2897, 2903, 2909, 2917, 2927, 2939, 2953, 2957, 2963, 2969, 2971, 2999, 3001, 3011, 3019, 3023, 3037, 3041,
    3049, 3061, 3067, 3079, 3083, 3089, 3109, 3119, 3121, 3137, 3163, 3167, 3169, 3181, 3187, 3191, 3203, 3209, 3217, 3221,
    3229, 3251, 3253, 3257, 3259, 3271, 3299, 3301, 3307, 3313, 3319, 3323, 3329, 3331, 3343, 3347, 3359, 3361, 3371, 3373,
    3389, 3391, 3407, 3413, 3433, 3449, 3457, 3461, 3463, 3467, 3469, 3491, 3499, 3511, 3517, 3527, 3529, 3533, 3539, 3541,
    3547, 3557, 3559, 3571, 3581, 3583, 3593, 3607, 3613, 3617, 3623, 3631, 3637, 3643, 3659, 3671, 3673, 3677, 3691, 3697,
    3701, 3709, 3719, 3727, 3733, 3739, 3761, 3767, 3769, 3779, 3793, 3797, 3803, 3821, 3823, 3833, 3847, 3851, 3853, 3863,
    3877, 3881, 3889, 3907, 3911, 3917, 3919, 3923, 3929, 3931, 3943, 3947, 3967, 3989, 4001, 4003, 4007, 4013, 4019, 4021,
    4027, 4049, 4051, 4057, 4073, 4079, 4091, 4093, 4099, 4111, 4127, 4129, 4133, 4139, 4153, 4157, 4159, 4177, 4201, 4211,
    4217, 4219, 4229, 4231, 4241, 4243, 4253, 4259, 4261, 4271, 4273, 4283, 4289, 4297, 4327, 4337, 4339, 4349, 4357, 4363,
    4373, 4391, 4397, 4409, 4421, 4423, 4441, 4447, 4451, 4457, 4463, 4481, 4483, 4493, 4507, 4513, 4517, 4519, 4523, 4547,
    4549, 4561, 4567, 4583, 4591, 4597, 4603, 4621, 4637, 4639, 4643, 4649, 4651, 4657, 4663, 4673, 4679, 4691, 4703, 4721,
    4723, 4729, 4733, 4751, 4759, 4783, 4787, 4789, 4793, 4799, 4801, 4813, 4817, 4831, 4861, 4871, 4877, 4889, 4903, 4909,
    4919, 4931, 4933, 4937, 4943, 4951, 4957, 4967, 4969, 4973, 4987, 4993, 4999, 5003, 5009, 5011, 5021, 5023, 5039, 5051,
    5059, 5077, 5081, 5087, 5099, 5101, 5107, 5113, 5119, 5147, 5153, 5167, 5171, 5179, 5189, 5197, 5209, 5227, 5231, 5233,
    5237, 5261, 5273, 5279, 5281, 5297, 5303, 5309, 5323, 5333, 5347, 5351, 5381, 5387, 5393, 5399, 5407, 5413, 5417, 5419,
    5431, 5437, 5441, 5443, 5449, 5471, 5477, 5479, 5483, 5501, 5503, 5507, 5519, 5521, 5527, 5531, 5557, 5563, 5569, 5573,
    5581, 5591, 5623, 5639, 5641, 5647, 5651, 5653, 5657, 5659, 5669, 5683, 5689, 5693, 5701, 5711, 5717, 5737, 5741, 5743,
    5749, 5779, 5783, 5791, 5801, 5807, 5813, 5821, 5827, 5839, 5843, 5849, 5851, 5857, 5861, 5867, 5869, 5879, 5881, 5897,
    5903, 5923, 5927, 5939, 5953, 5981, 5987, 6007, 6011, 6029, 6037, 6043, 6047, 6053, 6067, 6073, 6079, 6089, 6091, 6101,
    6113, 6121, 6131, 6133, 6143, 6151, 6163, 6173, 6197, 6199, 6203, 6211, 6217, 6221, 6229, 6247, 6257, 6263, 6269, 6271,
    6277, 6287, 6299, 6301, 6311, 6317, 6323, 6329, 6337, 6343, 6353, 6359, 6361, 6367, 6373, 6379, 6389, 6397, 6421, 6427,
    6449, 6451, 6469, 6473, 6481, 6491, 6521, 6529, 6547, 6551, 6553, 6563, 6569, 6571, 6577, 6581, 6599, 6607, 6619, 6637,
    6653, 6659, 6661, 6673, 6679, 6689, 6691
];

/**
 * Prime factorizes `n` to positive/zero integer powers of consecutive primes.
 * @param n The number to factorize
 * @returns [a, b, c, ...] where 2^a * 3^b * 5^c * ... is the factorization of `n`,
 *          or null if the number contains primes that are too large.
 */
const primeFactorize = (n: number): number[] | null => {
    const factors: number[] = [];
    // note: every = forEach, but breaks when false is returned.
    LIST_OF_PRIMES.every(p => {
        let power = 0;

        while (n % p === 0) {
            power++;
            n /= p;
        }
        factors.push(power);
        return n > 1; // break if n is 1
    });
    if (n > 1) {
        // null return if number is above 6691 prime limit.
        return null;
    }
    return factors;
}

/**
 * Converts a (numerator, denominator) tuple to an actual relative pitch ratio float,
 * taking into account the `context.primesTuning`.
 * @param num
 * @param denom
 * @param context
 */
const realizeRatio = (num: number, denom: number, context: Context): number => {
    const num_factors = primeFactorize(num);
    const denom_factors = primeFactorize(denom);

    let ratio = 1.0;

    if (num_factors == null || denom_factors == null) {
        console.warn(`WARN xenpaper: ratio ${num}/${denom} is too high prime-limit to factorize, ignoring context.primesTuning`);
        return num / denom;
    }
    num_factors.forEach((power, i) => {
        if (context.primesTuning.length > i) {
            ratio *= Math.pow(context.primesTuning[i], power);
        } else {
            ratio *= Math.pow(LIST_OF_PRIMES[i], power);
        }
    });
    denom_factors.forEach((power, i) => {
        if (context.primesTuning.length > i) {
            ratio /= Math.pow(context.primesTuning[i], power);
        } else {
            ratio /= Math.pow(LIST_OF_PRIMES[i], power);
        }
    });
    return ratio;
}

/**
 * Converts PitchType object to pitch ratio.
 *
 * If an absolute PitchHz is specified, it is taken to be a ratio with
 * respect to the current value of `context.rootHz`
 * @param pitch The PitchType to convert
 * @param context global context object
 * @returns `pitch` as a relative ratio (float)
 */

export const pitchToRatio = (pitch: PitchType, context: Context): number => {
    const { scale, octaveSize } = context;
    limit("Equave size", octaveSize, -20, 20);

    const { type } = pitch.value;
    const octaveMulti = Math.pow(octaveSize, pitch?.octave?.octave || 0);

    if (type === "PitchRatio") {
        const { numerator, denominator } = pitch.value as PitchRatioType;
        const ratio = realizeRatio(numerator, denominator, context);
        limit("Pitch ratio", ratio, 0, 100);
        return ratio * octaveMulti;
    }

    if (type === "PitchCents") {
        const { cents } = pitch.value as PitchCentsType;
        limit("Cents", cents, -12000, 12000);
        return centsToRatio(cents) * octaveMulti;
    }

    if (type === "PitchOctaveDivision") {
        const { numerator: steps, denominator: stepsInOctave, octaveSize } =
            pitch.value as PitchOctaveDivisionType;
        return (
            octaveDivisionToRatio(steps, stepsInOctave, octaveSize) *
            octaveMulti
        );
    }

    if (type === "PitchDegree") {
        const { degree } = pitch.value as PitchDegreeType;
        return pitchDegreeToRatio(degree, scale, octaveSize) * octaveMulti;
    }

    if (type === "PitchHz") {
        const { hz } = pitch.value as PitchHzType;
        limit("Hz", hz, 0, 20000);
        return hz / context.rootHz * octaveMulti;
    }

    throw new Error(`Unknown pitch type "${type}"`);
};

const edoToRatios = (edoSize: number, octaveSize: number): number[] => {
    const ratios: number[] = [];
    for (let i = 0; i < edoSize; i++) {
        ratios.push(octaveDivisionToRatio(i, edoSize, octaveSize));
    }
    return ratios;
};

const pitchDegreeWrap = (degree: number, scale: number[]): [number, number] => {
    limit("Scale degree", degree, -1000, 1000);

    const steps = scale.length;
    let octave = 0;

    while (degree >= steps && octave > -20) {
        degree -= steps;
        octave++;
    }
    while (degree < 0 && octave < 20) {
        degree += steps;
        octave--;
    }

    return [degree, octave];
};

const pitchDegreeToRatio = (
    degree: number,
    scale: number[],
    octaveSize: number
): number => {
    limit("Equave size", octaveSize, -20, 20);

    if (scale.length === 0) {
        return 1;
    }

    const [wrappedDegree, octave] = pitchDegreeWrap(degree, scale);
    return scale[wrappedDegree] * Math.pow(octaveSize, octave);
};

const pitchToHz = (pitch: PitchType, context: Context): number => {
    if (pitch.value.type === "PitchHz") {
        const octaveMulti = Math.pow(
            context.octaveSize,
            pitch?.octave?.octave || 0
        );
        const hz = (pitch.value as PitchHzType).hz * octaveMulti;
        limit("Hz", hz, 0, 20000);
        return hz;
    }
    return pitchToRatio(pitch, context) * context.rootHz;
};

const tailToTime = (
    tail: TailType | undefined,
    context: Context
): { time: number; timeEnd: number } => {
    const time = context.time;

    const duration =
        tail && tail.type === "Hold" ? (tail as HoldType).length + 1 : 1;

    context.time += duration * context.subdivision;
    const timeEnd = context.time;

    return {
        time,
        timeEnd,
    };
};

//
// labels
//

const ratioWrap = (ratio: number, octaveSize: number): number => {
    while (ratio < 1) {
        ratio *= octaveSize;
    }
    while (ratio > octaveSize) {
        ratio /= octaveSize;
    }
    return ratio;
};

const ratioToCentsLabel = (ratio: number, octaveSize: number): string => {
    return `${ratioToCents(ratioWrap(ratio, octaveSize)).toFixed(1)}c`;
};

export const pitchToLabel = (pitch: PitchType, context: Context): string => {
    const { type } = pitch.value;

    if (type === "PitchHz") {
        const { hz } = pitch.value as PitchHzType;
        return `${hz}Hz`;
    }

    if (type === "PitchCents") {
        const { cents } = pitch.value as PitchCentsType;
        return `${cents}c`;
    }

    const centsLabel = ratioToCentsLabel(
        pitchToRatio(pitch, context),
        context.octaveSize
    );

    if (type === "PitchRatio") {
        const { numerator, denominator } = pitch.value as PitchRatioType;
        return `${numerator}/${denominator}  ${centsLabel}`;
    }

    if (type === "PitchOctaveDivision") {
        const { numerator, denominator } =
            pitch.value as PitchOctaveDivisionType;
        return `${numerator}\\${denominator}  ${centsLabel}`;
    }

    if (type === "PitchDegree") {
        const { degree } = pitch.value as PitchDegreeType;
        const [wrappedDegree] = pitchDegreeWrap(degree, context.scale);
        return context.scaleLabels[wrappedDegree];
    }

    throw new Error(`Unknown pitch type "${type}"`);
};

const edoToLabels = (
    edoSize: number,
    ratios: number[],
    octaveSize: number
): string[] => {
    const labels: string[] = [];
    for (let i = 0; i < edoSize; i++) {
        const centsLabel = ratioToCentsLabel(ratios[i], octaveSize);
        labels.push(`${i}\\${edoSize}  ${centsLabel}`);
    }
    return labels;
};

//
// converters
//

const ENV_VALUES = [0, 0.003, 0.006, 0.01, 0.033, 0.1, 0.33, 1, 3.3, 10];

type Context = {
    rootHz: number;
    time: number;
    subdivision: number;
    scale: number[];
    scaleLabels: string[];
    octaveSize: number;
    /**
     * The relative tuning of each prime as a ratio of the root 1/1
     * Only used when calculating freq of PitchRatios.
     *
     * e.g. if primesTuning == [2, 3, 5, 7, 11],
     * the PitchRatio 5/4 will be rendered as per normal.
     *
     * However, if primesTuning == [2, 2^(18/31), 2^(41/31)],
     * the PitchRatio 5/4 will be tuned to that of 31 edo.
     *
     * If a prime used in a PitchRatio uses a prime that is above the highest
     * defined prime in the prime tuning array, it would default to the original prime value.
     *
     * e.g.: if primesTuning = [2, 2^(7/12)],
     * the PitchRatio 5/3 will be tuned like so:
     * - Down a 12edo perfect fifth and an octave
     * - Up a justly tuned 5th harmonic (since the prime 5 is not defined)
     */
    primesTuning: number[];
};

const times: [number, number][] = [];

const noteToMosc = (note: NoteType, context: Context): MoscNote[] => {
    const timeProps = tailToTime(note.tail, context);

    // mutate ast node to add time
    const arr: [number, number] = [timeProps.time, timeProps.timeEnd];
    times.push(arr);
    note.time = arr;

    const hz = pitchToHz(note.pitch, context);
    const label = pitchToLabel(note.pitch, context);

    return [
        {
            type: "NOTE_TIME",
            hz,
            label,
            ...timeProps,
        },
    ];
};

const chordToMosc = (
    chord: ChordType | RatioChordType,
    context: Context
): MoscNote[] => {
    const { tail, pitches } = chord;
    const timeProps = tailToTime(tail, context);

    // mutate ast node to add time
    const arr: [number, number] = [timeProps.time, timeProps.timeEnd];
    times.push(arr);
    chord.time = arr;

    const pitchTypes: MoscNote[] = pitches
        .filter((pitch): pitch is PitchType => pitch.type === "Pitch")
        .map((pitch: any) => {
            const hz = pitchToHz(pitch as PitchType, context);
            const label = pitchToLabel(pitch as PitchType, context);

            return {
                type: "NOTE_TIME",
                hz,
                label,
                ...timeProps,
            };
        });

    const firstRatioPitch = pitches.find(
        (pitch: PitchType | RatioChordPitchType | DelimiterType) => {
            return pitch.type === "RatioChordPitch";
        }
    ) as RatioChordPitchType | undefined;

    const firstDenominator = (firstRatioPitch as RatioChordPitchType)?.pitch;

    if (firstDenominator <= 0) {
        throw new Error(`Chords cannot contain a ratio of ${firstDenominator}`);
    }

    const ratioPitchTypes: MoscNote[] = [];
    const addRatioPitchType = (numerator: number): void => {
        ratioPitchTypes.push({
            type: "NOTE_TIME",
            hz: realizeRatio(numerator, firstDenominator, context) * context.rootHz,
            label: `${numerator}/${firstDenominator}  ${ratioToCentsLabel(
                numerator / firstDenominator,
                context.octaveSize
            )}`,
            ...timeProps,
        });
    };

    let colons = 0;
    let lastNumerator = 1;
    pitches.forEach((pitch: any) => {
        if (pitch.type === "RatioChordPitch") {
            const numerator = (pitch as RatioChordPitchType).pitch;
            if (numerator <= 0) {
                throw new Error(
                    `Chords cannot contain a ratio of ${numerator}`
                );
            }

            if (colons == 2) {
                while (lastNumerator < numerator - 1) {
                    lastNumerator++;
                    addRatioPitchType(lastNumerator);
                }
            }

            addRatioPitchType(numerator);
            lastNumerator = numerator;
            colons = 0;
            return;
        }
        if (pitch.type === "Colon") {
            colons++;
        }
    });

    return pitchTypes.concat(ratioPitchTypes);
};

const setScale = (setScale: SetScaleType, context: Context): void => {
    const { scale } = setScale;
    const { type } = scale;
    if (type === "PitchGroupScale") {
        const { pitches, scaleOctaveMarker, pitchGroupScalePrefix } =
            scale as PitchGroupScaleType;

        let filteredPitches: PitchType[] = pitches.filter(
            (pitch): pitch is PitchType => !pitch.delimiter
        ) as PitchType[];

        if (pitchGroupScalePrefix && pitchGroupScalePrefix.prefix === "m") {
            const degreePitches: PitchDegreeType[] = [
                {
                    type: "PitchDegree",
                    degree: 0,
                    delimiter: false,
                    pos: pitchGroupScalePrefix.pos,
                    len: 0,
                },
            ];

            let degree = 0;
            filteredPitches.forEach((pitch) => {
                if (pitch.value.type !== "PitchDegree") {
                    throw new Error(
                        "Mode scales {m} should only contain pitch degrees (0, 1, etc), not ratios, hz or any other kind of pitch"
                    );
                }
                degree += (pitch.value as PitchDegreeType).degree;

                degreePitches.push({
                    ...pitch.value,
                    degree,
                });
            });

            degreePitches.pop(); // ignore last degree which is assumed to complete the octave
            filteredPitches = degreePitches.map((value) => ({
                value,
            })) as PitchType[];
        }

        context.scale = filteredPitches.map((pitch) =>
            pitchToRatio(pitch, context)
        );
        context.scaleLabels = filteredPitches.map((pitch) =>
            pitchToLabel(pitch, context)
        );

        if (scaleOctaveMarker) {
            context.octaveSize = context.scale.pop() || 2;
            context.scaleLabels.pop();
        }

        return;
    }

    if (type === "EdoScale") {
        const { divisions, octaveSize } = scale as EdoScaleType;
        context.scale = edoToRatios(divisions, octaveSize);
        context.scaleLabels = edoToLabels(divisions, context.scale, octaveSize);
        context.octaveSize = octaveSize;
        return;
    }

    if (type === "RatioChordScale") {
        const { pitches, scaleOctaveMarker } = scale as RatioChordScaleType;

        context.scale = [];
        context.scaleLabels = [];

        let firstDenominator = -1;
        let colons = 0;
        let lastNumerator = 0;

        const addRatio = (numerator: number): void => {
            const ratio = realizeRatio(numerator, firstDenominator, context);
            context.scale.push(ratio);
            const centsLabel = ratioToCentsLabel(ratio, 2);
            context.scaleLabels.push(
                `${numerator}/${firstDenominator}  ${centsLabel}`
            );
        };

        pitches.forEach((pitch) => {
            if (pitch.delimiter) {
                colons++;
                return;
            }

            const numerator = pitch.pitch;
            if (firstDenominator === -1) {
                firstDenominator = numerator;
            }

            if (colons === 2) {
                while (lastNumerator < numerator - 1) {
                    lastNumerator++;
                    addRatio(lastNumerator);
                }
            }

            addRatio(numerator);
            lastNumerator = numerator;
            colons = 0;
        });

        if (scaleOctaveMarker) {
            context.octaveSize = context.scale.pop() || 2;
            context.scaleLabels.pop();
        }

        return;
    }

    throw new Error(`Unknown scale type "${type}"`);
};

const setPrimes = (setPrimes: SetPrimesType, context: Context): void => {
    const { primesPitches } = setPrimes;

    console.debug(setPrimes);

    let filteredPitches: PitchType[] = primesPitches.filter(
        (pitch): pitch is PitchType => !pitch.delimiter
    ) as PitchType[];

    context.primesTuning = filteredPitches.map(pitch =>
        pitchToRatio(pitch, context)
    );
}

const setterToMosc = (setter: SetterType, context: Context): MoscItem[] => {
    const { type, delimiter } = setter;

    if (delimiter) return [];

    if (type === "SetBpm") {
        const { bpm } = setter as SetBpmType;
        return [
            {
                type: "TEMPO",
                time: context.time,
                bpm,
                lerp: false,
            },
        ];
    }

    if (type === "SetBms") {
        const { bms } = setter as SetBmsType;
        return [
            {
                type: "TEMPO",
                time: context.time,
                bpm: 60000 / bms,
                lerp: false,
            },
        ];
    }

    if (type === "SetSubdivision") {
        const { subdivision, denominator } = setter as SetSubdivisionType;
        context.subdivision = (denominator ?? 1) / subdivision;
        return [];
    }

    if (type === "SetOsc") {
        const { osc } = setter as SetOscType;
        return [
            {
                type: "PARAM_TIME",
                time: context.time,
                value: {
                    type: "osc",
                    osc,
                },
            },
        ];
    }

    if (type === "SetEnv") {
        const { a, d, s, r } = setter as SetEnvType;
        return [
            {
                type: "PARAM_TIME",
                time: context.time,
                value: {
                    type: "env",
                    a: ENV_VALUES[a] || 0,
                    d: ENV_VALUES[d] || 0,
                    s: s / 9,
                    r: ENV_VALUES[r] || 0,
                },
            },
        ];
    }

    return [];
};

const rulerStateCaptureRootHz = (
    initial: InitialRulerState,
    context: Context
): InitialRulerState => {
    if (initial.rootHz) {
        return initial;
    }
    return {
        ...initial,
        rootHz: context.rootHz,
        octaveSize: context.octaveSize,
    };
};

export type InitialRulerState = {
    lowHz?: number;
    highHz?: number;
    rootHz?: number;
    octaveSize?: number;
    plots: MoscNoteMs[][];
};

const setterToRulerState = (
    initial: InitialRulerState,
    setter: SetterType,
    context: Context
): InitialRulerState => {
    const { type, delimiter } = setter;

    if (delimiter) return initial;

    if (type === "SetRulerPlot") {
        const newPlot = context.scale.map(
            (ratio, i): MoscNoteMs => ({
                type: "NOTE_MS",
                ms: context.time,
                msEnd: context.time,
                hz: ratio * context.rootHz,
                label: context.scaleLabels[i],
            })
        );

        return {
            ...initial,
            plots: [...initial.plots, newPlot],
        };
    }

    if (type === "SetRulerRange") {
        if (initial.lowHz) {
            return initial;
        }

        const { low, high } = setter as SetRulerRangeType;
        return {
            ...initial,
            lowHz: pitchToHz(low, context),
            highHz: pitchToHz(high, context),
        };
    }

    return initial;
};

export type Processed = {
    score?: MoscScore;
    initialRulerState?: InitialRulerState;
};

export const processGrammar = (grammar: XenpaperAST): Processed => {
    // console.log('grammar', JSON.stringify(grammar));

    const grammarSequence = grammar.sequence;
    if (!grammarSequence) {
        return {};
    }

    const INITIAL_TEMPO: MoscTempo = {
        type: "TEMPO",
        time: 0,
        bpm: 120,
        lerp: false,
    };

    const INITIAL_OSC: MoscParam = {
        type: "PARAM_TIME",
        time: 0,
        value: {
            type: "osc",
            osc: "triangle",
        },
    };

    const INITIAL_ENV: MoscParam = {
        type: "PARAM_TIME",
        time: 0,
        value: {
            type: "env",
            a: ENV_VALUES[2],
            d: ENV_VALUES[8],
            s: 0.5,
            r: ENV_VALUES[6],
        },
    };

    const scale = edoToRatios(12, 2);

    const context: Context = {
        rootHz: 220,
        time: 0,
        subdivision: 0.5,
        scale,
        scaleLabels: edoToLabels(12, scale, 2),
        octaveSize: 2,
        primesTuning: []
    };

    const moscItems: MoscItem[] = [];
    let initialRulerState: InitialRulerState = {
        plots: [],
    };

    grammarSequence.items.forEach((item): void => {
        const { type } = item;
        if (type === "Comment" || type === "BarLine" || type === "Whitespace") {
            // do nothing
            return;
        }

        if (type === "SetScale") {
            setScale(item as SetScaleType, context);
            return;
        }

        if (type === "SetRoot") {
            const { pitch } = item as SetRootType;
            context.rootHz = pitchToHz(pitch, context);
            return;
        }

        if (type === "Note") {
            moscItems.push(...noteToMosc(item as NoteType, context));
            initialRulerState = rulerStateCaptureRootHz(
                initialRulerState,
                context
            );
            return;
        }

        if (type === "Rest") {
            const { time } = context;
            const rest = item as RestType;
            context.time += rest.length * context.subdivision;
            // mutate ast node to add time
            const arr: [number, number] = [time, context.time];
            times.push(arr);
            rest.time = arr;
            return;
        }

        if (type === "Chord") {
            moscItems.push(...chordToMosc(item as ChordType, context));
            return;
        }

        if (type === "RatioChord") {
            moscItems.push(...chordToMosc(item as RatioChordType, context));
            initialRulerState = rulerStateCaptureRootHz(
                initialRulerState,
                context
            );
            return;
        }

        if (type === "SetterGroup") {
            (item as SetterGroupType).setters.forEach((setter) => {
                moscItems.push(...setterToMosc(setter, context));
                initialRulerState = setterToRulerState(
                    initialRulerState,
                    setter,
                    context
                );

                // SetPrimes object is part of SetterGroup
                if (setter.type === "SetPrimes") {
                    setPrimes(setter as SetPrimesType, context);
                    return;
                }
            });
            return;
        }

        throw new Error(`Unknown sequence item "${type}"`);
    });

    initialRulerState = rulerStateCaptureRootHz(initialRulerState, context);

    const sequence = [
        INITIAL_TEMPO,
        INITIAL_OSC,
        INITIAL_ENV,
        ...moscItems,
        {
            type: "END_TIME",
            time: context.time,
        } as MoscEnd,
    ];

    // translate times from steps to ms
    const thisTimeToMs = timeToMs(sequence);

    // omg are we really mutating many time items throughout the AST tree via mutations? golly!
    times.forEach((time) => {
        time[0] = thisTimeToMs(time[0]);
        time[1] = thisTimeToMs(time[1]);
    });

    const score = {
        sequence,
        lengthTime: context.time,
    };

    return {
        score,
        initialRulerState,
    };
};
