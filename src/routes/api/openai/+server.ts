import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';

export async function POST({ request }) {
  const { prompt } = await request.json();

  // Validate input
  if (!prompt || typeof prompt !== 'string') {
    return json({ error: 'Invalid prompt provided.' }, { status: 400 });
  }

  const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!apiResponse.ok) {
    return json({ error: 'OpenAI API error.' }, { status: 500 });
  }
  const data = await apiResponse.json();
  return json(data);
}
