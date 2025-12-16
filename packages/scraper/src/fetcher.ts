import pRetry from 'p-retry';

export interface FetchOptions {
  timeout?: number;
  retries?: number;
  userAgent?: string;
}

const DEFAULT_USER_AGENT = 'AgendaVivaBot/1.0 (+https://agendaviva.cat/bot)';

/**
 * Fetch HTML content from a URL with retry logic
 */
export async function fetchHtml(url: string, options: FetchOptions = {}): Promise<string> {
  const { timeout = 10000, retries = 3, userAgent = DEFAULT_USER_AGENT } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await pRetry(
      async () => {
        const res = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'ca,es;q=0.9',
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        return res;
      },
      {
        retries,
        onFailedAttempt: (error) => {
          console.log(`Attempt ${error.attemptNumber} failed for ${url}: ${error.message}`);
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
    const { timeout = 5000, userAgent = DEFAULT_USER_AGENT } = options;
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
