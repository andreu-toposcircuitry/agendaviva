import { EmailMessage } from 'cloudflare:email';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  ANTHROPIC_API_KEY: string;
}

export default {
  async email(message: EmailMessage, env: Env) {
    const from = message.from;
    const subject = message.headers.get('subject') || '';

    const reader = message.raw.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        totalLength += value.length;
      }
    }

    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const body = new TextDecoder().decode(merged);

    await fetch(`${env.SUPABASE_URL}/rest/v1/emails_ingestats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        from_email: from,
        subject,
        body_text: body,
        processat: false,
      }),
    });
  },
};
