import { getSessionFromRequest } from '$lib/supabase.server';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Get session from cookies or authorization header
  const session = await getSessionFromRequest(event);

  // Make session and user available to endpoints
  event.locals.session = session;
  event.locals.user = session?.user ?? null;

  return resolve(event);
};
