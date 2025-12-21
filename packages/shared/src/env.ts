import { z } from 'zod';

/**
 * Schema for web app environment variables
 */
export const webEnvSchema = z.object({
  // Public (client-safe)
  PUBLIC_SUPABASE_URL: z.string().url('PUBLIC_SUPABASE_URL must be a valid URL'),
  PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'PUBLIC_SUPABASE_ANON_KEY is required'),
  PUBLIC_SITE_URL: z.string().url('PUBLIC_SITE_URL must be a valid URL'),
  PUBLIC_FORMSPREE_ID: z.string().optional(),

  // Private (server-only)
  SUPABASE_SERVICE_KEY: z.string().min(1, 'SUPABASE_SERVICE_KEY is required').optional(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_').optional(),
});

/**
 * Schema for agent/scraper environment variables
 */
export const agentEnvSchema = z.object({
  OPENAI_API_KEY: z.string().startsWith('sk-', 'OPENAI_API_KEY must start with sk-'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'SUPABASE_SERVICE_KEY is required'),
});

/**
 * Schema for scraper environment variables
 */
export const scraperEnvSchema = agentEnvSchema.extend({
  BRAVE_API_KEY: z.string().optional(),
});

export type WebEnv = z.infer<typeof webEnvSchema>;
export type AgentEnv = z.infer<typeof agentEnvSchema>;
export type ScraperEnv = z.infer<typeof scraperEnvSchema>;

/**
 * Validate environment variables and return typed object
 * Throws ZodError with detailed messages if validation fails
 */
export function validateEnv<T extends z.ZodType>(
  schema: T,
  env: Record<string, string | undefined>
): z.infer<T> {
  const result = schema.safeParse(env);

  if (!result.success) {
    const errors = result.error.errors
      .map(e => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return result.data;
}

/**
 * Check if all required env vars are present (for build-time checks)
 * Returns array of missing variable names
 */
export function checkRequiredEnv(
  required: string[],
  env: Record<string, string | undefined>
): string[] {
  return required.filter(key => !env[key] || env[key] === '');
}
