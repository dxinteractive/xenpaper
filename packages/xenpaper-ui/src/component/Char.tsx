import styled from 'styled-components';
import type {HighlightColor} from '../data/grammar-to-chars';

interface Props {
    readonly color?: HighlightColor;
    readonly children: React.ReactNode;
    layoutMode?: boolean;
    layoutModeButton?: boolean;
}

export const Char = styled.span<Props>`
    color: ${props => props.theme.colors.highlights[props.color || 'unknown']};
    transition: color 0.2s ${props => props.color === 'error' ? '0.5s' : '0s'} ease-out;

    &.active {
        transition: color 0s 0s linear;
        color: #fff;
    }

    ${props => props.layoutMode && `
        border-width: 0px;
        border-style: solid;
        border-color: transparent;
    `}

    ${props => props.layoutModeButton && `
        cursor: pointer;
        border-color: ${props.theme.colors.background.light};
        background-color: ${props.theme.colors.background.light};
    `}
`;
