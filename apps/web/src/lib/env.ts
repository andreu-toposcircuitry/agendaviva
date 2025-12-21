// Cloudflare Pages exposes env differently than Node
export function getEnv(platform: App.Platform | undefined) {
  // In Cloudflare, env comes from platform.env
  // In dev/Node, from import.meta.env
  return {
    SUPABASE_URL: platform?.env?.SUPABASE_URL ?? import.meta.env.PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: platform?.env?.SUPABASE_ANON_KEY ?? import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: platform?.env?.SUPABASE_SERVICE_KEY ?? import.meta.env.SUPABASE_SERVICE_KEY,
    STRIPE_SECRET_KEY: platform?.env?.STRIPE_SECRET_KEY ?? import.meta.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: platform?.env?.STRIPE_WEBHOOK_SECRET ?? import.meta.env.STRIPE_WEBHOOK_SECRET,
  };
}
