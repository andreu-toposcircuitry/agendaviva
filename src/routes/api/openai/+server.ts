import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  const { prompt } = await request.json();

  const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
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
