import React, {useState} from 'react';
import type {MoscNoteMs} from '@xenpaper/mosc';

export class RulerState {
    add(note: MoscNoteMs): void {
        console.log('add', note);
    }
}

export const useRulerState = (): RulerState => {
    const [rulerState] = useState<RulerState>(() => new RulerState());
    return rulerState;
};

type Props = {
    rulerState: RulerState;
};

export function PitchRuler(props: Props): React.ReactElement|null {
    console.log('props', props);
    return null;
}
