import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';

export async function POST({ request }) {
  let prompt: string;
  
  // Parse and validate request body
  try {
    const body = await request.json();
    prompt = body.prompt;
  } catch {
    return json({ error: 'Invalid JSON in request body.' }, { status: 400 });
  }

  // Validate input
  if (!prompt || typeof prompt !== 'string') {
    return json({ error: 'Invalid prompt provided.' }, { status: 400 });
  }

  // Validate prompt length (max 4000 characters)
  if (prompt.length > 4000) {
    return json({ error: 'Prompt is too long. Maximum 4000 characters allowed.' }, { status: 400 });
  }

  try {
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
  } catch (error) {
    console.error('OpenAI API request failed:', error);
    return json({ error: 'Failed to communicate with OpenAI API.' }, { status: 500 });
  }
}
