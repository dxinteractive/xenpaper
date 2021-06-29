import React from 'react';
import styled from 'styled-components';
import {Text} from '../component/Text';
import {textStyle, typography} from 'styled-system';

type Props = {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    charElements: React.ReactNode;
    freeze: boolean;
};

export const Codearea = (props: Props): React.ReactElement => {
    const {value, onChange, charElements, freeze} = props;

    const content = value === ''
        ? <Text color="text.placeholder" style={{fontStyle: "italic"}}>
            Type your tune here
            <br /><br />
        </Text>
        : <>{charElements}<br /><br /></>;

    return <Outer fontSize={["1.1rem", "1.4rem"]} disabled={freeze}>
        <Inner>
            <Textarea
                value={value}
                onChange={onChange}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                disabled={freeze}
            />
            <Highlight aria-hidden="true" freeze={freeze}>{content}</Highlight>
        </Inner>
    </Outer>;
};

type OuterProps = {
    fontSize: unknown;
    disabled: boolean;
};

const Outer = styled.div<OuterProps>`
    height: 100%;
    overflow: auto;
    ${textStyle}
    ${typography}
    line-height: 1.4em;
    position: relative;

    &:before {
        content: "";
        display: block;
        width: 3px;
        height: 4rem;
        background-color: transparent;
        transition: background-color .2s ease-out;
        position: absolute;
        top: 12px;
    }

    &:focus-within {
        &:before {
            background-color: ${props => props.theme.colors.focus};
        }
    }

    ${props => props.disabled ? `
        cursor: default;
        user-select: none;
        pointer-events: none;
    ` : ''}
`;

const Inner = styled.div`
    position: relative;
    text-align: left;
    box-sizing: border-box;
    padding: 0px;
    overflow: hidden;
    font-variant-ligatures: common-ligatures;
    min-height: 100%;
`;

const Textarea = styled.textarea`
    margin: 0;
    border: 0;
    background: none;
    box-sizing: inherit;
    display: inherit;
    font-family: inherit;
    font-size: inherit;
    font-style: inherit;
    font-variant-ligatures: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
    line-height: inherit;
    tab-size: inherit;
    text-indent: inherit;
    text-rendering: inherit;
    text-transform: inherit;
    white-space: pre-wrap;
    word-break: keep-all;
    overflow-wrap: break-word;
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    resize: none;
    color: inherit;
    overflow: hidden;
    -webkit-text-fill-color: transparent;
    -webkit-font-smoothing: antialiased;
    padding: 1rem 1rem 1rem 2rem;
    outline: 0;

    &::selection {
        background: #22cece;
    }

    &:disabled {
        user-select: none;
        opacity: 0;
    }
`;

type HighlightProps = {
    freeze: boolean;
};

const Highlight = styled.pre<HighlightProps>`
    margin: 0px;
    border: 0px;
    background: none;
    box-sizing: inherit;
    display: inherit;
    font-family: inherit;
    font-size: inherit;
    font-style: inherit;
    font-variant-ligatures: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
    line-height: inherit;
    tab-size: inherit;
    text-indent: inherit;
    text-rendering: inherit;
    text-transform: inherit;
    white-space: pre-wrap;
    word-break: keep-all;
    overflow-wrap: break-word;
    position: relative;
    pointer-events: ${props => props.freeze ? 'auto' : 'none'};
    padding: 1rem 1rem 1rem 2rem;
    user-select: none;
`;
