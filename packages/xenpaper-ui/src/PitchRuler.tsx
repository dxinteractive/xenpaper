import React, {useCallback, useEffect, useRef} from 'react';
import useDimensions from 'react-use-dimensions';
import * as ReactKonva from 'react-konva';
import {useStrictMode} from 'react-konva';
import {useDendriform, useCheckbox} from 'dendriform';
import type {Dendriform} from 'dendriform';
import type {MoscNoteMs} from '@xenpaper/mosc';
import {Box, Flex} from './layout/Layout';
import styled from 'styled-components';
import hsl from 'hsl-to-hex';

useStrictMode(true);
const {Stage, Layer, Rect, Group, Text, Line} = ReactKonva as any;

export type RulerState = {
    notes: Map<string,MoscNoteMs>;
    notesActive: Map<string,MoscNoteMs>;
    collect: boolean;
    viewPan: number;
    viewZoom: number;
    rootHz?: number;
    octaveSize?: number;
    scales?: [number[], string[]][];
};

const LOW_HZ_LIMIT = 20;
const ZOOM_SPEED = 1.1;

const hzToPan = (hz: number): number => Math.log2(hz / LOW_HZ_LIMIT);

const panToHz = (pan: number): number => Math.pow(2, pan) * LOW_HZ_LIMIT;

const panToPx = (pan: number, viewPan: number, viewZoom: number, height: number): number => {
    return height * 0.5 - ((pan - viewPan) * height / viewZoom);
};

const pxToPan = (px: number, viewPan: number, viewZoom: number, height: number): number => {
    return viewPan - ((px - (height * 0.5)) / height * viewZoom);
};

export type InitialRulerState = {
    lowHz?: number;
    highHz?: number;
    rootHz?: number;
    octaveSize?: number;
    scales?: [number[], string[]][];
};

export function useRulerState({lowHz, highHz, ...rest}: InitialRulerState = {}) {
    return useDendriform<RulerState>(() => {

        let viewPan = hzToPan(440 * 1.5);
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
        <Flex p={2}>
            <Box mr={3}>
                {rulerState.render('collect', form => (
                    <Label>
                        <input type="checkbox" {...useCheckbox(form)} />
                        {' '}collect
                    </Label>
                ))}
            </Box>
            <Box>
                <Button onClick={onClear}>clear</Button>
            </Box>
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

    const {viewPan, viewZoom} = rulerState;

    const getY = (hz: number): number => {
       return panToPx(hzToPan(hz), viewPan, viewZoom, height);
    };

    const dragStartState = useRef<DragStartState|null>(null);

    const handleMouseDown = useCallback(({evt}) => {
        evt.preventDefault();
        dragStartState.current = {
            startPan: viewPan,
            startZoom: viewZoom,
            startDrag: pxToPan(evt.clientY, viewPan, viewZoom, height)
        };
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

    const ticksFrom = panToHz(pxToPan(height, viewPan, viewZoom, height));
    const ticksTo = panToHz(pxToPan(0, viewPan, viewZoom, height));

    const {rootHz, octaveSize, scales} = rulerState;
    console.log('scales', scales);

    return <div ref={dimensionsRef} style={{height: '100%', width: '100%', backgroundColor: '#080b0e'}}>
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
                {rootHz && octaveSize && [3,2,1,0,-1,-2,-3].map(i => {
                    const y = getY(rootHz * Math.pow(octaveSize,i));
                    return <Line
                        key={i}
                        stroke={hsl(0,0,(4 - Math.abs(i)) * 15)}
                        strokeWidth={1}
                        points={[0, y, width, y]}
                        dash={[4,4]}
                    />;
                })}
                {/*<Rect x={0} y={BASE_Y} width={width} height={1} fill="#000000" />*/}
                {rulerState.collect &&
                    <NoteSet
                        notes={rulerState.notes}
                        getY={getY}
                        width={width}
                    />
                }
                <NoteSet
                    notes={rulerState.notesActive}
                    getY={getY}
                    color="#FFFFFF"
                    width={width}
                />
            </Layer>
        </Stage>
    </div>;
}

type NoteSetProps = {
    notes: Map<string,MoscNoteMs>;
    getY: (hz: number) => number;
    color?: string;
    width: number;
};

function NoteSet(props: NoteSetProps): React.ReactElement {
    const {width, notes, getY} = props;
    return <>
        {Array.from(notes.entries()).map(([id, note]) => {
            const color = props.color ?? hsl(note.ms / 8, 100, 66);
            return <Group key={id} y={getY(note.hz)}>
                <Line
                    stroke={color}
                    strokeWidth={1}
                    points={[50, 0, width, 0]}
                />
                <Text
                    text={note.label}
                    fill={color}
                    align="right"
                    width={45}
                    y={-5}
                />
            </Group>;
        })}
    </>;
}

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
