import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csfmrrjklvawxxhddgek.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzZm1ycmprbHZhd3h4aGRkZ2VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMDAxNjUsImV4cCI6MjA4NTU3NjE2NX0.JZvPjloBM70iuC2wfRHTnVEsGwZvdMEadi1GMFdobNk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase.from('analytics_events').insert({
        visitor_id: '123e4567-e89b-12d3-a456-426614174000',
        page_path: '/',
        client_id: '30727c70-d179-4f1d-ab7b-61d5275c1f31',
        event_type: 'session_start',
        metadata: { test: true }
    });
    console.log("Error:", error);
    console.log("Data:", data);
}
test();
