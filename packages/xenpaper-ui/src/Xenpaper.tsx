import React, { useState, useCallback, useEffect } from "react";
import { AppWrapper } from "./AppWrapper";
import { IconToggle } from "./component/IconToggle";
import { Codearea } from "./component/Codearea";
import { ErrorMessage } from "./component/ErrorMessage";
import { LoaderPane } from "./component/LoaderPane";
import { Char } from "./component/Char";
import { Box, Flex } from "./layout/Layout";
import { Sidebar, SidebarInfo, SidebarShare, Footer } from "./Sidebars";
import styled from "styled-components";

import { PitchRuler, useRulerState } from "./PitchRuler";
import type { RulerState } from "./PitchRuler";

import { XenpaperGrammarParser } from "./data/grammar";
import type { XenpaperAST, SetterGroupType } from "./data/grammar";

import { grammarToChars } from "./data/grammar-to-chars";
import { processGrammar } from "./data/process-grammar";
import type { InitialRulerState } from "./data/process-grammar";
import type { MoscScore } from "@xenpaper/mosc";
import type { HighlightColor, CharData } from "./data/grammar-to-chars";

import { useHash, hashify } from "./hooks/useHash";
import { useWindowLoaded } from "./hooks/useWindowLoaded";

import { useDendriform, useInput } from "dendriform";
import type { Dendriform } from "dendriform";
import { setAutoFreeze, enableMapSet } from "immer";
setAutoFreeze(false); // sadly I am relying on mutations within the xenpaper AST because who cares
enableMapSet();

import { scoreToMs } from "@xenpaper/mosc";
import type { SoundEngine } from "@xenpaper/mosc";
import { SoundEngineTonejs } from "@xenpaper/sound-engine-tonejs";

import { Helmet } from "react-helmet";

//
// sound engine instance
//

const soundEngine: SoundEngine = new SoundEngineTonejs();

//
// xenpaper ast parsing
//

type Parsed = {
    parsed?: XenpaperAST;
    chars?: CharData[];
    score?: MoscScore;
    initialRulerState?: InitialRulerState;
    error: string;
};

const parse = (unparsed: string): Parsed => {
    try {
        const parsed = XenpaperGrammarParser(unparsed);
        const { score, initialRulerState } = processGrammar(parsed);
        const chars = grammarToChars(parsed);

        if (score) {
            const scoreMs = scoreToMs(score);
            soundEngine.setScore(scoreMs);
        }

        return {
            parsed,
            chars,
            score,
            initialRulerState,
            error: "",
        };
    } catch (e) {
        console.log("!", e);
        const matched = e.message.match(/Unexpected token at (\d+):(\d+)/);

        const lineNumber: number = matched ? Number(matched[1]) - 1 : -1;
        const colNumber: number = matched ? Number(matched[2]) - 1 : -1;

        const chars: CharData[] = [];
        let lineCount = 0;
        let colCount = 0;
        let error;
        let errorAt;

        for (let i = 0; i < unparsed.length + 40; i++) {
            if (lineCount === lineNumber && colCount === colNumber) {
                errorAt = i;
            }
            if (unparsed[i] === "\n") {
                lineCount++;
                colCount = 0;
            } else {
                colCount++;
            }
        }

        if (typeof errorAt === "number") {
            error =
                unparsed[errorAt] !== undefined
                    ? e.message.replace(
                          "Unexpected token ",
                          `Unexpected token "${unparsed[errorAt]}" `
                      )
                    : e.message;

            chars[errorAt] = {
                color: "error",
            };
        } else {
            error = e.message;
        }

        return {
            parsed: undefined,
            chars,
            score: undefined,
            initialRulerState: undefined,
            error,
        };
    }
};

const getMsAtLine = (
    tune: string,
    chars: CharData[] | undefined,
    line: number
): number => {
    if (line === 0) {
        return 0;
    }
    let ms = 0;
    let counted = 0;
    const tuneSplit = tune.split("");
    for (let i = 0; i < tuneSplit.length; i++) {
        const chr = tuneSplit[i];
        const ch = chars?.[i];
        const [, end] = ch?.playTime ?? [];
        if (end !== undefined) {
            ms = end;
        }
        if (chr === "\n") {
            counted++;
            if (counted === line) {
                return ms;
            }
        }
    }
    return 0;
};

//
// icons
//

const PLAY_PATHS = {
    paused: ["M 0 0 L 12 6 L 0 12 Z"],
    playing: ["M 0 0 L 4 0 L 4 12 L 0 12 Z", "M 8 0 L 12 0 L 12 12 L 8 12 Z"],
    // stopped: ['M 0 0 L 12 0 L 12 12 L 0 12 Z'],
};

//
// application component with loader
//

export function Xenpaper(): React.ReactElement {
    const loaded = useWindowLoaded();

    return (
        <AppWrapper>
            <LoaderPane height="100vh" loaded={loaded}>
                <XenpaperApp loaded={loaded} />
            </LoaderPane>
        </AppWrapper>
    );
}

//
// application component
//

export type SidebarState = "info" | "share" | "ruler" | "none";

// type RealtimeState = {
//     on: boolean;
//     activeNotes: number[];
// };

export type TuneForm = {
    tune: string;
    embed: boolean;
    hash: string;
    url: string;
    urlEmbed: string;
};

type Props = {
    loaded: boolean;
};

export function XenpaperApp(props: Props): React.ReactElement {
    const { loaded } = props;

    //
    // dendriforms with application state
    //

    const [hash, setHash] = useHash();

    const tuneForm = useDendriform<TuneForm>(
        () => {
            let embed = false;
            let tune = hash;
            if (tune.startsWith("embed:")) {
                embed = true;
                tune = tune.substr(6);
            }
            return {
                tune,
                embed,
                hash: "",
                url: "",
                urlEmbed: "",
            };
        },
        { history: 300 }
    );

    tuneForm.useDerive((newValue) => {
        let hash = newValue.tune;
        const hashified = hashify(hash);

        if (newValue.embed) {
            hash = `embed:${hash}`;
        }

        const url = `https://dxinteractive.github.io/xenpaper/#${hashified}`;
        const urlEmbed = `https://dxinteractive.github.io/xenpaper/#embed:${hashified}`;

        tuneForm.branch("hash").set(hash);
        tuneForm.branch("url").set(url);
        tuneForm.branch("urlEmbed").set(urlEmbed);
    });

    tuneForm.branch("hash").useChange((hash) => {
        setHash(hash);
    });

    const parsedForm = useDendriform<Parsed>(() => parse(tuneForm.value.tune));

    tuneForm.useDerive((value) => {
        parsedForm.set(parse(value.tune));
    });

    //
    // state syncing between sound engine and react
    //

    const playing = useDendriform<boolean>(false);
    const selectedLine = useDendriform<number>(0);
    selectedLine.useChange((line) => {
        soundEngine.setLoopStart(
            getMsAtLine(tuneForm.value.tune, parsedForm.value.chars, line)
        );
    });

    useEffect(() => {
        return soundEngine.onEnd(() => {
            playing.set(false);
        });
    }, []);

    const looping = useDendriform<boolean>(false);

    //
    // ruler state
    //

    const rulerState = useRulerState(parsedForm.value.initialRulerState);

    useEffect(() => {
        return soundEngine.onNote((note, on) => {
            const id = `${note.ms}-${note.hz}`;
            rulerState.set((draft) => {
                if (on) {
                    draft.notesActive.set(id, note);
                    draft.notes.set(id, note);
                } else {
                    draft.notesActive.delete(id);
                }
            });
        });
    }, []);

    parsedForm.branch("initialRulerState").useChange((initialRulerState) => {
        rulerState.set((draft) => {
            draft.rootHz = initialRulerState?.rootHz;
            draft.octaveSize = initialRulerState?.octaveSize;
            draft.plots = initialRulerState?.plots;
            if (draft.colourMode.startsWith("proxplot")) {
                const index = Number(draft.colourMode.replace("proxplot", ""));
                if (index >= (draft.plots ?? []).length) {
                    draft.colourMode = "gradient";
                }
            }
        });
    });

    //
    // sound engine callbacks
    //

    const handleSetPlayback = useCallback((play: boolean) => {
        if (parsedForm.value.error) return;

        soundEngine.gotoMs(
            getMsAtLine(
                tuneForm.value.tune,
                parsedForm.value.chars,
                selectedLine.value
            )
        );

        playing.set(play);

        if (play) {
            soundEngine.play();
            rulerState.set((draft) => {
                draft.notes.clear();
            });
        } else {
            soundEngine.pause();
        }
    }, []);

    const handleTogglePlayback = useCallback((state: string) => {
        handleSetPlayback(state === "paused");
    }, []);

    const handleToggleLoop = useCallback(() => {
        const newValue = !looping.value;
        looping.set(newValue);
        soundEngine.setLoopActive(newValue);
    }, []);

    //
    // special key combos
    //

    useEffect(() => {
        const callback = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.keyCode === 13) {
                handleSetPlayback(playing.value);
            }
            if ((event.ctrlKey || event.metaKey) && event.keyCode === 90) {
                event.preventDefault();
                if (event.shiftKey) {
                    tuneForm.redo();
                } else {
                    tuneForm.undo();
                }
            }
        };

        document.addEventListener("keydown", callback);
        return () => document.removeEventListener("keydown", callback);
    }, []);

    //
    // sidebar state
    //

    const [sidebarState, setSidebar] = useState<SidebarState>(() => {
        return parsedForm.value?.initialRulerState?.lowHz ? "ruler" : "info";
    });

    const toggleSidebarInfo = useCallback(() => {
        setSidebar((s) => (s !== "info" ? "info" : "none"));
    }, []);

    const toggleSidebarShare = useCallback(() => {
        setSidebar((s) => (s !== "share" ? "share" : "none"));
    }, []);

    const toggleSidebarRuler = useCallback(() => {
        setSidebar((s) => (s !== "ruler" ? "ruler" : "none"));
    }, []);

    const onSetTune = useCallback(async (tune: string): Promise<void> => {
        tuneForm.branch("tune").set(tune);
        await soundEngine.gotoMs(0);
        handleSetPlayback(true);
    }, []);

    const codepaneContainerProps = {};

    //
    // elements
    //

    const playPause = playing.render(
        (form) => {
            return (
                <IconToggle
                    state={form.useValue() ? "playing" : "paused"}
                    paths={PLAY_PATHS}
                    onClick={handleTogglePlayback}
                    loaded={loaded}
                    hoverBackground
                    large={!tuneForm.branch("embed").useValue()}
                />
            );
        },
        [loaded]
    );

    const undoRedo = tuneForm.render((form) => {
        const { canUndo, canRedo } = form.useHistory();
        return (
            <>
                <SideButton onClick={form.undo} disabled={!canUndo}>
                    Undo
                </SideButton>
                <SideButton onClick={form.redo} disabled={!canRedo}>
                    Redo
                </SideButton>
            </>
        );
    });

    const loop = looping.render((looping) => {
        return (
            <SideButton onClick={handleToggleLoop} active={looping.useValue()}>
                Loop
            </SideButton>
        );
    });

    const sidebarToggles = (
        <>
            <SideButton onClick={toggleSidebarInfo}>Info</SideButton>
            <SideButton onClick={toggleSidebarShare}>Share</SideButton>
            <SideButton onClick={toggleSidebarRuler}>Ruler</SideButton>
        </>
    );

    const sidebar = (
        <>
            {sidebarState === "info" && (
                <SidebarInfo onSetTune={onSetTune} setSidebar={setSidebar} />
            )}
            {sidebarState === "share" &&
                tuneForm.render((form) => {
                    const url = form.branch("url").useValue();
                    const urlEmbed = form.branch("urlEmbed").useValue();
                    return (
                        <SidebarShare
                            setSidebar={setSidebar}
                            url={url}
                            urlEmbed={urlEmbed}
                        />
                    );
                })}
            {sidebarState === "ruler" && (
                <Sidebar
                    setSidebar={setSidebar}
                    title="Pitch ruler"
                    desc="Click and drag to pan, use mousewheel to zoom."
                    wide
                >
                    <PitchRuler rulerState={rulerState} />
                </Sidebar>
            )}
        </>
    );

    const code = (
        <CodePanel
            tuneForm={tuneForm}
            parsedForm={parsedForm}
            selectedLine={selectedLine}
        />
    );

    const htmlTitle = <SetHtmlTitle tuneForm={tuneForm} />;

    const openOnXenpaper = tuneForm.render("url", (form) => (
        <EditOnXenpaperButton href={form.useValue()} target="_blank">
            Edit on Xenpaper
        </EditOnXenpaperButton>
    ));

    const embedLayout = tuneForm.branch("embed").useValue();

    if (embedLayout) {
        return (
            <EmbedLayout
                playPause={playPause}
                loop={loop}
                code={code}
                openOnXenpaper={openOnXenpaper}
                htmlTitle={htmlTitle}
                codepaneContainerProps={codepaneContainerProps}
            />
        );
    }

    return (
        <NormalLayout
            playPause={playPause}
            undoRedo={undoRedo}
            loop={loop}
            code={code}
            htmlTitle={htmlTitle}
            sidebarToggles={sidebarToggles}
            sidebar={sidebar}
            codepaneContainerProps={codepaneContainerProps}
        />
    );
}

//
// layouts
//

type NormalLayoutProps = {
    playPause: React.ReactNode;
    undoRedo: React.ReactNode;
    loop: React.ReactNode;
    code: React.ReactNode;
    htmlTitle: React.ReactNode;
    sidebarToggles: React.ReactNode;
    sidebar: React.ReactNode;
    codepaneContainerProps: { [prop: string]: unknown };
};

function NormalLayout(props: NormalLayoutProps): React.ReactElement {
    const {
        playPause,
        undoRedo,
        loop,
        code,
        htmlTitle,
        sidebarToggles,
        sidebar,
        codepaneContainerProps,
    } = props;

    return (
        <Flex height="100vh" flexDirection="column">
            <Flex
                display={["block", "flex"]}
                flexGrow="1"
                flexShrink="1"
                minHeight="0"
                position="relative"
            >
                {/* toolbar on mobile */}
                <Toolbar
                    display={["flex", "none"]}
                    position="fixed"
                    top={0}
                    width="100%"
                >
                    {playPause}
                    {undoRedo}
                    {loop}
                </Toolbar>
                {/* toolbar on desktop */}
                <Toolbar display={["none", "block"]} mt={4} px={2} pt="12px">
                    <Box mb={3}>{playPause}</Box>
                    {undoRedo}
                    {loop}
                    <Hr my={2} />
                    {sidebarToggles}
                </Toolbar>
                {/* codepane */}
                <Box
                    flexGrow="1"
                    flexShrink="1"
                    pl={[0, 3]}
                    overflow="auto"
                    mt={3}
                    pt={["24px", 3]}
                    {...codepaneContainerProps}
                >
                    {code}
                </Box>
                {/* horizontal rule on mobile */}
                <Hr display={["block", "none"]} mt={4} />
                {/* more tool buttons on mobile */}
                <Box display={["flex", "none"]}>{sidebarToggles}</Box>
                {/* sidebars */}
                {sidebar}
            </Flex>
            {htmlTitle}
        </Flex>
    );
}

type EmbedLayoutProps = {
    playPause: React.ReactNode;
    loop: React.ReactNode;
    code: React.ReactNode;
    openOnXenpaper: React.ReactNode;
    htmlTitle: React.ReactNode;
    codepaneContainerProps: { [prop: string]: unknown };
};

function EmbedLayout(props: EmbedLayoutProps): React.ReactElement {
    const {
        playPause,
        loop,
        code,
        htmlTitle,
        openOnXenpaper,
        codepaneContainerProps,
    } = props;

    return (
        <Flex height="100vh" flexDirection="column">
            <Flex flexGrow="1" flexShrink="1" minHeight="0" position="relative">
                <Toolbar display="flex" position="fixed" top={0} width="100%">
                    {playPause}
                    {loop}
                    {openOnXenpaper}
                </Toolbar>
                <Box
                    flexGrow="1"
                    flexShrink="1"
                    overflow="auto"
                    mt={3}
                    pt="24px"
                    {...codepaneContainerProps}
                >
                    {code}
                </Box>
            </Flex>
            {htmlTitle}
        </Flex>
    );
}

//
// codepanel
//

type CodePanelProps = {
    tuneForm: Dendriform<TuneForm>;
    parsedForm: Dendriform<Parsed>;
    selectedLine: Dendriform<number>;
};

function CodePanel(props: CodePanelProps): React.ReactElement {
    return props.tuneForm.render((form) => {
        const embed = form.branch("embed").useValue();

        // get dendriform state values
        const { chars, error } = props.parsedForm.useValue();

        // use value with a 200ms debounce for perf reasons
        // this debounce does cause the code value to progress forward
        // without the calculated syntax highlighting
        // so colours will be momentarily skew-whiff
        // but thats better than parsing the xenpaper AST at every keystroke
        const inputProps = useInput(form.branch("tune"), 200);
        const tuneChars: string[] = inputProps.value.split("");
        const charDataArray: (CharData | undefined)[] = tuneChars.map(
            (chr, index) => chars?.[index]
        );

        const hasPlayStartButtons = tuneChars.some((ch) => ch === "\n");
        let playStartLine = 0;

        const charElements: React.ReactNode[] = [];

        const createPlayStart = () => {
            charElements.push(
                <PlayStart
                    key={`playstart${playStartLine}`}
                    line={playStartLine++}
                    selectedLine={props.selectedLine}
                />
            );
        };

        if (hasPlayStartButtons) {
            createPlayStart();
        }
        charDataArray.forEach((charData, index) => {
            const ch = tuneChars[index];

            charElements.push(
                <Char
                    key={index}
                    ch={ch}
                    charData={charData}
                    soundEngine={soundEngine}
                />
            );

            if (ch === "\n") {
                createPlayStart();
            }
        });

        // stop event propagation here so we can detect clicks outside of this element in isolation
        const stopPropagation = (e: Event) => e.stopPropagation();

        return (
            <Box onClick={stopPropagation}>
                <Codearea
                    {...inputProps}
                    charElements={charElements}
                    freeze={embed}
                />
                {error && (
                    <Box>
                        <ErrorMessage>Error: {error}</ErrorMessage>
                    </Box>
                )}
            </Box>
        );
    });
}

//
// html title
//

type SetHtmlTitleProps = {
    tuneForm: Dendriform<TuneForm>;
};

function SetHtmlTitle(props: SetHtmlTitleProps): React.ReactElement {
    return props.tuneForm.render("tune", (form) => {
        const tune = form.useValue();
        // set title based on code in text area
        const titleLimit = 20;
        const title =
            tune.length === 0
                ? "Xenpaper"
                : tune.length > titleLimit
                ? `Xenpaper: ${tune.slice(0, titleLimit)}...`
                : `Xenpaper: ${tune}`;

        return (
            <Helmet>
                <title>{title}</title>
                <meta property="og:title" content={title} />
            </Helmet>
        );
    });
}

//
//
// styled components
//

const Toolbar = styled(Box)`
    background-color: ${(props) => props.theme.colors.background.normal};
    z-index: 4;
`;

const Hr = styled(Box)`
    border-top: 1px ${(props) => props.theme.colors.background.light} solid;
`;

type SideButtonProps = {
    active?: boolean;
    multiline?: boolean;
};

const SideButton = styled.button<SideButtonProps>`
    border: none;
    display: block;
    padding: ${(props) => (props.multiline ? ".5rem" : "1rem .5rem")};
    cursor: ${(props) => (props.disabled ? "default" : "pointer")};
    background-color: ${(props) =>
        props.active
            ? props.theme.colors.text.placeholder
            : props.theme.colors.background.normal};
    color: ${(props) =>
        props.disabled
            ? props.theme.colors.highlights.unknown
            : props.active
            ? props.theme.colors.background.normal
            : props.theme.colors.highlights.comment};
    position: relative;
    outline: none;
    font-family: ${(props) => props.theme.fonts.mono};
    font-size: ${(props) => (props.multiline ? "0.8rem" : "0.9rem")};
    text-align: center;
    width: auto;
    text-transform: uppercase;
    border-left: 3px solid transparent;
    ${(props) => props.multiline && `line-height: 1em;`}

    ${(props) =>
        !props.active
            ? `&:hover, &:focus, &:active {
        background-color: ${props.theme.colors.background.light};
    }`
            : ``}

    @media all and (min-width: ${(props) => props.theme.widths.sm}) {
        padding: 0.5rem;
        font-size: ${(props) => (props.multiline ? "0.9rem" : "1.1rem")};
        width: 5rem;
    }
`;

type EditOnXenpaperButtonProps = {
    multiline?: boolean;
};

const EditOnXenpaperButton = styled.a<EditOnXenpaperButtonProps>`
    border: none;
    height: 3rem;
    line-height: 1rem;
    display: block;
    padding: ${(props) => (props.multiline ? ".5rem" : "1rem .5rem")};
    cursor: pointer;
    background-color: ${(props) => props.theme.colors.background.normal};
    color: ${(props) => props.theme.colors.highlights.comment};
    position: relative;
    outline: none;
    font-family: ${(props) => props.theme.fonts.mono};
    font-size: ${(props) => (props.multiline ? "0.8rem" : "0.9rem")};
    text-align: center;
    width: auto;
    text-transform: uppercase;
    border-left: 3px solid transparent;
    ${(props) => props.multiline && `line-height: 1em;`}
    text-decoration: none;

    &:hover,
    &:focus,
    &:active {
        background-color: ${(props) => props.theme.colors.background.light};
        text-decoration: none;
    }

    margin-left: auto;

    @media all and (min-width: ${(props) => props.theme.widths.sm}) {
        font-size: ${(props) => (props.multiline ? "0.9rem" : "1.1rem")};
    }
`;

type PlayStartProps = {
    line: number;
    selectedLine: Dendriform<number>;
};

const PlayStart = styled(({ line, selectedLine, ...props }: PlayStartProps) => {
    const onClick = () => selectedLine.set(line);
    return (
        <span {...props} onClick={onClick}>
            {">"}
        </span>
    );
})`
    position: absolute;
    left: 0.8rem;
    border: none;
    display: block;
    cursor: pointer;
    color: ${(props) => props.theme.colors.text.placeholder};
    outline: none;
    opacity: ${(props) =>
        props.selectedLine.useValue() === props.line ? "1" : ".2"};
    pointer-events: auto;

    transition: opacity 0.2s ease-out;

    &:hover,
    &:focus,
    &:active {
        opacity: 1;
    }
`;
