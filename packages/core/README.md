# @cli-ai-toolkit/core

Core interfaces and types for the CLI AI Toolkit monorepo.

## Exports

- `ICommand` - Interface for command implementations
- `Command` - Type alias for command structure

## Usage

```typescript
import { Command } from '@cli-ai-toolkit/core';

class MyCommand implements Command {
  name = 'my-command';
  
  async execute(args: any): Promise<void> {
    // Implementation
  }
}
```
