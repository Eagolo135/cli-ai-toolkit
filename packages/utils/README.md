# @cli-ai-toolkit/utils

Shared utilities for the CLI AI Toolkit monorepo.

## Exports

- `FileUtils` - File operations (save/read with validation)
- `InputValidator` - Input validation and sanitization
- `APIResilience` - Retry logic, timeouts, error categorization
- `EnvValidator` - Environment variable validation
- `Config` - Configuration management

## Usage

```typescript
import { FileUtils, InputValidator, APIResilience } from '@cli-ai-toolkit/utils';

// Validate and save
const validation = InputValidator.validatePrompt(userInput);
if (validation.valid) {
  await FileUtils.saveReference(content, prompt);
}

// API with resilience
await APIResilience.executeWithRetry(
  async () => apiCall(),
  { maxRetries: 3 },
  ' OperationName'
);
```
