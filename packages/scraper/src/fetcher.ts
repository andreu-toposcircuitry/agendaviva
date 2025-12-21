import pRetry, { AbortError } from 'p-retry';
import { Agent, setGlobalDispatcher, getGlobalDispatcher } from 'undici';

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  userAgent?: string;
  allowInsecureSSL?: boolean; // Explicit opt-in per request
}

const BROWSER_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Cache for known-problematic domains that need insecure SSL
const insecureDomainCache = new Set<string>();

// Secure agent (default)
const secureAgent = new Agent({
  connect: {
    timeout: 20000,
  },
});

// Insecure agent (fallback for problematic sites)
const insecureAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
    timeout: 20000,
  },
});

// Set secure agent as default
setGlobalDispatcher(secureAgent);

/**
 * Fetch HTML content from a URL with smart SSL fallback
 *
 * First attempts with secure SSL, falls back to insecure only on
 * certificate errors and caches the domain for future requests.
 */
export async function fetchHtml(url: string, options: FetchOptions = {}): Promise<string> {
  const {
    timeout = 20000,
    retries = 3,
    userAgent = BROWSER_USER_AGENT,
    allowInsecureSSL = true, // Allow fallback by default
  } = options;

  const urlObj = new URL(url);
  const domain = urlObj.hostname;

  // Check if this domain is known to need insecure SSL
  const useInsecure = insecureDomainCache.has(domain);

  if (useInsecure) {
    setGlobalDispatcher(insecureAgent);
  } else {
    setGlobalDispatcher(secureAgent);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await pRetry(
      async () => {
        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': userAgent,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'ca,es;q=0.9,en;q=0.8',
              'Cache-Control': 'no-cache',
            },
            signal: controller.signal,
          });

          if (!res.ok) {
            if (res.status === 403 || res.status === 401) {
              throw new AbortError(`Blocked by server (HTTP ${res.status})`);
            }
            if (res.status === 404) {
              throw new AbortError('Page not found (HTTP 404)');
            }
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }

          return res;
        } catch (error: any) {
          // Check if this is an SSL certificate error
          const isSSLError =
            error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
            error.code === 'CERT_HAS_EXPIRED' ||
            error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
            error.code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
            error.code === 'ERR_TLS_CERT_ALTNAME_INVALID' ||
            error.message?.includes('certificate') ||
            error.message?.includes('SSL');

          if (isSSLError && allowInsecureSSL && !useInsecure) {
            console.warn(`[Fetcher] SSL error for ${domain}, falling back to insecure mode`);
            insecureDomainCache.add(domain);
            setGlobalDispatcher(insecureAgent);

            // Retry with insecure agent
            const res = await fetch(url, {
              headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ca,es;q=0.9,en;q=0.8',
              },
              signal: controller.signal,
            });

            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            return res;
          }

          throw error;
        }
      },
      {
        retries,
        minTimeout: 2000,
        factor: 2,
        onFailedAttempt: (error) => {
          console.log(`[Fetcher] Attempt ${error.attemptNumber} failed for ${url}: ${error.message}`);
        },
      }
    );

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
    // Reset to secure agent after request
    setGlobalDispatcher(secureAgent);
  }
}

/**
 * Check if a URL is reachable
 */
export async function checkUrl(url: string, options: FetchOptions = {}): Promise<boolean> {
  try {
    const { timeout = 5000, userAgent = BROWSER_USER_AGENT } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': userAgent },
        signal: controller.signal,
      });
      return res.ok;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return false;
  }
}

/**
 * Get list of domains currently using insecure SSL fallback
 */
export function getInsecureDomains(): string[] {
  return Array.from(insecureDomainCache);
}

/**
 * Clear the insecure domain cache
 */
export function clearInsecureDomainCache(): void {
  insecureDomainCache.clear();
}
