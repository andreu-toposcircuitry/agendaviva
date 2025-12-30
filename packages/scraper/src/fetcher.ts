import pRetry, { AbortError } from 'p-retry';
import { Agent, setGlobalDispatcher } from 'undici';

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  userAgent?: string;
  allowInsecureSSL?: boolean;
}

const BROWSER_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

// NUCLEAR AGENT: 60s timeout, Force IPv4, Ignore SSL
const globalAgent = new Agent({
  connect: {
    timeout: 60_000,
    family: 4,
    rejectUnauthorized: false,
  },
  headersTimeout: 60_000,
  bodyTimeout: 60_000,
});

setGlobalDispatcher(globalAgent);

export async function fetchHtml(url: string, options: FetchOptions = {}): Promise<string> {
  const { timeout = 60000, retries = 2, userAgent = BROWSER_USER_AGENT } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await pRetry(
      async () => {
        try {
          const res = await fetch(url, {
            headers: { 'User-Agent': userAgent, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
            signal: controller.signal,
          });

          if (!res.ok) {
             if (res.status === 404 || res.status === 410) throw new AbortError(`Page Gone (${res.status})`);
             if (res.status === 403) throw new AbortError(`Blocked (${res.status})`);
             throw new Error(`HTTP ${res.status}`);
          }
          return res;
        } catch (error: any) {
          if (error.name === 'AbortError') throw new AbortError(`Timeout after ${timeout}ms`);
          throw error;
        }
      },
      { retries, minTimeout: 2000 }
    );
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkUrl(url: string): Promise<boolean> {
  try { return (await fetch(url, { method: 'HEAD', headers: { 'User-Agent': BROWSER_USER_AGENT } })).ok; } catch { return false; }
}
