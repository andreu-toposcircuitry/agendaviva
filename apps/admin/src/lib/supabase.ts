import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build';

// Client-side Supabase client with auth persistence
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: browser,
    autoRefreshToken: browser,
    detectSessionInUrl: browser,
    storage: browser ? window.localStorage : undefined,
  }
});
