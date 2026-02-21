const isUUID = (str: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(str);
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
        vid = window.crypto.randomUUID();
        localStorage.setItem("visitor_id", vid);
    }

    return vid!;
};


export const cn = (...inputs: any[]) => {
    return inputs.filter(Boolean).join(' ');
};
