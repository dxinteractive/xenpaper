import styled from 'styled-components';
import type {HighlightColor} from '../data/grammar-to-chars';

interface Props {
    readonly color?: HighlightColor;
    readonly children: React.ReactNode;
}

export const Char = styled.span<Props>`
    color: ${props => props.theme.colors.highlights[props.color || 'unknown']};
    transition: color 0.2s ${props => props.color === 'error' ? '0.5s' : '0s'} ease-out;

    &.active {
        transition: color 0s 0s linear;
        color: #fff;
    }
`;
