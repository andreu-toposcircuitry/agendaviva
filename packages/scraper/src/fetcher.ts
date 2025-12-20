import pRetry, { AbortError } from 'p-retry';
import { Agent, setGlobalDispatcher } from 'undici';

// 1. CONFIGURE GLOBAL DISPATCHER (The Fix)
// This tells Node.js to accept older/invalid SSL certificates, 
// which often fixes "fetch failed" on government/municipal sites.
const agent = new Agent({
  connect: {
    rejectUnauthorized: false, // <--- ALLOWS "INSECURE" CERTS
    timeout: 20000
  }
});
setGlobalDispatcher(agent);

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  userAgent?: string;
}

const BROWSER_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Fetch HTML content from a URL with retry logic and robust SSL handling
 */
export async function fetchHtml(url: string, options: FetchOptions = {}): Promise<string> {
  const { timeout = 20000, retries = 3, userAgent = BROWSER_USER_AGENT } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await pRetry(
      async () => {
        // We use the standard fetch, but it now uses our custom 'agent' 
        // configured above to handle SSL handshake issues.
        const res = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'ca,es;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          if (res.status === 403 || res.status === 401) {
            throw new AbortError(`Blocked by server (HTTP ${res.status}): ${res.statusText}`);
          }
          if (res.status === 404) {
            throw new AbortError(`Page not found (HTTP 404)`);
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return res;
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
