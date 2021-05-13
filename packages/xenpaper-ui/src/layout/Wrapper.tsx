import React from 'react';
import styled from 'styled-components';
import {space} from 'styled-system';
import {Box} from './Layout.js';

interface Props {
    page?: boolean;
    children: React.ReactNode
}

export const Wrapper = styled(({page, children, ...props}: Props): React.ReactElement => {
    return <Box {...props}>
        {page ? <Box px={[2,3,4]} pb={5}>{children}</Box> : children}
    </Box>;
})`
    margin: auto;
    max-width: ${props => props.theme.widths.wrapper};
    position: relative;
    ${space}
`;
