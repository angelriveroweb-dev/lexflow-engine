export const getVisitorId = () => {
    if (typeof window === 'undefined') return 'unknown';

    // 1. Try to get the new standard key
    let vid = localStorage.getItem("visitor_id");

    // 2. Migration: If not found, check for the old legacy key
    if (!vid || vid === 'undefined' || vid === 'unknown') {
        const legacyVid = localStorage.getItem("lexflow_visitor_id");
        if (legacyVid && legacyVid.length > 10) {
            vid = legacyVid;
            localStorage.setItem("visitor_id", vid);
            // Optional: localStorage.removeItem("lexflow_visitor_id"); 
            // We keep it temporarily to avoid breaking old cache until full migration
        }
    }

    // 3. Generation: If still no ID, create a new one
    const isValid = vid && vid !== 'undefined' && vid !== 'null' && vid !== 'unknown' && vid.length > 10;

    if (!isValid) {
        vid = window.crypto.randomUUID();
        localStorage.setItem("visitor_id", vid);
    }

    return vid!;
};

export const cn = (...inputs: any[]) => {
    return inputs.filter(Boolean).join(' ');
};
