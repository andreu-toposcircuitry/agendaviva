import type { Session, User } from '@supabase/supabase-js';

/**
 * Check if a user has admin role
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.app_metadata?.role === 'admin';
}

/**
 * Check if a user has moderator or admin role
 */
export function isModerator(user: User | null): boolean {
  if (!user) return false;
  const role = user.app_metadata?.role;
  return role === 'admin' || role === 'moderator';
}

/**
 * Get the current authenticated session from a SvelteKit request event
 */
export async function getSession(
  event: { locals: any }
): Promise<{ session: Session | null; user: User | null }> {
  const session = event.locals.session || null;
  const user = session?.user || null;
  return { session, user };
}

/**
 * Require authentication - throws an error if not authenticated
 */
export function requireAuth(user: User | null): asserts user is User {
  if (!user) {
    throw new Error('Authentication required');
  }
}

/**
 * Require admin role - throws an error if not admin or moderator
 */
export function requireModerator(user: User | null): asserts user is User {
  requireAuth(user);
  if (!isModerator(user)) {
    throw new Error('Moderator role required');
  }
}

/**
 * Require admin role - throws an error if not admin
 */
export function requireAdmin(user: User | null): asserts user is User {
  requireAuth(user);
  if (!isAdmin(user)) {
    throw new Error('Admin role required');
  }
}
