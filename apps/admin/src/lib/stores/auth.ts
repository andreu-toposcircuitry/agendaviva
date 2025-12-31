import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { browser } from '$app/environment';

export const user = writable<User | null>(null);
export const session = writable<Session | null>(null);

// Sync session to cookies for SSR
function syncSessionToCookies(session: Session | null) {
  if (!browser) return;
  
  if (session) {
    // Set cookies that the server can read
    document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; samesite=lax`;
    document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
  } else {
    // Clear cookies on logout
    document.cookie = 'sb-access-token=; path=/; max-age=0';
    document.cookie = 'sb-refresh-token=; path=/; max-age=0';
  }
}

// Initialize auth state
if (browser) {
  supabase.auth.getSession().then(({ data }) => {
    session.set(data.session);
    user.set(data.session?.user ?? null);
    syncSessionToCookies(data.session);
  });

  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, newSession) => {
    console.log('Auth state changed:', event, newSession?.user?.email);
    session.set(newSession);
    user.set(newSession?.user ?? null);
    syncSessionToCookies(newSession);
    
    // Reload the page on sign in/out to ensure server state is in sync
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
      window.location.reload();
    }
  });
}

// Derived stores for role checking
// Note: We can't use derived stores from svelte/store because we need to check admin_users table
// Instead, we'll export functions that components can use
export async function checkIsAdmin(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return false;
  
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role, is_active')
    .eq('user_id', data.session.user.id)
    .single();
  
  return adminUser?.is_active && adminUser?.role === 'admin';
}

export async function checkIsModerator(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return false;
  
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role, is_active')
    .eq('user_id', data.session.user.id)
    .single();
  
  return adminUser?.is_active && (adminUser?.role === 'admin' || adminUser?.role === 'moderator');
}

// Create derived-like stores that check the database
export const isModerator = writable<boolean>(false);
export const isAdmin = writable<boolean>(false);

// Update role stores when user changes
if (browser) {
  user.subscribe(async ($user) => {
    if ($user) {
      const moderator = await checkIsModerator();
      const admin = await checkIsAdmin();
      isModerator.set(moderator);
      isAdmin.set(admin);
    } else {
      isModerator.set(false);
      isAdmin.set(false);
    }
  });
}

