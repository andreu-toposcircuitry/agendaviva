<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  let userInput = '';
  let aiResponse = '';
  async function askOpenAI() {
    const res = await fetch('/api/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userInput })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      aiResponse = `Error: ${errorData.error || 'Failed to get response'}`;
      return;
    }
    
    const data = await res.json();
    aiResponse = data.choices?.[0]?.message?.content || 'No response!';
  }
</script>

<input bind:value={userInput} placeholder="Ask OpenAI something">
<button on:click={askOpenAI}>Ask</button>
<p>{aiResponse}</p>
