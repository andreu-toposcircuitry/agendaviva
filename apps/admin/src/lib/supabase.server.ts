import { createClient } from '@supabase/supabase-js';
import type { RequestEvent } from '@sveltejs/kit';

// Use import.meta.env for consistency with SvelteKit
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build';

/**
 * Creates a Supabase client that can read the user's session from cookies
 * This is used on the server-side (in API routes and hooks)
 */
export function createServerSupabaseClient(event: RequestEvent) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        // Forward the authorization header from the request if it exists
        ...(event.request.headers.get('authorization') && {
          authorization: event.request.headers.get('authorization')!,
        }),
      },
    },
  });
}

/**
 * Gets the session from cookies or authorization header
 */
export async function getSessionFromRequest(event: RequestEvent) {
  // Try to get session from cookies first
  const cookies = event.cookies;
  const accessToken = cookies.get('sb-access-token');
  const refreshToken = cookies.get('sb-refresh-token');

  if (accessToken && refreshToken) {
    const supabase = createServerSupabaseClient(event);
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (!error && data.session) {
      return data.session;
    }
  }

  // Try to get session from authorization header
  const authHeader = event.request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const supabase = createServerSupabaseClient(event);
    const { data, error } = await supabase.auth.getUser(token);

    if (!error && data.user) {
      // Return a minimal session object
      return {
        access_token: token,
        token_type: 'bearer',
        user: data.user,
      };
    }
  }

  return null;
}
