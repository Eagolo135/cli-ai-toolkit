# @cli-ai-toolkit/websearch

Web search library using OpenAI with agentic reasoning capabilities.

## Features

- Weak/quick search with gpt-4o-mini
- Agentic search with reasoning levels (low/medium/high)
- Deep research mode for comprehensive analysis
- Automatic retry logic and error handling
- Token usage tracking

## Usage

### As a library:

```typescript
import { search } from '@cli-ai-toolkit/websearch';

const result = await search('AI trends 2026', { 
  mode: 'agentic', 
  reasoningLevel: 'medium' 
});

console.log(result.content);
console.log(`Tokens used: ${result.tokensUsed}`);
```

### Direct service access:

```typescript
import { OpenAIService } from '@cli-ai-toolkit/websearch';

const service = new OpenAIService();
const result = await service.agenticWebSearch({
  query: 'quantum computing advances',
  mode: 'deep-research',
  reasoningLevel: 'high'
});
```

## Search Modes

- **weak**: Fast search with gpt-4o-mini (~50s timeout)
- **agentic**: Iterative reasoning search (90-180s timeout)
- **deep-research**: Comprehensive research (300s timeout)
