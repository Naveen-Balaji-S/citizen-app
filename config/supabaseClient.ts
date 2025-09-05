import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oltzwasagaazcmrdsxiq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdHp3YXNhZ2FhemNtcmRzeGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzMwNTEsImV4cCI6MjA3MjY0OTA1MX0.KpOXgj8gbnAoCzPCe-noPI9sj9D6HH_lBPSWyEtmXqY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
