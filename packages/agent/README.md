# @agendaviva/agent

AI classification agent using OpenAI GPT-4o-mini for activity classification and ND-readiness scoring.

## Features

- Activity classification across 9 typologies
- ND-readiness scoring (1-5 scale)
- Structured output with Zod validation
- Rate limiting and exponential backoff
- Duplicate detection with Levenshtein distance
- Batch processing with progress tracking

## Usage

```typescript
import { classifyActivity, classifyActivities } from '@agendaviva/agent';

// Single classification
const result = await classifyActivity({
  text: 'Escola de música per a nens de 6 a 12 anys...',
  sourceType: 'scraping',
});

// Batch classification with progress
const results = await classifyActivities(inputs, {
  onProgress: (completed, total, result) => {
    console.log(`${completed}/${total}: ${result.output?.activitat.nom}`);
  },
  rateLimitConfig: {
    requestsPerMinute: 30,
  },
});
```

## Environment Variables

```
OPENAI_API_KEY=sk-...
```
