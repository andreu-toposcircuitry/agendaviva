import { webEnvSchema, validateEnv, checkRequiredEnv } from '@agendaviva/shared';

/**
 * Validates environment at build/startup time
 * Call this in a server-side context before app initialization
 */
export function validateWebEnv() {
  const env = {
    PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    PUBLIC_SITE_URL: import.meta.env.PUBLIC_SITE_URL,
    PUBLIC_FORMSPREE_ID: import.meta.env.PUBLIC_FORMSPREE_ID,
    SUPABASE_SERVICE_KEY: import.meta.env.SUPABASE_SERVICE_KEY,
    STRIPE_SECRET_KEY: import.meta.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: import.meta.env.STRIPE_WEBHOOK_SECRET,
  };

  return validateEnv(webEnvSchema, env);
}

/**
 * Quick check for required public env vars (can run at module load)
 */
export function checkPublicEnv(): void {
  const required = [
    'PUBLIC_SUPABASE_URL',
    'PUBLIC_SUPABASE_ANON_KEY',
    'PUBLIC_SITE_URL',
  ];

  const missing = checkRequiredEnv(required, import.meta.env as Record<string, string>);

  if (missing.length > 0) {
    console.warn(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
