import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  import.meta.env.SUPABASE_SERVICE_KEY || 'placeholder-service-role-key-for-build';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

export const hasServiceRole =
  !!import.meta.env.SUPABASE_SERVICE_KEY &&
  import.meta.env.SUPABASE_SERVICE_KEY !== 'placeholder-service-role-key-for-build';
