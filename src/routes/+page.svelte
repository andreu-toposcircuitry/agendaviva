<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  let userInput = '';
  let aiResponse = '';
  async function askOpenAI() {
    try {
      const res = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userInput })
      });
      
      if (!res.ok) {
        let errorMessage = 'Failed to get response';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, use default error message
        }
        aiResponse = `Error: ${errorMessage}`;
        return;
      }
      
      const data = await res.json();
      aiResponse = data.choices?.[0]?.message?.content || 'No response!';
    } catch (error) {
      aiResponse = `Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`;
    }
  }
</script>

<input bind:value={userInput} placeholder="Ask OpenAI something">
<button on:click={askOpenAI}>Ask</button>
<p>{aiResponse}</p>
