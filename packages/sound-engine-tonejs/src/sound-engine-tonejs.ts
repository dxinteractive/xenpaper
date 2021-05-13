import type {MoscScoreMs, MoscNoteMs, MoscItemMs, MoscParamMs, MoscEndMs} from '@xenpaper/mosc';
import {SoundEngine, scoreToMs} from '@xenpaper/mosc';
import * as Tone from 'tone';

//
// utils
//

function flatMap<I,O>(arr: I[], mapper: (item: I) => O[]): O[] {
    const out: O[] = [];
    arr.forEach(item => out.push(...mapper(item)));
    return out;
}

//
// consts
//

const OSC_VOLUME = -18;

export const OSC_BASE_TYPES = [
    'sine',
    'sawtooth',
    'square',
    'triangle'
];

export let OSC_PARTIAL_SUFFIXES: string[] = [];
for(let i = 1; i < 33; i++) {
    OSC_PARTIAL_SUFFIXES.push(`${i}`);
}

export const OSC_TYPES_EXPANDED = flatMap(OSC_BASE_TYPES, base => [
    base,
    `fm${base}`,
    `am${base}`,
    `fat${base}`
]);

export const OSC_TYPES = flatMap(OSC_TYPES_EXPANDED, type => [
    type,
    ...OSC_PARTIAL_SUFFIXES.map(suffix => `${type}${suffix}`)
]);

export class SoundEngineTonejs extends SoundEngine {

    _started = false;
    _endMs = 0;
    _loopEndMs = 0;

    synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
            type: 'sine',
            volume: OSC_VOLUME
        },
        envelope: {
            attack: 0.01,
            sustain: 0.5,
            decay: 0.25,
            release: 0.5
        }
    }).chain(Tone.Destination);

    playing(): boolean {
        return Tone.Transport.state === 'started';
    }

    looping(): boolean {
        return Tone.Transport.loop;
    }

    position(): number {
        return Tone.Transport.seconds * 1000;
    }

    endPosition(): number {
        return this._endMs;
    }

    async start(): Promise<void> {
        if(!this._started) {
            await Tone.start();
            this._started = true;
        }
    }

    async play(): Promise<void> {
        await this.start();
        Tone.Transport.start();
    }

    async pause(): Promise<void> {
        await this.start();
        Tone.Transport.stop();
        this.synth.releaseAll();
    }

    async gotoMs(ms: number): Promise<void> {
        Tone.Transport.seconds = ms * 0.001;
    }

    async setLoop(loop: boolean, startMs: number = 0, endMs: number = 0): Promise<void> {
        Tone.Transport.loop = loop;
        await this.setLoopStart(startMs);
        await this.setLoopEnd(endMs);
    }

    async setLoopStart(ms: number = 0): Promise<void> {
        Tone.Transport.loopStart = ms * 0.001;
    }

    async setLoopEnd(ms: number = 0): Promise<void> {
        this._loopEndMs = ms;
        Tone.Transport.loopEnd = (ms === 0 ? this._endMs : ms) * 0.001;
    }

    async setScore(scoreMs: MoscScoreMs): Promise<void> {
        this.scoreMs = scoreMs;

        // clear all previous notes from tone transport
        Tone.Transport.cancel();

        // add all new notes to tone transport
        this.scoreMs.sequence.map((item: MoscItemMs): number => {
            if(item.type === 'NOTE_MS') {
                const noteMs = item as MoscNoteMs;
                return Tone.Transport.schedule((time: number) => {
                    this.synth.triggerAttackRelease(
                        noteMs.hz,
                        (noteMs.msEnd * 0.001) - (noteMs.ms * 0.001),
                        time + 0.01 // schedule in the future slightly to avoid double note playing at end
                    );
                }, noteMs.ms * 0.001);
            }
            if(item.type === 'PARAM_MS') {
                const paramMs = item as MoscParamMs;
                return Tone.Transport.schedule(() => {
                    // this is inaccurate
                    // as tonejs calls these callbacks several ms ahead of schedule
                    // and relies on scheduled events to pass the provided time
                    // to schedule correctly, but param changes cannot accept
                    // the time argument
                    if(paramMs.value.type === 'osc' && OSC_TYPES.includes(paramMs.value.osc)) {
                        this.synth.set({
                            oscillator: {
                                type: paramMs.value.osc,
                                volume: OSC_VOLUME
                            }
                        });
                    }
                    if(paramMs.value.type === 'env') {
                        this.synth.set({
                            envelope: {
                                attack: paramMs.value.a,
                                decay: paramMs.value.d,
                                sustain: paramMs.value.s,
                                release: paramMs.value.r
                            }
                        });
                    }

                }, paramMs.ms * 0.001);
            }
            if(item.type === 'END_MS') {
                this._endMs = (item as MoscEndMs).ms;
                if(this._loopEndMs === 0) {
                    this.setLoopEnd(0);
                }

                return Tone.Transport.schedule(async () => {
                    if(Tone.Transport.loop) return;

                    Tone.Transport.stop();
                    this.gotoMs(0);
                    this.events.forEach((type, cb) => {
                        if(type !== 'end') return;
                        cb();
                    });
                }, this._endMs * 0.001);
            }
            // @ts-ignore
            throw new Error(`Unexpected item type ${item.type} encountered`);
        });
    }
}
