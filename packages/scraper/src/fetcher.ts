import pRetry from 'p-retry';

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  userAgent?: string;
}

// We pretend to be a real browser (Chrome on Mac) to avoid being blocked
const BROWSER_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Fetch HTML content from a URL with retry logic and browser impersonation
 */
export async function fetchHtml(url: string, options: FetchOptions = {}): Promise<string> {
  const { timeout = 15000, retries = 3, userAgent = BROWSER_USER_AGENT } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await pRetry(
      async () => {
        const res = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'ca,es;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
          },
          redirect: 'follow',
          signal: controller.signal,
        });

        if (!res.ok) {
          // If we get a 403/401, retrying usually won't help, so we abort retries to save time
          if (res.status === 403 || res.status === 401) {
            throw new pRetry.AbortError(`Blocked by server (HTTP ${res.status}): ${res.statusText}`);
          }
          if (res.status === 404) {
            throw new pRetry.AbortError(`Page not found (HTTP 404)`);
          }
          
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return res;
      },
      {
        retries,
        minTimeout: 1000, // Wait 1s before first retry
        factor: 2,        // Exponential backoff (1s, 2s, 4s)
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
        headers: {
          'User-Agent': userAgent,
        },
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
