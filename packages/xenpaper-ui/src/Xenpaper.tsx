import React, {useState, useCallback, useEffect} from 'react';
import {AppWrapper} from './AppWrapper';
import {IconToggle} from './component/IconToggle';
import {Codearea} from './component/Codearea';
import {ErrorMessage} from './component/ErrorMessage';
import {LoaderPane} from './component/LoaderPane';
import {Char} from './component/Char';
import {Box, Flex} from './layout/Layout';
import {Sidebars, Footer} from './Sidebars';
import styled from 'styled-components';

import {XenpaperGrammarParser} from './data/grammar';
import type {XenpaperAST} from './data/grammar';

import {grammarToChars} from './data/grammar-to-chars';
import {grammarToMoscScore} from './data/grammar-to-mosc';
import type {MoscScore} from '@xenpaper/mosc';
import type {HighlightColor, CharData} from './data/grammar-to-chars';

import {useHash, hashify} from './hooks/useHash';
import {useWindowLoaded} from './hooks/useWindowLoaded';
import {useAnimationFrame} from './hooks/useAnimationFrame';
import {useDendriform, useInput} from 'dendriform';
import type {Dendriform} from 'dendriform';
import {setAutoFreeze} from 'immer';
setAutoFreeze(false); // sadly I am relying on mutations within the xenpaper AST because who cares

import {scoreToMs} from '@xenpaper/mosc';
import type {SoundEngine} from '@xenpaper/mosc';
import {SoundEngineTonejs} from '@xenpaper/sound-engine-tonejs';

import {Helmet} from 'react-helmet';

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
    error: string;
};

const parse = (unparsed: string): Parsed => {
    try {
        const parsed = XenpaperGrammarParser(unparsed);
        const score = grammarToMoscScore(parsed);
        const chars = grammarToChars(parsed);

        if(score) {
            const scoreMs = scoreToMs(score);

            soundEngine.setScore(scoreMs);
        }

        return {
            parsed,
            chars,
            score,
            error: ''
        };

    } catch(e) {
        const matched = e.message.match(/Unexpected token at (\d+):(\d+)/);

        const lineNumber: number = matched ? Number(matched[1]) - 1 : -1;
        const colNumber: number = matched ? Number(matched[2]) - 1 : -1;

        const chars: CharData[] = [];
        let lineCount = 0;
        let colCount = 0;
        let hasError = false;

        for(let i = 0; i < unparsed.length + 40; i++) {
            if(lineCount === lineNumber && colCount === colNumber) {
                hasError = true;
            }
            if(hasError) {
                chars[i] = {
                    color: 'error'
                };
            }
            if (unparsed[i] === '\n') {
                lineCount++;
                colCount = 0;

            } else {
                colCount++;
            }
        }

        return {
            parsed: undefined,
            chars,
            score: undefined,
            error: e.message
        };
    }
};

type CharProps = {
    className: string;
    color?: HighlightColor;
    children: React.ReactNode;
    noteId?: number;
};

const createCharElements = (
    hash: string,
    chars: CharData[]|undefined,
    time: number,
    layoutModeOn: boolean,
    layoutModeNotes: number[]
): CharProps[] => {

    const hashChars: string[] = hash.split('');

    return hashChars.map((chr, index) => {
        const ch: CharData|undefined = chars?.[index];
        const [start, end] = ch?.playTime ?? [];

        const activeFromPlayhead = !layoutModeOn
            && time !== -1
            && start !== undefined
            && end !== undefined
            && start <= time
            && end > time;

        const activeFromRealtime = layoutModeOn
            && layoutModeNotes.length > 0
            && layoutModeNotes.some(n => n === start);

        const active = activeFromPlayhead || activeFromRealtime;

        return {
            className: active ? 'active' : '',
            color: ch?.color,
            children: chr,
            noteId: start
        };
    });
};

//
// icons
//

const PLAY_PATHS = {
    paused: ['M 0 0 L 12 6 L 0 12 Z'],
    playing: ['M 0 0 L 4 0 L 4 12 L 0 12 Z', 'M 8 0 L 12 0 L 12 12 L 8 12 Z'],
    // stopped: ['M 0 0 L 12 0 L 12 12 L 0 12 Z'],
};

//
// application component with loader
//

export function Xenpaper(): React.ReactElement {
    const loaded = useWindowLoaded();

    return <AppWrapper>
        <LoaderPane height="100vh" loaded={loaded}>
            <XenpaperApp loaded={loaded} />
        </LoaderPane>
    </AppWrapper>;
}

//
// application component
//

export type SidebarState = 'info'|'share'|'none';

export type TuneForm = {
    tune: string;
    embed: boolean;
    layout: boolean;
    hash: string;
    url: string;
    urlEmbed: string;
};

type Props = {
    loaded: boolean;
};

export function XenpaperApp(props: Props): React.ReactElement {
    const {loaded} = props;

    //
    // dendriforms with application state
    //

    const [hash, setHash] = useHash();

    const tuneForm = useDendriform<TuneForm>(() => {
        let embed = false;
        let layout = false;
        let tune = hash;
        if(tune.startsWith('embed:')) {
            embed = true;
            tune = tune.substr(6);
        }
        if(tune.startsWith('layout:')) {
            layout = true;
            tune = tune.substr(7);
        }
        return {
            tune,
            embed,
            layout,
            hash: '',
            url: '',
            urlEmbed: ''
        };
    }, {history: 300});

    tuneForm.useDerive(newValue => {
        let hash = newValue.tune;

        if(newValue.layout) {
            hash = `layout:${hash}`;
        }

        const hashified = hashify(hash);

        if(newValue.embed) {
            hash = `embed:${hash}`;
        }

        const url = `https://xenpaper.com/#${hashified}`;
        const urlEmbed = `https://xenpaper.com/#embed:${hashified}`;

        tuneForm.branch('hash').set(hash);
        tuneForm.branch('url').set(url);
        tuneForm.branch('urlEmbed').set(urlEmbed);
    });

    tuneForm.branch('hash').useChange(hash => {
        setHash(hash);
    });

    const parsedForm = useDendriform<Parsed>({
        parsed: undefined,
        chars: undefined,
        score: undefined,
        error: ''
    });

    tuneForm.useDerive((value) => {
        parsedForm.set(parse(value.tune));
    });

    //
    // layout mode state
    //

    const layoutModeActiveNotes = useDendriform<number[]>([]);

    const handleToggleLayout = useCallback(() => {
        layoutModeActiveNotes.set([]);
        tuneForm.branch('layout').set(layout => !layout);
    }, []);

    const onMouseUp = useCallback(() => {
        layoutModeActiveNotes.set([]);
    }, []);

    //
    // state syncing between sound engine and react
    //

    const playing = useDendriform<boolean>(false);

    useEffect(() => {
        return soundEngine.on('end', () => {
            playing.set(false);
        });
    }, []);

    const looping = useDendriform<boolean>(false);

    //
    // sound engine callbacks
    //

    const handleSetPlayback = useCallback((play: boolean) => {
        if(parsedForm.value.error) return;
        playing.set(play);
        play ? soundEngine.play() : soundEngine.pause();
    }, []);

    const handleTogglePlayback = useCallback((state: string) => {
        handleSetPlayback(state === 'paused');
    }, []);

    const handleToggleLoop = useCallback(() => {
        const newValue = !looping.value;
        looping.set(newValue);
        soundEngine.setLoop(newValue);
    }, []);

    //
    // special key combos
    //

    useEffect(() => {
        const callback = (event: KeyboardEvent) => {
            if((event.ctrlKey || event.metaKey) && event.keyCode === 13) {
                handleSetPlayback(playing.value);
            }
            if((event.ctrlKey || event.metaKey) && event.keyCode === 90) {
                event.preventDefault();
                if(event.shiftKey) {
                    tuneForm.redo();
                } else {
                    tuneForm.undo();
                }

            }
        };

        document.addEventListener('keydown', callback);
        return () => document.removeEventListener('keydown', callback);
    }, []);

    //
    // sidebar state
    //

    const [sidebarState, setSidebar] = useState<SidebarState>('info');

    const toggleSidebarInfo = useCallback(() => {
        setSidebar(s => s !== 'info' ? 'info' : 'none');
    }, []);

    const toggleSidebarShare = useCallback(() => {
        setSidebar(s => s !== 'share' ? 'share' : 'none');
    }, []);

    const onSetTune = useCallback(async (tune: string): Promise<void> => {
        tuneForm.branch('tune').set(tune);
        await soundEngine.gotoMs(0);
        handleSetPlayback(true);
    }, []);

    //
    // textarea focus control
    //

    const focusCodearea = useCallback(() => {
        // TODO
    }, []);

    //
    // elements
    //

    const playPause = playing.render(form => {
        return <IconToggle
            state={form.useValue() ? 'playing' : 'paused'}
            paths={PLAY_PATHS}
            onClick={handleTogglePlayback}
            loaded={loaded}
            hoverBackground
            large={!tuneForm.branch('embed').useValue()}
        />;
    }, [loaded]);

    const undoRedo = tuneForm.render(form => {
        const {canUndo, canRedo} = form.useHistory();
        return <>
            <SideButton onClick={form.undo} disabled={!canUndo}>Undo</SideButton>
            <SideButton onClick={form.redo} disabled={!canRedo}>Redo</SideButton>
        </>;
    });

    const loop = looping.render(looping => {
        return <SideButton onClick={handleToggleLoop} active={looping.useValue()}>Loop</SideButton>;
    });

    const layoutMode = tuneForm.branch('layout').render(layoutMode => {
        return <SideButton multiline onClick={handleToggleLayout} active={layoutMode.useValue()}>Layout<br/>mode</SideButton>;
    });

    const sidebarToggles = <>
        <SideButton onClick={toggleSidebarInfo}>Info</SideButton>
        <SideButton onClick={toggleSidebarShare}>Share</SideButton>
    </>;

    const sidebar = <Sidebars
        sidebar={sidebarState}
        onSetTune={onSetTune}
        setSidebar={setSidebar}
        tuneForm={tuneForm}
    />;

    const code = <CodePanel
        tuneForm={tuneForm}
        parsedForm={parsedForm}
        layoutModeActiveNotes={layoutModeActiveNotes}
    />;

    const htmlTitle = <SetHtmlTitle tuneForm={tuneForm} />;

    const openOnXenpaper = tuneForm.render('url', form => (
        <EditOnXenpaperButton href={form.useValue()} target="_blank">Edit on Xenpaper</EditOnXenpaperButton>
    ));

    const codepaneContainerProps = {
        onClick: focusCodearea,
        onMouseUp
    };

    const embedLayout = tuneForm.branch('embed').useValue();

    if(embedLayout) {
        return <EmbedLayout
            playPause={playPause}
            loop={loop}
            code={code}
            openOnXenpaper={openOnXenpaper}
            htmlTitle={htmlTitle}
            codepaneContainerProps={codepaneContainerProps}
        />;
    }

    return <NormalLayout
        playPause={playPause}
        undoRedo={undoRedo}
        loop={loop}
        layoutMode={layoutMode}
        code={code}
        htmlTitle={htmlTitle}
        sidebarToggles={sidebarToggles}
        sidebar={sidebar}
        codepaneContainerProps={codepaneContainerProps}
    />;
}

//
// layouts
//

type NormalLayoutProps = {
    playPause: React.ReactNode;
    undoRedo: React.ReactNode;
    loop: React.ReactNode;
    layoutMode: React.ReactNode;
    code: React.ReactNode;
    htmlTitle: React.ReactNode;
    sidebarToggles: React.ReactNode;
    sidebar: React.ReactNode;
    codepaneContainerProps: {[prop: string]: unknown};
};

function NormalLayout(props: NormalLayoutProps): React.ReactElement {
    const {
        playPause,
        undoRedo,
        loop,
        layoutMode,
        code,
        htmlTitle,
        sidebarToggles,
        sidebar,
        codepaneContainerProps
    } = props;

    return <Flex height="100vh" flexDirection="column">
        <Flex display={['block','flex']} flexGrow="1" flexShrink="1" minHeight="0" position="relative">
            {/* toolbar on mobile */}
            <Toolbar display={['flex','none']} position="fixed" top={0} width="100%">
                {playPause}
                {undoRedo}
                {loop}
                {layoutMode}
            </Toolbar>
            {/* toolbar on desktop */}
            <Toolbar display={['none','block']} mt={4} px={2} pt="12px">
                <Box mb={3}>
                    {playPause}
                </Box>
                {undoRedo}
                {loop}
                {layoutMode}
                <Hr my={2} />
                {sidebarToggles}
            </Toolbar>
            {/* codepane */}
            <Box flexGrow="1" flexShrink="1" pl={[0,3]} overflow="auto" mt={3} pt={['24px',3]} {...codepaneContainerProps}>
                {code}
            </Box>
            {/* horizontal rule on mobile */}
            <Hr display={['block', 'none']} mt={4} />
            {/* more tool buttons on mobile */}
            <Box display={['flex', 'none']}>
                {sidebarToggles}
            </Box>
            {/* sidebars */}
            {sidebar}
        </Flex>
        <Footer display={['none', 'none', 'block']} />
        {htmlTitle}
    </Flex>;
}

type EmbedLayoutProps = {
    playPause: React.ReactNode;
    loop: React.ReactNode;
    code: React.ReactNode;
    openOnXenpaper: React.ReactNode;
    htmlTitle: React.ReactNode;
    codepaneContainerProps: {[prop: string]: unknown};
};

function EmbedLayout(props: EmbedLayoutProps): React.ReactElement {
    const {
        playPause,
        loop,
        code,
        htmlTitle,
        openOnXenpaper,
        codepaneContainerProps
    } = props;

    return <Flex height="100vh" flexDirection="column">
        <Flex flexGrow="1" flexShrink="1" minHeight="0" position="relative">
            <Toolbar display="flex" position="fixed" top={0} width="100%">
                {playPause}
                {loop}
                {openOnXenpaper}
            </Toolbar>
            <Box flexGrow="1" flexShrink="1" overflow="auto" mt={3} pt="24px" {...codepaneContainerProps}>
                {code}
            </Box>
        </Flex>
        {htmlTitle}
    </Flex>;
}

//
// codepanel
//

type CodePanelProps = {
    tuneForm: Dendriform<TuneForm>;
    parsedForm: Dendriform<Parsed>;
    layoutModeActiveNotes: Dendriform<number[]>;
};

function CodePanel(props: CodePanelProps): React.ReactElement {
    const {tuneForm, layoutModeActiveNotes, parsedForm} = props;

    return tuneForm.render(form => {

        const embed = form.branch('embed').useValue();

        // keep track of sound engine time
        const [time, setTime] = useState<number>(0);
        useAnimationFrame(() => {
            setTime(soundEngine.playing() ? soundEngine.position() : -1);
        }, []);

        // get dendriform state values
        const {chars, error} = parsedForm.useValue();
        const layoutModeOn = tuneForm.branch('layout').useValue();
        const layoutModeNotes: number[] = layoutModeActiveNotes.useValue();

        // use value with a 200ms debounce for perf reasons
        // this debounce does cause the code vlue to progress forwad
        // without the calculated syntax highlighting
        // so colours will be momentarily skew-whiff
        // but thats better than parsing the xenpaper AST at every keystroke
        const inputProps = useInput(form.branch('tune'), 200);

        // create char elements
        const charElementProps = createCharElements(
            inputProps.value,
            chars,
            time,
            layoutModeOn,
            layoutModeNotes
        );

        const charElements = charElementProps.map(({noteId, ...props}, index) => {
            if(!layoutModeOn) {
                // normal highlighted characters while editing
                return <Char key={index} {...props} />;
            }

            // highlighted characters with interaction handling for layout mode
            const onPress = () => {
                if(noteId !== undefined) {
                    layoutModeActiveNotes.set(draft => {
                        draft.push(noteId);
                    });
                }
            };

            return <Char
                key={index}
                {...props}
                onMouseDown={onPress}
                layoutMode
                layoutModeButton={noteId !== undefined}
            />;
        });

        // stop event propagation here so we can detect clicks outside of this element in isolation
        const stopPropagation = (e: Event) => e.stopPropagation();

        return <Box onClick={stopPropagation}>
            <Codearea {...inputProps} charElements={charElements} freeze={layoutModeOn || embed} />
            {error && <Box>
                <ErrorMessage>Error: {error}</ErrorMessage>
            </Box>}
        </Box>;
    });
}

//
// html title
//

type SetHtmlTitleProps = {
    tuneForm: Dendriform<TuneForm>;
};

function SetHtmlTitle(props: SetHtmlTitleProps): React.ReactElement {
    return props.tuneForm.render('tune', form => {
        const tune = form.useValue();
        // set title based on code in text area
        const titleLimit = 20;
        const title = tune.length === 0
            ? 'Xenpaper'
            : tune.length > titleLimit
                ? `Xenpaper: ${tune.slice(0, titleLimit)}...`
                : `Xenpaper: ${tune}`;

        return <Helmet>
            <title>{title}</title>
            <meta property="og:title" content={title} />
        </Helmet>;
    });
}

//
//
// styled components
//

const Toolbar = styled(Box)`
     background-color: ${props => props.theme.colors.background.normal};
     z-index: 4;
`;

const Hr = styled(Box)`
     border-top: 1px ${props => props.theme.colors.background.light} solid;
`;

const Flink = styled.a`
    color: ${props => props.theme.colors.highlights.unknown};
    text-decoration: none;
    font-style: normal;

    &:hover, &:focus {
        color: #fff;
        text-decoration: underline;
    }

    &:active {
        color: #fff;
    }
`;

type SideButtonProps = {
    active?: boolean;
    multiline?: boolean;
};

const SideButton = styled.button<SideButtonProps>`
    border: none;
    display: block;
    padding: ${props => props.multiline ? '.5rem' : '1rem .5rem'};
    cursor: ${props => props.disabled ? 'default' : 'pointer'};
    background-color: ${props => props.active
        ? props.theme.colors.text.placeholder
        : props.theme.colors.background.normal};
    color: ${props => props.disabled
        ? props.theme.colors.highlights.unknown
        : props.active
            ? props.theme.colors.background.normal
            : props.theme.colors.highlights.comment};
    position: relative;
    outline: none;
    font-family: ${props => props.theme.fonts.mono};
    font-size: ${props => props.multiline ? '0.8rem' : '0.9rem'};
    text-align: center;
    width: auto;
    text-transform: uppercase;
    border-left: 3px solid transparent;
    ${props => props.multiline && `line-height: 1em;`}

    ${props => !props.active ? `&:hover, &:focus, &:active {
        background-color: ${props.theme.colors.background.light};
    }` : ``}

    @media all and (min-width: ${props => props.theme.widths.sm}) {
        padding: .5rem;
        font-size: ${props => props.multiline ? '0.9rem' : '1.1rem'};
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
    padding: ${props => props.multiline ? '.5rem' : '1rem .5rem'};
    cursor: pointer;
    background-color: ${props => props.theme.colors.background.normal};
    color: ${props => props.theme.colors.highlights.comment};
    position: relative;
    outline: none;
    font-family: ${props => props.theme.fonts.mono};
    font-size: ${props => props.multiline ? '0.8rem' : '0.9rem'};
    text-align: center;
    width: auto;
    text-transform: uppercase;
    border-left: 3px solid transparent;
    ${props => props.multiline && `line-height: 1em;`}
    text-decoration: none;

    &:hover, &:focus, &:active {
        background-color: ${props => props.theme.colors.background.light};
        text-decoration: none;
    }

    margin-left: auto;

    @media all and (min-width: ${props => props.theme.widths.sm}) {
        font-size: ${props => props.multiline ? '0.9rem' : '1.1rem'};
    }
`;
