import pRetry, { AbortError } from 'p-retry';
import { Agent, setGlobalDispatcher } from 'undici';

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  userAgent?: string;
}

// Mimic a standard Chrome browser on macOS to avoid being identified as a bot
const BROWSER_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

// THE NUCLEAR AGENT CONFIGURATION
// 1. connect.timeout: 60s (Fixes "operation aborted" on slow sites)
// 2. family: 4 (Forces IPv4, fixes "fetch failed" on many Spanish servers)
// 3. rejectUnauthorized: false (Ignores expired/bad SSL certificates)
const globalAgent = new Agent({
  connect: {
    timeout: 60_000, 
    family: 4,       
    rejectUnauthorized: false, 
  },
  headersTimeout: 60_000,
  bodyTimeout: 60_000,
  keepAliveTimeout: 10_000,
});

setGlobalDispatcher(globalAgent);

export async function fetchHtml(url: string, options: FetchOptions = {}): Promise<string> {
  const {
    timeout = 60000, // 60 seconds default
    retries = 3,
    userAgent = BROWSER_USER_AGENT,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await pRetry(
      async () => {
        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': userAgent,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
              'Accept-Language': 'ca,es;q=0.9,en;q=0.8',
              'Cache-Control': 'no-cache',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Upgrade-Insecure-Requests': '1'
            },
            signal: controller.signal,
          });

          if (!res.ok) {
            // Stop retrying for permanent dead links (404, 410)
            if (res.status === 404 || res.status === 410) {
              throw new AbortError(`Page gone (HTTP ${res.status})`);
            }
            // Stop retrying if strictly blocked (403) to save time
            if (res.status === 403) {
              throw new AbortError(`Access Forbidden (HTTP 403)`);
            }
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }

          return res;
        } catch (error: any) {
          // Escalating timeout errors so pRetry handles them correctly
          if (error.name === 'AbortError') {
             throw new AbortError(`Timeout after ${timeout}ms`);
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
  }
}

export async function checkUrl(url: string, options: FetchOptions = {}): Promise<boolean> {
  try {
    const res = await fetch(url, { 
      method: 'HEAD', 
      headers: { 'User-Agent': BROWSER_USER_AGENT } 
    });
    return res.ok;
  } catch {
    return false;
  }
}
