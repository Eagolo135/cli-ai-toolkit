# Library Usage Examples

## Web Search

### Basic Search
```typescript
import { search } from '@cli-ai-toolkit/websearch';

const result = await search('Best practices for TypeScript');
console.log(result.content);
```

### Agentic Search with High Reasoning
```typescript
import { search } from '@cli-ai-toolkit/websearch';

const result = await search('Climate change impact on agriculture', {
  mode: 'agentic',
  reasoningLevel: 'high'
});

console.log(`Tokens used: ${result.tokensUsed}`);
console.log(result.content);
```

### Deep Research
```typescript
import { search } from '@cli-ai-toolkit/websearch';

const result = await search('Quantum computing advances in 2026', {
  mode: 'deep-research',
  reasoningLevel: 'high'
});
// Comprehensive report with 10+ sources
```

## Feedback (Gemini)

```typescript
import { generateFeedback } from '@cli-ai-toolkit/feedback';

const code = `function add(a, b) { return a + b; }`;
const feedback = await generateFeedback(`Review this code: ${code}`);
console.log(feedback);
```

## Screenshot

### Full Page Screenshot
```typescript
import { captureScreenshot } from '@cli-ai-toolkit/screenshot';
import fs from 'fs/promises';

const { buffer, metadata } = await captureScreenshot({
  url: 'https://example.com',
  fullPage: true,
  viewport: '1920x1080'
});

await fs.writeFile('screenshot.png', buffer);
console.log(metadata);
```

### Element Screenshot
```typescript
const result = await captureScreenshot({
  url: 'https://example.com',
  selector: '.navbar',
  waitMs: 2000
});
```

## Image Generation

```typescript
import { generateImage } from '@cli-ai-toolkit/imagegen';
import fs from 'fs/promises';

const imageBuffer = await generateImage(
  'A serene mountain landscape at sunset',
  '1792x1024'
);

await fs.writeFile('landscape.png', imageBuffer);
console.log(`Generated ${imageBuffer.length} bytes`);
```

## Combined Workflow

```typescript
import { search } from '@cli-ai-toolkit/websearch';
import { generateFeedback } from '@cli-ai-toolkit/feedback';
import { captureScreenshot } from '@cli-ai-toolkit/screenshot';

// Research a topic
const research = await search('modern web design trends', {
  mode: 'agentic'
});

// Get AI feedback on findings
const analysis = await generateFeedback(`Analyze these findings: ${research.content}`);

// Capture example websites
const screenshot = await captureScreenshot({
  url: 'https://awwwards.com',
  fullPage: true
});

console.log('Workflow complete:', {
  researchTokens: research.tokensUsed,
  screenshotSize: screenshot.buffer.length
});
```

## Error Handling

```typescript
import { search } from '@cli-ai-toolkit/websearch';
import { APIError, APIResilience } from '@cli-ai-toolkit/utils';

try {
  const result = await search('your query');
} catch (error) {
  if (error instanceof APIError) {
    console.error(APIResilience.formatErrorForUser(error));
    console.log('Error category:', error.category);
    console.log('Retryable:', error.retryable);
  }
}
```
