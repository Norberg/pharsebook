import easySpeech from 'easy-speech';

let initializationStatus: 'not-initialized' | 'initializing' | 'initialized' | 'error' = 'not-initialized';
let initPromise: Promise<boolean> | null = null;

/**
 * Initializes easy-speech if not already initialized or initializing.
 * Returns a promise that resolves to true if successful, false otherwise.
 */
export const initializeSpeech = async (): Promise<boolean> => {
    if (initializationStatus === 'initialized') {
        console.log('Speech already initialized.');
        return true;
    }
    if (initializationStatus === 'initializing' && initPromise) {
        console.log('Speech initialization in progress, waiting...');
        return initPromise;
    }

    console.log('Initializing speech synthesis...');
    initializationStatus = 'initializing';

    initPromise = new Promise<boolean>(async (resolve) => {
        try {
            const success = await easySpeech.init({ maxTimeout: 5000, interval: 250 });
            initializationStatus = success ? 'initialized' : 'error';
            console.info(`EasySpeech initialized with status: ${initializationStatus}`);
            resolve(success);
        } catch (e) {
            console.error("Error initializing EasySpeech:", e);
            initializationStatus = 'error';
            resolve(false);
        } finally {
            initPromise = null;
        }
    });

    return initPromise;
};

/**
 * Speaks the given text using the specified language.
 * Make sure initializeSpeech() has resolved successfully before calling this.
 * Returns false if speech is not ready, true otherwise (or throws on speak error).
 */
export const speakText = (text: string, lang: string = 'it-IT'): boolean => {
    if (initializationStatus !== 'initialized') {
        console.warn('Speech synthesis not ready. Cannot speak.');
        return false;
    }

    // Normalize lang for comparison (e.g. it-IT vs it_IT)
    const normalizeLang = (l: string) => l.replace(/[-_]/g, '').toLowerCase();
    var voice = easySpeech.voices().find(v => normalizeLang(v.lang) === normalizeLang(lang));
    if (!voice) {
        // Fallback, works on firefox/linux
        voice = easySpeech.voices()
            .filter(v => lang.startsWith(v.lang))
            .find(v => v.name.includes('Henri'));
    }
    if (!voice) {
        console.warn(`No voice found for language: ${lang}. Using default.`);
        console.info("Available languages:", easySpeech.voices().map(v => v.lang));
    }
    console.log(`Using voice: ${voice?.name || 'default'} for language: ${lang}`);

    easySpeech.speak({
        text: text,
        pitch: 1,
        rate: 1,
        volume: 1,
        voice: voice || easySpeech.voices()[0],
    }).catch(e => {
        console.error("Error during easySpeech.speak:", e);
    });

    return true;
};

/**
 * Returns the current initialization status.
 */
export const getSpeechStatus = (): typeof initializationStatus => {
    return initializationStatus;
}