import { supabase } from '$lib/supabase';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Get session from Supabase
  const {
    data: { session }
  } = await supabase.auth.getSession();

  // Make session and user available to endpoints
  event.locals.session = session;
  event.locals.user = session?.user ?? null;

  return resolve(event);
};
