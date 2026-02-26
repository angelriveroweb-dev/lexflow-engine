const isUUID = (str: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(str);
};

export const generateUUID = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }
    // Fallback if crypto.randomUUID is not available (e.g. non-HTTPS context)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const getVisitorId = () => {
    if (typeof window === 'undefined') return 'unknown';

    // 1. Try to get the new standard key
    let vid = localStorage.getItem("visitor_id");

    // 2. Migration: If not found, check for the old legacy key
    if (!vid || vid === 'undefined' || vid === 'unknown' || !isUUID(vid)) {
        const legacyVid = localStorage.getItem("lexflow_visitor_id");
        if (legacyVid && isUUID(legacyVid)) {
            vid = legacyVid;
            localStorage.setItem("visitor_id", vid);
        }
    }

    // 3. Final Validation & Generation
    if (!vid || !isUUID(vid)) {
        vid = generateUUID();
        localStorage.setItem("visitor_id", vid);
    }

    return vid!;
};


export const cn = (...inputs: any[]) => {
    return inputs.filter(Boolean).join(' ');
};
