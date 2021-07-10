import React, {useState} from 'react';
import styled from 'styled-components';
import type {HighlightColor, CharData} from '../data/grammar-to-chars';
import {useAnimationFrame} from '../hooks/useAnimationFrame';
import type {SoundEngine} from '@xenpaper/mosc';

type CharProps = {
    ch: string;
    charData?: CharData;
    soundEngine: SoundEngine;
};

export const Char = React.memo(function Char(props: CharProps): React.ReactElement {
    const {ch, charData, soundEngine} = props;

    const [active, setActive] = useState<boolean>(false);

    useAnimationFrame(() => {
        const time = soundEngine.playing() ? soundEngine.position() : -1;
        const [start, end] = charData?.playTime ?? [];

        const active = time !== -1
            && start !== undefined
            && end !== undefined
            && start <= time
            && end > time;

        setActive(active);
    }, [ch, charData]);

    return <CharSpan className={active ? 'active' : ''} color={charData?.color}>{ch}</CharSpan>;
});

type CharSpanProps = {
    readonly color?: HighlightColor;
    readonly children: React.ReactNode;
};

const CharSpan = styled.span<CharSpanProps>`
    color: ${props => props.theme.colors.highlights[props.color || 'unknown']};
    transition: color 0.2s ${props => props.color === 'error' ? '0.5s' : '0s'} ease-out;

    &.active {
        transition: color 0s 0s linear;
        color: #fff;
    }
`;
