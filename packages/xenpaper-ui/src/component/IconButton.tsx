import React from 'react';
import styled, {css, keyframes} from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
`;

type ButtonProps = {
    onClick: () => any;
    show: boolean;
    absolute: boolean;
};

const Boundary = styled.button<ButtonProps>`
    border: none;
    display: block;
    height: 40px;
    width: 40px;
    padding: 10px;
    cursor: pointer;
    background-color: rgba(0,0,0,0);

    opacity: 0;
    pointer-events: ${props => props.show ? 'auto' : 'none'};
    ${props => props.show ? css`animation: ${fadeIn} 1s ease-out forwards;` : ``}
    ${props => !props.show ? css`animation: ${fadeOut} 1s ease-out forwards;` : ``}

    ${props => props.absolute ? `
        position: absolute;
        top: 0;
        left: 0;
    ` : ``}
`;

type Props = {
    paths: string[];
    onClick: () => any;
    show?: boolean;
    absolute?: boolean;
};

// eslint-disable-next-line react/display-name
export const IconButton: React.FunctionComponent<Props> = React.memo((props: Props): React.ReactElement => {
    const {paths, onClick, show = true, absolute = false} = props;

    return <Boundary onClick={() => onClick && onClick()} show={show} absolute={absolute}>
        <svg viewBox="0 0 12 12">
            {paths.map((d, index) => <path key={index} fill="#fff" d={d} />)}
        </svg>
    </Boundary>;
});

