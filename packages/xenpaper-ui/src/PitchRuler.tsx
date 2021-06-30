import React from 'react';
import useDimensions from 'react-use-dimensions';
import * as ReactKonva from 'react-konva';
import {useStrictMode} from 'react-konva';
import type {Dendriform} from 'dendriform';
import type {MoscNoteMs} from '@xenpaper/mosc';

useStrictMode(true);
const {Stage, Layer, Rect, Text} = ReactKonva as any;

export type RulerState = {
    notes: Map<string,MoscNoteMs>;
};

export const initialRulerState = (): RulerState => ({
    notes: new Map()
});

type Props = {
    rulerState: Dendriform<RulerState>;
};

export function PitchRuler(props: Props): React.ReactElement|null {
    const [dimensionsRef, {width = 0, height = 0}] = useDimensions();

    const rulerState = props.rulerState.useValue();
    console.log('rulerState', rulerState.notes);

    return <div ref={dimensionsRef} style={{height: '100%', width: '100%'}}>
        <Stage width={width} height={height}>
            <Layer>
                <Text text="Hi!" />
                {Array.from(rulerState.notes.entries()).map(([id, note]) => {
                    return <Rect
                        key={id}
                        x={20}
                        y={note.hz}
                        width={100}
                        height={1}
                        fill="#FFFFFF"
                    />;
                })}
            </Layer>
        </Stage>
    </div>;
}
