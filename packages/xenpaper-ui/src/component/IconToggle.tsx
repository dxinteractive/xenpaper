import React from 'react';
import styled, {keyframes} from 'styled-components';

const clipIn = keyframes`
  0% {
    clip-path: polygon(0% 0%, 0% 0%, 100% 100%, 100% 100%, 100% 100%, 0% 0%);
  }

  20% {
    clip-path: polygon(0% 0%, 0% 0%, 100% 100%, 100% 100%, 100% 100%, 0% 0%);
  }

  100% {
    clip-path: polygon(0% 0%, 100% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 100%);
  }
`;

const clipOut = keyframes`
  0% {
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 100% 100%, 100% 100%, 100% 100%, 0% 0%);
  }

  100% {
    clip-path: polygon(100% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 100%, 0% 100%, 100% 100%, 100% 0%, 100% 0%);
  }
`;

const colorIn = keyframes`
  0% {
    fill: #115d5d;
  }

  20% {
    fill: #115d5d;
  }

  100% {
    fill: #fff;
  }
`;

const colorOut = keyframes`
  0% {
    fill: #fff;
  }

  100% {
    fill: #115d5d;
  }
`;

type ButtonProps = {
    onClick: () => any;
    hoverBackground?: boolean;
    large: boolean;
};

const Boundary = styled.button<ButtonProps>`
    border: none;
    display: block;
    height: 3rem;
    width: 3rem;
    padding: 1rem .5rem;
    cursor: pointer;
    background-color: rgba(0,0,0,0);
    position: relative;
    outline: none;

    transition: border-color .2s ease-out;
    border-left: 3px solid transparent;

    &:focus, &:active {
        border-left: 3px solid ${props => props.theme.colors.focus};
    }

    ${props => props.hoverBackground ? `&:hover {
        background-color: ${props.theme.colors.background.light};
    }` : ``}

    ${props => props.large && `@media all and (min-width: ${props.theme.widths.sm}) {
        height: 4rem;
        width: 5rem;
        padding: 1rem;
    }`}
`;

type IconProps = {
    show: boolean;
    large: boolean;
};

const Icon = styled.div<IconProps>`
    position: absolute;
    top: 0;
    left: 0;
    height: 3rem;
    width: 2rem;
    padding: 1rem .5rem;
    animation: ${props => props.show ? clipIn : clipOut} .3s ease-out forwards;
    margin-left: .5rem;

    path {
        fill: #fff;
        animation: ${props => props.show ? colorIn : colorOut} .3s ease-out forwards;
    }

    opacity: .9;
    &:hover {
        opacity: 1;
    }

    ${props => props.large && `@media all and (min-width: ${props.theme.widths.sm}) {
        height: 4rem;
        width: 4rem;
        padding: 1rem;
    }`}
`;

type Props = {
    state: string;
    paths: {[key: string]: string[]};
    onClick?: (state: string) => any;
    loaded?: boolean;
    hoverBackground?: boolean;
    large?: boolean;
};

// eslint-disable-next-line react/display-name
export const IconToggle: React.FunctionComponent<Props> = React.memo((props: Props): React.ReactElement => {
    const {state, paths, onClick, loaded = true, hoverBackground = false, large = false} = props;

    return <Boundary onClick={() => onClick && onClick(state)} hoverBackground={hoverBackground} large={large}>
        {Object.keys(paths).map((pathState: string) => {
            return <Icon key={pathState} show={loaded && state === pathState} large={large}>
                <svg viewBox="0 0 12 12">
                    {paths[pathState].map((d, index) => <path key={index} d={d} />)}
                </svg>
            </Icon>;
        })}
    </Boundary>;
});

