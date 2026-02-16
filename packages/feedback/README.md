# @cli-ai-toolkit/feedback

Gemini AI feedback and content generation library.

## Features

- Generate AI-powered feedback using Google's Gemini 2.0 Flash Lite
- Automatic retry logic and error handling
- Simple programmatic API

## Usage

### As a library:

```typescript
import { generateFeedback } from '@cli-ai-toolkit/feedback';

const feedback = await generateFeedback('Review this code: function add(a, b) { return a + b; }');
console.log(feedback);
```

### Direct service access:

```typescript
import { GeminiService } from '@cli-ai-toolkit/feedback';

const service = new GeminiService();
const content = await service.generateContent('Explain quantum computing');
```

## Configuration

Requires `GEMINI_API_KEY` environment variable.
