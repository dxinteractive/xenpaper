import React, {useCallback, useEffect, useRef, useState} from 'react';
import useDimensions from 'react-use-dimensions';
import * as ReactKonva from 'react-konva';
import {useStrictMode} from 'react-konva';
import {useDendriform, useCheckbox, useInput} from 'dendriform';
import type {Dendriform} from 'dendriform';
import type {MoscNoteMs} from '@xenpaper/mosc';
import {Box, Flex} from './layout/Layout';
import styled from 'styled-components';
import hsl from 'hsl-to-hex';

import {centsToRatio} from '@xenpaper/mosc';

useStrictMode(true);
const {Stage, Layer, Rect, Group, Text, Line} = ReactKonva as any;

export type RulerState = {
    notes: Map<string,MoscNoteMs>;
    notesActive: Map<string,MoscNoteMs>;
    collect: boolean;
    viewPan: number;
    viewZoom: number;
    colourMode: string;
    colourModeThreshold: number;
    colourModeSoft: boolean;
    rootHz?: number;
    octaveSize?: number;
    plots?: MoscNoteMs[][];
};

const LOW_HZ_LIMIT = 20;
const ZOOM_SPEED = 1.1;

const hzToPan = (hz: number): number => Math.log2(hz / LOW_HZ_LIMIT);

const panToHz = (pan: number): number => Math.pow(2, pan) * LOW_HZ_LIMIT;

const panToCents = (pan: number): number => pan * 1200;

const panToPx = (pan: number, viewPan: number, viewZoom: number, height: number): number => {
    return height * 0.5 - ((pan - viewPan) * height / viewZoom);
};

const pxToPan = (px: number, viewPan: number, viewZoom: number, height: number): number => {
    return viewPan - ((px - (height * 0.5)) / height * viewZoom);
};

const hzInRange = (hz: number, [lowHz, highHz]: [number,number]) => {
    return hz >= lowHz && hz <= highHz;
};

// this is so completely stupid
// and doesnt even work with non 2x octave sizes
// but i'm done with this
const getGradientColorFromNote = (note: MoscNoteMs): string => {
    const matched = note.label.match(/([\d.]+)c/);
    if(!matched) {
        return hsl(0, 100, 66);
    }
    const hue = Math.floor(Number(matched[1]) / 1200 * 360 + 180);
    return hsl(hue, 100, 66);
};

const getColorFromNoteProximity = (note: MoscNoteMs, proxNotes: MoscNoteMs[], threshold: number, hard: boolean): string => {
    const noteCents = panToCents(hzToPan(note.hz));
    let distance = Math.min(
        ...proxNotes
            .map(note => panToCents(hzToPan(note.hz)))
            .map(cents => Math.abs(noteCents - cents))
    ) / threshold;

    if(hard) {
        distance = distance > 1 ? 1000 : distance;
    }

    return hsl(Math.round(360 - (Math.min(distance, 2) * 80)), 100, Math.round(Math.max(1 - distance * 0.5, 0) * 50 + 10));
};

export type InitialRulerState = {
    lowHz?: number;
    highHz?: number;
    rootHz?: number;
    octaveSize?: number;
    plots?: MoscNoteMs[][];
};

export function useRulerState({lowHz, highHz, ...rest}: InitialRulerState = {}) {
    return useDendriform<RulerState>(() => {

        let viewPan = hzToPan(220 * 1.5);
        let viewZoom = 1.5;

        if(lowHz && highHz) {
            const lowPan = hzToPan(lowHz);
            const highPan = hzToPan(highHz);
            viewPan = (lowPan + highPan) * 0.5;
            viewZoom = highPan - lowPan;
        }

        return {
            notes: new Map(),
            notesActive: new Map(),
            collect: true,
            viewPan,
            viewZoom,
            colourMode: 'gradient',
            colourModeThreshold: 15,
            colourModeSoft: true,
            ...rest
        };
    });
};

type Props = {
    rulerState: Dendriform<RulerState,any>;
};

export function PitchRuler(props: Props): React.ReactElement|null {
    const {rulerState} = props;

    const onClear = useCallback(() => {
        rulerState.set(draft => {
            draft.notes.clear();
        });
    }, []);

    return <Flex flexDirection="column" style={{height: '100%'}}>
        <Flex pt={2} px={2} flexWrap="wrap">
            <Flex flexShrink={0} pb={2}>
                <Box mr={3}>
                    {rulerState.render('collect', form => (
                        <Label>
                            <Box as="span" mr={2}>collect</Box>
                            <input type="checkbox" {...useCheckbox(form)} />
                        </Label>
                    ))}
                </Box>
                <Box mr={3}>
                    <Button onClick={onClear}>clear</Button>
                </Box>
            </Flex>
            <Flex flexShrink={0} pb={2}>
                {rulerState.render('colourMode', form => <>
                    <Box mr={3}>
                        <Label>
                            <Box as="span" mr={2}>colour</Box>
                            <select {...useInput(form)}>
                                <option value="gradient">Gradient</option>
                                <option value="proxnotes">Proximity to notes</option>
                                {rulerState.render('plots', plots => <>
                                    {(plots.useValue() ?? []).map((plot, i) => (
                                        <option key={i} value={`proxplot${i}`}>Proximity to plot {i+1}</option>
                                    ))}
                                </>)}
                            </select>
                        </Label>
                    </Box>
                    {form.useValue() !== 'gradient' && <>
                        <Box mr={3}>
                            {rulerState.render('colourModeThreshold', form => (
                                <Label>
                                    <Box as="span" mr={2}>threshold</Box>
                                    <input
                                        type="number"
                                        value={`${form.useValue()}`}
                                        onChange={(e) => form.set(Number(e.target.value))}
                                        min="1"
                                        max="100"
                                        step="1"
                                    />
                                </Label>
                            ))}
                        </Box>
                        <Box mr={3}>
                            {rulerState.render('colourModeSoft', form => (
                                <Label>
                                    <Box as="span" mr={2}>soft</Box>
                                    <input type="checkbox" {...useCheckbox(form)} />
                                </Label>
                            ))}
                        </Box>
                    </>}
                </>)}
            </Flex>
        </Flex>
        <PitchRulerCanvas {...props} />
    </Flex>;
}

type DragStartState = {
    startPan: number;
    startZoom: number;
    startDrag: number;
};

function PitchRulerCanvas(props: Props): React.ReactElement|null {
    const [dimensionsRef, {width = 0, height = 0}] = useDimensions();

    const rulerState = props.rulerState.useValue();
    const {
        viewPan,
        viewZoom,
        rootHz,
        octaveSize,
        plots = [],
        notes,
        notesActive,
        colourMode,
        colourModeThreshold,
        colourModeSoft
    } = rulerState;

    const visibleRange: [number,number] = [
        panToHz(pxToPan(height, viewPan, viewZoom, height)),
        panToHz(pxToPan(0, viewPan, viewZoom, height))
    ];

    const total = plots.length + 1;
    const noteSetWidth = (width - 60) / total;

    //
    // getters
    //

    const getY = useCallback((hz: number): number => {
        return panToPx(hzToPan(hz), viewPan, viewZoom, height);
    }, [viewPan, viewZoom, height]);

    const getColor = useCallback((note: MoscNoteMs): string => {
        if(colourMode === 'gradient') {
            return getGradientColorFromNote(note);
        }

        let compare: MoscNoteMs[] = [];
        if(colourMode === 'proxnotes') {
            compare = Array.from(notes.values());
        } else if(colourMode.startsWith('proxplot')) {
            const index = Number(colourMode.replace('proxplot',''));
            compare = plots[index] ?? [];
        }

        return getColorFromNoteProximity(
            note,
            compare,
            colourModeThreshold,
            !colourModeSoft
        );
    }, [colourMode, colourModeThreshold, colourModeSoft, notes]);

    //
    // interactions
    //

    const dragStartState = useRef<DragStartState|null>(null);
    const [dragging, setDragging] = useState<boolean>(false);

    const handleMouseDown = useCallback(({evt}) => {
        evt.preventDefault();
        dragStartState.current = {
            startPan: viewPan,
            startZoom: viewZoom,
            startDrag: pxToPan(evt.clientY, viewPan, viewZoom, height)
        };
        setDragging(true);
    }, [viewPan, viewZoom, height]);

    const handleMouseMove = useCallback(({evt}) => {
        evt.preventDefault();
        const dragState = dragStartState.current;
        if(dragState) {
            const nowDrag = pxToPan(evt.clientY, dragState.startPan, dragState.startZoom, height);

            props.rulerState.set(draft => {
                draft.viewPan = dragState.startPan - nowDrag + dragState.startDrag;
            });
        }
    }, [height]);

    useEffect(() => {
        const onMouseUp = () => {
            dragStartState.current = null;
            setDragging(false);
        };

        window.addEventListener('mouseup', onMouseUp);
        return () => window.removeEventListener('mouseup', onMouseUp);
    }, []);

    const handleWheel = useCallback(({evt}) => {
        evt.preventDefault();
        props.rulerState.set(draft => {
            draft.viewZoom *= evt.deltaY > 0 ? ZOOM_SPEED : evt.deltaY < 0 ? 1/ZOOM_SPEED : 1
        });
    }, []);

    const handleTouchStart = useCallback(({evt}) => {
        evt.preventDefault();
        // console.log('handleTouchStart', {evt});
    }, []);

    const handleTouchMove = useCallback(({evt}) => {
        evt.preventDefault();
        // console.log('handleTouchMove', {evt});
    }, []);

    const handleTouchEnd = useCallback(({evt}) => {
        evt.preventDefault();
        // console.log('handleTouchEnd', {evt});
    }, []);

    // TODO zoom toward cursor position
    // TODO zoom on touch devices

    //
    // render
    //

    const style = {
        height: '100%',
        width: '100%',
        backgroundColor: '#080b0e',
        cursor: dragging ? 'grabbing' : 'grab'
    };

    return <div ref={dimensionsRef} style={style}>
        <Stage
            width={width}
            height={height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
        >
            <Layer>
                {rootHz && octaveSize &&
                    <CentsGrid
                        rootHz={rootHz}
                        octaveSize={octaveSize}
                        getY={getY}
                        width={width}
                        visibleRange={visibleRange}
                    />
                }
                {rootHz && octaveSize &&
                    <RootGrid
                        rootHz={rootHz}
                        octaveSize={octaveSize}
                        getY={getY}
                        width={width}
                        visibleRange={visibleRange}
                    />
                }
                {rulerState.collect &&
                    <NoteSet
                        notes={Array.from(notes.values())}
                        getY={getY}
                        width={noteSetWidth}
                        x={0}
                        visibleRange={visibleRange}
                        getColor={getColor}
                    />
                }
                {(plots || []).map((plot, index) => {
                    return <NoteSet
                        key={index}
                        notes={plot}
                        getY={getY}
                        width={noteSetWidth}
                        x={noteSetWidth * (index + 1)}
                        visibleRange={visibleRange}
                        getColor={getColor}
                    />
                })}
                <NoteSet
                    notes={Array.from(notesActive.values())}
                    getY={getY}
                    color="#FFFFFF"
                    width={noteSetWidth}
                    x={0}
                    visibleRange={visibleRange}
                />
            </Layer>
        </Stage>
    </div>;
}



type NoteSetProps = {
    notes: MoscNoteMs[];
    getY: (hz: number) => number;
    getColor?: (note: MoscNoteMs) => string;
    color?: string;
    width: number;
    x: number;
    visibleRange: [number,number];
};

const NoteSet = React.memo(function NoteSet(props: NoteSetProps): React.ReactElement {
    const {
        width,
        notes,
        getColor = getGradientColorFromNote,
        getY,
        x,
        visibleRange
    } = props;

    const visibleNotes = notes.filter(note => hzInRange(note.hz, visibleRange));

    return <>
        {visibleNotes.map((note, index) => {
            const color = props.color ?? getColor(note);
            return <Group key={index} x={x} y={getY(note.hz)}>
                <Line
                    stroke={color}
                    strokeWidth={1}
                    points={[0, 0, width, 0]}
                />
                <Text
                    text={note.label}
                    fill={color}
                    align="center"
                    width={width}
                    y={-13}
                />
            </Group>;
        })}
    </>;
});

const Label = styled.label`
    user-select: none;
`;

const Button = styled.button`
    border: none;
    display: block;
    padding: .25rem .5rem;
    cursor: pointer;
    background-color: ${props => props.theme.colors.highlights.unknown};
    color: ${props => props.theme.colors.background.normal};
    position: relative;
    outline: none;
    opacity: 0.7;

    transition: opacity .2s ease-out;

    &:hover, &:focus, &:active {
        opacity: 1;
    }
`;

type RootGridProps = {
    octaveSize: number;
    rootHz: number;
    width: number;
    getY: (hz: number) => number;
    visibleRange: [number,number];
};

const ROOT_GRID_POSITIONS = [7,6,5,4,3,2,1,0,-1,-2,-3];

const RootGrid = React.memo(function RootGrid(props: RootGridProps): React.ReactElement {
    const {getY, rootHz, octaveSize, width, visibleRange} = props;

    const lines = ROOT_GRID_POSITIONS
        .map(i => [i, rootHz * Math.pow(octaveSize,i)])
        .filter(([,hz]) => hzInRange(hz, visibleRange));

    return <>
        {lines.map(([i, hz]) => {
            const y = getY(hz);
            return <Group key={i} y={y}>
                <Line
                    stroke={hsl(208, 32, (8 - Math.abs(i)) * 12)}
                    strokeWidth={1}
                    points={[0, 0, width - 60, 0]}
                    dash={[4,4]}
                />
                <Text
                    text={`${hz}Hz`}
                    fill={hsl(208, 32, (8 - Math.abs(i)) * 24)}
                    align="left"
                    width={55}
                    x={width - 55}
                    y={-5}
                />
            </Group>;
        })}
    </>;
});

const CENT_GRID_POSITIONS = [1,0,-1];

type CentsGridProps = {
    octaveSize: number;
    rootHz: number;
    width: number;
    getY: (hz: number) => number;
    visibleRange: [number,number];
};

const CentsGrid = React.memo(function CentsGrid(props: CentsGridProps): React.ReactElement {
    const {getY, rootHz, octaveSize, width, visibleRange} = props;

    const lines: [number,number,number][] = [];

    CENT_GRID_POSITIONS.forEach(octave => {
        for(let i = 100; i < octaveSize * 600; i+=100) {
            const hz = rootHz * centsToRatio(i, octave);
            if(hzInRange(hz, visibleRange)) {
                lines.push([i, hz, octave]);
            }
        }
    });

    return <>
        {lines.map(([cents, hz, octave]) => {
            const y = getY(hz);
            return <Group key={hz} y={y}>
                <Line
                    stroke={hsl(208, 32, (2 - Math.abs(octave)) * 12)}
                    strokeWidth={1}
                    points={[0, 0, width - 60, 0]}
                />
                <Text
                    text={`${cents}c`}
                    fill={hsl(208, 32, (2 - Math.abs(octave)) * 24)}
                    align="left"
                    width={55}
                    x={width - 55}
                    y={-5}
                />
            </Group>;
        })}
    </>;
});
