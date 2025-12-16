import { derived, writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export const user = writable<User | null>(null);
export const session = writable<Session | null>(null);

export const isAdmin = derived(user, ($user) => {
  return $user?.app_metadata?.role === 'admin';
});

export const isModerator = derived(user, ($user) => {
  const role = $user?.app_metadata?.role;
  return role === 'admin' || role === 'moderator';
});

supabase.auth.getSession().then(({ data }) => {
  session.set(data.session);
  user.set(data.session?.user ?? null);
});

supabase.auth.onAuthStateChange((_, newSession) => {
  session.set(newSession);
  user.set(newSession?.user ?? null);
});
