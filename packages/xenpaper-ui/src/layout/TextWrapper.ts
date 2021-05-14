// @flow
import styled from 'styled-components';
import {space} from 'styled-system';

export const TextWrapper = styled.div`
    max-width: ${props => props.theme.widths.textWrapper};
    ${space}
`;
