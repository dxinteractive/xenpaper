import {useState, useEffect} from 'react';

const windowLoadPromise = new Promise(resolve => {
    const handleLoad = () => {
        window.removeEventListener('load', handleLoad);
        resolve(null);
    };
    window.addEventListener('load', handleLoad);
});

export const useWindowLoaded = (): boolean => {

    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            await windowLoadPromise;
            await (document as any).fonts.ready;
            setLoaded(true);
        })();
    }, []);

    return loaded;
};
