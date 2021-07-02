import React from 'react';
import useDimensions from 'react-use-dimensions';
import * as ReactKonva from 'react-konva';
import {useStrictMode} from 'react-konva';
import type {Dendriform} from 'dendriform';
import type {MoscNoteMs} from '@xenpaper/mosc';
import {Box, Flex} from './layout/Layout';

useStrictMode(true);
const {Stage, Layer, Rect, Group, Text} = ReactKonva as any;

export type RulerState = {
    notes: Map<string,MoscNoteMs>;
    range: {
        low: number;
        high: number;
    };
    collect: boolean;
};

type Props = {
    rulerState: Dendriform<RulerState>;
};

const BASE_Y = 800;
const BASE_HZ = 220;
const OCTAVE_PX = 300;

export function PitchRuler(props: Props): React.ReactElement|null {
    return <Flex flexDirection="column" style={{height: '100%'}}>
        <Box p={2}>clear</Box>
        <PitchRulerCanvas {...props} />
    </Flex>;
}

function PitchRulerCanvas(props: Props): React.ReactElement|null {
    const [dimensionsRef, {width = 0, height = 0}] = useDimensions();

    const rulerState = props.rulerState.useValue();

    return <div ref={dimensionsRef} style={{height: '100%', width: '100%', backgroundColor: '#080b0e'}}>
        <Stage width={width} height={height}>
            <Layer>
                <Rect x={0} y={BASE_Y} width={width} height={1} fill="#000000" />
                {Array.from(rulerState.notes.entries()).map(([id, note]) => {
                    return <Group key={id} y={BASE_Y - Math.log2(note.hz / BASE_HZ) * OCTAVE_PX}>
                        <Rect
                            width={width}
                            height={1}
                            fill="#FF0000"
                        />
                        <Text text={note.label} fill="#FFFFFF" />
                    </Group>;
                })}
            </Layer>
        </Stage>
    </div>;
}
