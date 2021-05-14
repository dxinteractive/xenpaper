import styled from 'styled-components';

import {
    space,
    color,
    layout,
    flexbox,
    grid,
    background,
    border,
    position,
    compose
} from 'styled-system';

const styledProps = compose(
    space,
    color,
    layout,
    flexbox,
    grid,
    background,
    border,
    position
);

export const Box = styled.div<any>`
    ${styledProps}
`;

export const Flex = styled.div<any>`
    display: flex;
    ${styledProps}
`;
