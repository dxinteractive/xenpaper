import React, { useState } from "react";
import { IconToggle } from "./component/IconToggle";
import { Text } from "./component/Text";
import { Box, Flex } from "./layout/Layout";
import styled from "styled-components";
import { textStyle, typography } from "styled-system";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import logo from "./assets/xenpaper-logo-512x512.png";

import type { SidebarState } from "./Xenpaper";
import { CopyToClipboard } from "react-copy-to-clipboard";

const Flink = styled.a`
    color: ${(props) => props.theme.colors.highlights.unknown};
    text-decoration: none;
    font-style: normal;

    &:hover,
    &:focus {
        color: #fff;
        text-decoration: underline;
    }

    &:active {
        color: #fff;
    }
`;

export const Footer = styled((props) => {
    return (
        <Box px={3} py={2} {...props}>
            <Text as="div" color="text.placeholder">
                <Flink href="#">Xenpaper</Flink>{" "}
                <Flink
                    target="_blank"
                    href="https://github.com/dxinteractive/xenpaper/releases"
                >
                    (v1.7.1)
                </Flink>{" "}
                is made by{" "}
                <Flink target="_blank" href="https://damienclarke.me">
                    Damien Clarke
                </Flink>{" "}
                using{" "}
                <Flink target="_blank" href="https://www.typescriptlang.org/">
                    typescript
                </Flink>
                ,{" "}
                <Flink target="_blank" href="https://reactjs.org/">
                    react
                </Flink>
                ,{" "}
                <Flink target="_blank" href="https://tonejs.github.io/">
                    tonejs
                </Flink>
                ,{" "}
                <Flink
                    target="_blank"
                    href="https://github.com/dmaevsky/rd-parse"
                >
                    rd-parse
                </Flink>
                ,{" "}
                <Flink target="_blank" href="https://styled-components.com/">
                    styled-components
                </Flink>{" "}
                and{" "}
                <Flink target="_blank" href="https://dendriform.xyz">
                    dendriform
                </Flink>
                .
            </Text>
        </Box>
    );
})`
    font-size: 0.9rem;
    font-family: ${(props) => props.theme.fonts.copy};
`;

type SidebarInfoProps = {
    onSetTune: (tune: string) => void;
    setSidebar: (open: SidebarState) => void;
};

export const SidebarInfo = (props: SidebarInfoProps): React.ReactElement => {
    const { onSetTune, setSidebar } = props;
    return (
        <Sidebar setSidebar={setSidebar} pad>
            <H>How it works</H>
            <B>
                Create tunes by typing in the text area. Press play to hear what
                you{"'"}ve written.{/*, or press <C>Ctrl / Cmd + Enter</C>.*/}
            </B>
            <Box pt={4}>
                <H>Notes</H>
            </Box>
            <B>
                Typing a number will create a note. Notes can be separated by
                spaces or commas.
                <Ex tune="0 4 7 12" color="pitch" onSetTune={onSetTune} />
            </B>
            <B>
                Notes can be held for longer with hyphens <C>---</C>, and rests
                can be added with dots <C>...</C>.
                <Ex
                    tune="0.2.3...3-2-0--."
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                Spaces, new lines and bars <C>|</C> can be placed anywhere
                between notes. Bars can also be placed during a note.
                <Ex
                    tune="0 8 7-|0 8 7-|-5 4--"
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                Notes can be written in many ways.
                <br />- as scale degrees starting from zero <C>0,2,4</C>,
                <br />- as ratios <C>3/2,5/4,1/1</C>,
                <br />- as cents <C>702c</C>,
                <br />- as divisions of an octave <C>11{"\\"}19</C>,
                <br />- as divisions of an octave with a specific size (e.g. 3){" "}
                <C>5{"\\"}13o3</C>
                <br />- as cycles per second <C>432Hz</C>
                <Ex
                    tune={"0 7 1/1 3/2 0c 702c\n0\\19 11\\19 220Hz 330Hz"}
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                Notes can be shifted up or down octaves. <C>{"'"}</C> shifts the
                following note up 1 octave, <C>"</C> shifts the following note
                up 2 octaves, and <C>`</C> shifts the following note down an
                octave.
                <Ex
                    tune={"0-3-'0-'3-\"0-'\"0-`0-``0-"}
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                Chords can be played by using <C>[</C> and <C>]</C> around a
                comma-separated pitches.
                <Ex
                    tune="[3,7]-[5,8]-[0,3,7]--.[1/1,6/5,3/2]--."
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                Chords can also be played using colon-notated ratios{" "}
                <C>4:5:6</C>
                <Ex tune="10:12:15---" color="pitch" onSetTune={onSetTune} />
            </B>
            <Box pt={4}>
                <H>Comments</H>
            </Box>
            <B>
                Comments can be added using <C>#</C> at the start of a line
                <Ex
                    tune={
                        "# a 7th chord\n[0,4,7,10]--..\n\n# a harmonic 7th chord\n4:5:6:7--.."
                    }
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <Box pt={4}>
                <H>Scales</H>
            </Box>
            <B>
                The scale can be changed at any time. A scale is denoted by{" "}
                <C>{"{"}</C> and <C>{"}"}</C>. These dictate what pitches any
                subsequent scale degrees correspond to. The default is 12 equal
                divisons of the octave <C>12edo</C>.
                <Ex
                    tune="[0,4,7]--- {31edo}[0,10,18]---"
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                Equal division equave size can be changed by replacing the{" "}
                {'"o"'} with a number or fraction <C>13ed3</C>.
                <Ex
                    tune="{13ed3}0 1 2 3 4"
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                Scales can be comprised of individual pitches.
                <Ex
                    tune={"{1/1 9/8 5/4 4/3 3/2 5/3 15/8}\n0 1 2 3 4 5 6 7-"}
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                Scales comprised of individual pitches can also set their equave
                size using <C>{"'"}</C> after the last pitch. Defaults to{" "}
                <C>2/1</C>
                <Ex
                    tune={"{1/1 5/4 4/3 3/2'}\n0 1 2 3 4 5 6 7 8-"}
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                Scales can use colon-notated ratios
                <Ex
                    tune={"{12:14:16:18:21}\n0 1 2 3 4 5 6 7-"}
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                Harmonic series segments can be specified by using the{" "}
                <C>{"::"}</C> symbol inside a colon-notated ratio scale.{" "}
                <C>4::7</C> is the same as <C>4:5:6:7</C>.
                <Ex
                    tune={"{4::7}\n0 1 2 3 4-"}
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                Scales can also reference the scale degrees at the moment they
                are encountered. This can be useful for creating a subset of a
                scale.
                <Ex
                    tune={"{19edo}{0 3 6 8 11 14 17}\n0 1 2 3 4 5 6 7-"}
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                Modes can be set using <C>{"{m"}</C> and <C>{"}"}</C>.
                <Ex
                    tune={"{12edo}{m2 1 2 2 1 2 2}\n0 1 2 3 4 5 6 7-"}
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                All pitch values other than cycles-per-second are relative to a
                root note. This can be changed with <C>{"{r...}"}</C>. It can be
                given any pitch value to use as the new root. It defaults to{" "}
                <C>{"{r440Hz}"}</C>
                <Ex
                    tune={"0 2 4-{r432Hz}0 2 4-"}
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                As each change to the root pitch is relative to the current
                root, multiple roots can be chained after each other
                <Ex
                    tune={"4 0-{r2}4 0-{r2}4 0-"}
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                This can also be used to switch octaves for a time.
                <Ex
                    tune={"4 0-{r'0}4 0-{r`0}4 0-"}
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <Box pt={4}>
                <H>Setters</H>
            </Box>
            <B>
                Setters are a type of statement that are used to set various
                parameters as a tune progresses, such as <C>(bpm:100)</C> or{" "}
                <C>(osc:sine)</C>. A setter is denoted by <C>(</C> and <C>)</C>,
                and can be placed anywhere between notes or on new lines.
                Multiple setters can be combined into a single statement using a
                semicolon <C>(bpm:100; osc:sine)</C>
            </B>

            <Box pt={4}>
                <H>Timing</H>
            </Box>
            <B>
                Tempo can be changed using the tempo setter <C>(bpm:...)</C>.
                Defaults to <C>(bpm:120)</C>
                <Ex
                    tune="(bpm:200)7 5 4 2 0..."
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                Tempo can also be set using milliseconds per beat{" "}
                <C>(bms:...)</C>.
                <Ex
                    tune="(bms:1000)3 2 0"
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                Divisions of the beat can be set using the division setter{" "}
                <C>(div:...)</C>. These can also be shortened to <C>(...)</C>,
                like <C>(4)</C> or <C>(1/4)</C>. Defaults to 2 divisions per
                beat (eighth notes) <C>(div:2)</C>
                <Ex
                    tune="0 2 3 7(3)0 2 3 7(4)0 2 3 7(1/2)0 2 3 7"
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <Box pt={4}>
                <H>Sound</H>
            </Box>
            <B>
                The oscillator can be changed using the oscillator setter{" "}
                <C>(osc:...)</C>. Defaults to <C>(osc:triangle)</C>
                <Ex
                    tune={
                        "(osc:sine)0 4 7.\n(osc:sawtooth)0 4 7.\n(osc:square)0 4 7."
                    }
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                Valid values are <C>sine</C>, <C>sawtooth</C>, <C>square</C> and{" "}
                <C>triangle</C>. Any of these can be optionally prefixed with{" "}
                <C>fm</C>, <C>am</C>or <C>fat</C>. Any of these can be suffixed
                with an integer from <C>1</C> to <C>32</C> to indicate the
                number of partials to use.
                <Ex
                    tune={
                        "(osc:fmsine)0 4 7.\n(osc:fatsquare)0 4 7.\n(osc:sawtooth5)0 4 7."
                    }
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                The envelope can be changed using the envelope setter{" "}
                <C>(env:...)</C>. This accepts 4 digits corresponding to attack,
                decay, sustain and release, where <C>0</C> is fast / small, and{" "}
                <C>9</C> is slow / big. Defaults to <C>(env:2856)</C>
                <Ex
                    tune={"(env:0158)0-.....\n(env:6860)0---..."}
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <B>
                All oscillator and envelope options are made possible by{" "}
                <Flink target="_blank" href="https://tonejs.github.io/">
                    tonejs
                </Flink>
                .
            </B>
            <Box pt={4}>
                <H>Ruler</H>
            </Box>
            <B>
                The Ruler button displays a pitch ruler. Played notes will
                appear on it. Click and drag to pan, use the mouse wheel to
                zoom. Touch devices are not yet supported.
            </B>
            <B>
                The current scale can be plotted by calling <C>(plot)</C>.
                Calling it multiple times will render multiple scales. To see
                this demo, you must click Ruler after you click Demo.
                <Ex
                    tune={"(plot){19edo}(plot)"}
                    color="pitch"
                    onSetTune={onSetTune}
                />
            </B>
            <Box pt={4}>
                <H>Bugs and future features</H>
            </Box>
            <B>
                Find anything broken, or have some ideas you want to share?
                Visit the{" "}
                <Flink
                    target="_blank"
                    href="https://github.com/dxinteractive/xenpaper/issues"
                >
                    issue tracker on github
                </Flink>{" "}
                to file bugs or discuss future features.
            </B>
            <Box display={["block", "block", "none"]} pt={4}>
                <Footer />
            </Box>
        </Sidebar>
    );
};

type SidebarShareProps = {
    setSidebar: (open: SidebarState) => void;
    url: string;
    urlEmbed: string;
};

export const SidebarShare = (props: SidebarShareProps): React.ReactElement => {
    const { setSidebar, url, urlEmbed } = props;

    const iframeCode = `<iframe width="560" height="315" src="${urlEmbed}" title="Xenpaper" frameborder="0"></iframe>`;

    const [copiedLink, setCopiedLink] = useState<boolean>(false);
    const [copiedIframe, setCopiedIframe] = useState<boolean>(false);

    return (
        <Sidebar setSidebar={setSidebar} pad>
            <Box>
                <H>Share link</H>
                <Flex>
                    <ShareInput value={url} />
                    <Box flexShrink="0" ml={3}>
                        <CopyToClipboard
                            text={url}
                            onCopy={() => setCopiedLink(true)}
                        >
                            <TryButton>
                                {copiedLink ? "Copied" : "Copy"}
                            </TryButton>
                        </CopyToClipboard>
                    </Box>
                </Flex>
            </Box>
            <Box pt={4}>
                <H>Embed</H>
                <Flex>
                    <ShareInput value={iframeCode} />
                    <Box flexShrink="0" ml={3}>
                        <CopyToClipboard
                            text={url}
                            onCopy={() => setCopiedIframe(true)}
                        >
                            <TryButton>
                                {copiedIframe ? "Copied" : "Copy"}
                            </TryButton>
                        </CopyToClipboard>
                    </Box>
                </Flex>
                <Box pt={3}>
                    <EmbedIframe
                        key={urlEmbed}
                        src={urlEmbed}
                        frameBorder="0"
                    />
                </Box>
            </Box>
        </Sidebar>
    );
};

const EmbedIframe = styled.iframe`
    width: 100%;
`;

const ShareInput = styled.input.attrs(() => ({ readOnly: true }))`
    width: 100%;
    background-color: ${(props) => props.theme.colors.background.normal};
    font-family: ${(props) => props.theme.fonts.mono};
    color: #ffffff;
    padding: 0.25rem;
    border: ${(props) =>
            props.theme.colors.highlights[props.color || "unknown"]}
        1px solid;
`;

type SidebarProps = {
    setSidebar: (open: SidebarState) => void;
    children: React.ReactNode;
    title?: string;
    desc?: string;
    pad?: boolean;
    wide?: boolean;
};

export const Sidebar = (props: SidebarProps): React.ReactElement => {
    const { setSidebar, children, title, desc, pad, wide } = props;
    return (
        <TextPanel
            width={["auto", "20rem", "30rem", wide ? "55%" : "40%"]}
            flexDirection="column"
            flexShrink="0"
            minHeight="0"
            height={["66vh", "auto"]}
        >
            <Box
                position={["absolute", "fixed"]}
                top={0}
                right={0}
                pt={3}
                pr={3}
            >
                <IconToggle
                    state="cross"
                    paths={{
                        cross: [
                            "M 1 0 L 12 11 L 11 12 L 0 1 Z",
                            "M 1 12 L 12 1 L 11 0 L 0 11 Z",
                        ],
                        none: [],
                    }}
                    onClick={() => setSidebar("none")}
                    loaded
                />
            </Box>
            <LogoArea>
                {title && <Hsize>{title}</Hsize>}
                {desc && (
                    <Text
                        as="div"
                        color="text.placeholder"
                        style={{ fontStyle: "italic", lineHeight: "1.3rem" }}
                    >
                        {desc}
                    </Text>
                )}
                {!title && (
                    <Flex alignItems="center">
                        <Box mr={4} width="5rem" pt={2}>
                            <img alt="Xenpaper logo" src={logo} width="100%" />
                        </Box>
                        <Box>
                            <Logo>xenpaper</Logo>
                            <Text
                                as="div"
                                color="text.placeholder"
                                style={{
                                    fontStyle: "italic",
                                    lineHeight: "1.3rem",
                                }}
                            >
                                Text-based microtonal sequencer.
                            </Text>
                            <Text
                                as="div"
                                color="text.placeholder"
                                style={{
                                    fontStyle: "italic",
                                    lineHeight: "1.3rem",
                                }}
                            >
                                Write down musical ideas and share the link
                                around.
                            </Text>
                        </Box>
                    </Flex>
                )}
            </LogoArea>
            <Box p={pad ? 4 : 0} flexGrow="1">
                {children}
            </Box>
        </TextPanel>
    );
};

const TextPanel = styled(Flex)`
    background-color: ${(props) => props.theme.colors.background.light};
    font-family: ${(props) => props.theme.fonts.copy};
    position: relative;
    animation: 0.3s ease-out onShow;
    position: relative;
    overflow: auto;

    opacity: 1;
    top: 0;

    @keyframes onShow {
        0% {
            opacity: 0;
            top: 0.25rem;
        }
        100% {
            opacity: 1;
            top: 0;
        }
    }
`;

const LogoArea = styled(Box)`
    background-color: ${(props) => props.theme.colors.background.normal};
    padding: 2rem 2rem 1.5rem;
`;

const Logo = styled(Box)`
    font-size: 2.5rem;
    line-height: 2rem;
    margin-bottom: 0.5rem;
`;

const B = styled.div`
    margin-bottom: 2rem;
`;

const H = styled.h2`
    font-size: 1.5rem;
    margin-bottom: 1rem;
`;

const Hsize = styled.h2`
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
`;

const C = styled.span`
    font-family: ${(props) => props.theme.fonts.mono};
    background-color: ${(props) => props.theme.colors.background.normal};
    padding: 0.1rem;
`;

type ExProps = {
    tune: string;
    onSetTune: (tune: string) => void;
    color: string;
    className?: string;
};

const Ex = styled((props: ExProps): React.ReactElement => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return (
        <Flex className={props.className}>
            <Eg>e.g. </Eg>
            <E fontSize={["1.1rem", "1.4rem"]} color={props.color}>
                {props.tune}
            </E>
            <Box flexShrink="0">
                <TryButton onClick={() => props.onSetTune(props.tune)}>
                    Demo
                </TryButton>
            </Box>
        </Flex>
    );
})`
    font-family: ${(props) => props.theme.fonts.mono};
    padding: 0.5rem;
    margin-top: 1rem;
    background-color: ${(props) => props.theme.colors.background.normal};
    line-height: 2em;
`;

const TryButton = styled.button`
    border: none;
    display: block;
    padding: 0.5rem;
    cursor: pointer;
    background-color: ${(props) => props.theme.colors.highlights.scale};
    color: ${(props) => props.theme.colors.background.normal};
    position: relative;
    outline: none;
    opacity: 0.7;

    transition: opacity 0.2s ease-out;

    &:hover,
    &:focus,
    &:active {
        opacity: 1;
    }
`;

const Eg = styled.div`
    font-style: italic;
    color: ${(props) => props.theme.colors.text.placeholder};
    padding-left: 0.6rem;
    padding-right: 1rem;
    flex-shrink: 0;
`;

type EProps = {
    fontSize: unknown;
};

const E = styled.pre<EProps>`
    flex-grow: 1;
    ${textStyle}
    ${typography}
    line-height: 1.4em;
    font-style: normal;
    color: ${(props) =>
        props.theme.colors.highlights[props.color || "unknown"]};
    word-wrap: break-word;
    white-space: pre-wrap;
    flex-shrink: 1;
    width: 0;
    padding-right: 0.5rem;
`;
