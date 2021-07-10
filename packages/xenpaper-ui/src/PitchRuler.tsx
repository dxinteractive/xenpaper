import React, {useCallback, useRef} from 'react';
import useDimensions from 'react-use-dimensions';
import * as ReactKonva from 'react-konva';
import {useStrictMode} from 'react-konva';
import {useDendriform, useCheckbox} from 'dendriform';
import type {Dendriform} from 'dendriform';
import type {MoscNoteMs} from '@xenpaper/mosc';
import {Box, Flex} from './layout/Layout';
import styled from 'styled-components';

useStrictMode(true);
const {Stage, Layer, Rect, Group, Text} = ReactKonva as any;

export type RulerState = {
    notes: Map<string,MoscNoteMs>;
    notesActive: Map<string,MoscNoteMs>;
    collect: boolean;
    viewPan: number;
    viewZoom: number;
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
};

export function useRulerState({lowHz = 440, highHz = 880}: InitialRulerState = {}): Dendriform<RulerState> {
    return useDendriform<RulerState>(() => {

        let viewPan = hzToPan(440);
        let viewZoom = 1;

        if(lowHz) {
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
            viewZoom
        };
    });
};

type Props = {
    rulerState: Dendriform<RulerState>;
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

    const getY = (note: MoscNoteMs): number => {
       return panToPx(hzToPan(note.hz), viewPan, viewZoom, height);
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

    const handleMouseUp = useCallback(({evt}) => {
        evt.preventDefault();
        dragStartState.current = null;
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

    return <div ref={dimensionsRef} style={{height: '100%', width: '100%', backgroundColor: '#080b0e'}}>
        <Stage
            width={width}
            height={height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <Layer>
                {/*<Rect x={0} y={BASE_Y} width={width} height={1} fill="#000000" />*/}
                {rulerState.collect && <NoteSet
                    notes={rulerState.notes}
                    getY={getY}
                    color="#FF0000"
                    width={width}
                />}
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
    getY: (note: MoscNoteMs) => number;
    color: string;
    width: number;
};

function NoteSet(props: NoteSetProps): React.ReactElement {
    const {width, color} = props;
    return <>
        {Array.from(props.notes.entries()).map(([id, note]) => {
            return <Group key={id} y={props.getY(note)}>
                <Rect
                    width={width}
                    height={1}
                    fill={color}
                />
                <Text text={note.label} fill={color} />
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
