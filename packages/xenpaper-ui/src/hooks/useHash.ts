import {useState, useCallback, useEffect} from 'react';

export const hashify = (newHash: string): string => {
    return encodeURIComponent(newHash)
        .replace(/_/g, '%_')
        .replace(/%20/g, '_');
};

const reverseString = (str: string): string => {
    return str
        .split('')
        .reverse()
        .join('');
};

export const unhashify = (hash: string): string => {
    return decodeURIComponent(
        // browser support for negaitve lookbehinds is patchy
        // and we want to replace all _ that arent preceded by % with %20
        // so reverse the string, replace with a negative lookahead (well supported) and reverse again
        reverseString(
            reverseString(hash).replace(/_(?!%)/g, reverseString('%20'))
        ).replace(/%_/g, '_')
    );
};

type UseHashResult = readonly [string, (newHash: string) => void];

export const useHash = (): UseHashResult => {
    const [hash, setHash] = useState(() => {
        let initialHash = unhashify(window.location.hash.substr(1));
        if(!initialHash && window.localStorage) {
            initialHash = window.localStorage.getItem('lasttune') ?? '';
        }
        return initialHash;
    });

    const onHashChange = useCallback(() => {
        setHash(window.location.hash);
    }, []);

    useEffect(() => {
        window.addEventListener('hashchange', onHashChange);
        return () => {
            window.removeEventListener('hashchange', onHashChange);
        };
    }, [onHashChange]);

    const _setHash = useCallback((newHash: string) => {
        const newHashEncoded = hashify(newHash);
        if (newHashEncoded !== hash) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            window.history.replaceState(undefined, undefined, '#' + newHashEncoded);
            window.localStorage?.setItem('lasttune', newHash);
        }
    }, [hash]);

    return [hash, _setHash] as const;
};
