import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const checks: any = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    checks: {}
  };

  // Check environment variables
  checks.checks.environment = {
    status: 'ok',
    details: {
      PUBLIC_SUPABASE_URL: !!import.meta.env.PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrlValue: import.meta.env.PUBLIC_SUPABASE_URL || 'NOT_SET',
      supabaseKeyPrefix: import.meta.env.PUBLIC_SUPABASE_ANON_KEY 
        ? import.meta.env.PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + '...' 
        : 'NOT_SET'
    }
  };

  if (!import.meta.env.PUBLIC_SUPABASE_URL || !import.meta.env.PUBLIC_SUPABASE_ANON_KEY) {
    checks.checks.environment.status = 'error';
    checks.checks.environment.message = 'Missing required environment variables';
    checks.status = 'error';
  }

  // Check authentication
  checks.checks.authentication = {
    status: locals.user ? 'ok' : 'not_authenticated',
    user: locals.user ? {
      id: locals.user.id,
      email: locals.user.email,
      role: locals.user.app_metadata?.role || 'none'
    } : null
  };

  // Check API route is accessible
  checks.checks.api = {
    status: 'ok',
    message: 'Health check endpoint is accessible'
  };

  return json(checks, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
};
