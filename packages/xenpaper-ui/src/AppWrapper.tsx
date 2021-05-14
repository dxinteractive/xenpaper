import React from 'react';

import {ThemeProvider, createGlobalStyle} from 'styled-components';
import type {HighlightColor} from './data/grammar-to-chars';

const GlobalStyle = createGlobalStyle`
    html, body, div, span, applet, object, iframe,
    h1, h2, h3, h4, h5, h6, p, blockquote, pre,
    a, abbr, acronym, address, big, cite, code,
    del, dfn, em, img, ins, kbd, q, s, samp,
    small, strike, strong, sub, sup, tt, var,
    b, u, i, center,
    dl, dt, dd, ol, ul, li,
    fieldset, form, label, legend,
    table, caption, tbody, tfoot, thead, tr, th, td,
    article, aside, canvas, details, embed,
    figure, figcaption, footer, header, hgroup,
    menu, nav, output, ruby, section, summary,
    time, mark, audio, video {
        margin: 0;
        padding: 0;
        border: 0;
        font-size: 100%;
        font: inherit;
        vertical-align: baseline;
    }
    article, aside, details, figcaption, figure,
    footer, header, hgroup, menu, nav, section {
        display: block;
    }
    body {
        line-height: 1;
    }
    ol, ul {
        list-style: none;
    }
    blockquote, q {
        quotes: none;
    }
    blockquote:before, blockquote:after,
    q:before, q:after {
        content: '';
        content: none;
    }
    table {
        border-collapse: collapse;
        border-spacing: 0;
    }
    * {
        box-sizing: border-box;
    }

    html {
        font-family: 'DM Mono', sans-serif;
        height: 100%;
        line-height: 1.5em;
        position: relative;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: #0e151b;
        color: #ffffff;
        font-size: 16px;
    }

    body {
        font-weight: 400;
        height: 100%;
        line-height: 1.5em;
        overflow-x: hidden;
        text-rendering: optimizelegibility;

        &[aria-hidden='true'] {
            overflow: hidden;
        }
    }

    #root {
        height: 100%;
    }
`;

export type Colors = {
    background: {
        normal: string;
        light: string;
    };
    text: {
        placeholder: string;
    };
    focus: string;
    highlights: {
        [k in HighlightColor]: string;
    }
};

const colors: Colors = {
    background: {
        normal: '#0e151b',
        light: '#18232d'
    },
    text: {
        placeholder: '#198c8c'
    },
    focus: '#115d5d',
    highlights: {
        delimiter: '#198c8c',
        pitch: '#22cece',
        chord: '#22cece',
        setterGroup: '#821361',
        setter: '#d61ba4',
        scaleGroup: '#94472f',
        scale: '#ff541e',
        comment: '#ffffff',
        commentStart: '#198c8c',
        unknown: '#a490b3',
        error: '#cc0000',
        errorMessage: '#cc0000'
    }
};

const fonts = {
    mono: `'DM Mono', sans-serif`,
    copy: `'Nunito', sans-serif`
};

const widths = {
    sm: '640px'
};

const theme = {
    colors,
    fonts,
    widths
};

type Props = {
    children: React.ReactNode
};

export function AppWrapper(props: Props): React.ReactElement {
    const {children} = props;
    return <>
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400&display=swap" rel="stylesheet" />
        <ThemeProvider theme={theme}>
            <GlobalStyle />
            {children}
        </ThemeProvider>
    </>;
}
