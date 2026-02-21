export const getVisitorId = () => {
    if (typeof window === 'undefined') return 'unknown';
    let vid = localStorage.getItem("lexflow_visitor_id");
    if (!vid) {
        vid = crypto.randomUUID();
        localStorage.setItem("lexflow_visitor_id", vid);
    }
    return vid;
};

export const cn = (...inputs: any[]) => {
    return inputs.filter(Boolean).join(' ');
};
