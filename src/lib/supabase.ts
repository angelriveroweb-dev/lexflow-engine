import { createClient } from '@supabase/supabase-js';

// These should ideally be provided via environment variables or options
// For now, we'll use a placeholder or let the loader handle initialization
export const createSupabaseClient = (url: string, key: string) => {
    return createClient(url, key);
};
