# Migration from Single Package to Monorepo

## What Changed

### Before (Single Package)
```
cli-ai-toolkit/
├── src/
│   ├── commands/
│   ├── services/
│   ├── utils/
│   └── core/
├── dist/
└── package.json (all dependencies)
```

### After (Monorepo)
```
cli-ai-toolkit/
├── packages/
│   ├── core/        (interfaces)
│   ├── utils/       (shared utilities)
│   ├── websearch/   (library)
│   ├── feedback/    (library)
│   ├── screenshot/  (library)
│   ├── imagegen/    (library)
│   ├── cli/         (wrapper)
│   └── agent/       (orchestrator)
├── references/      (unchanged)
├── images/          (unchanged)
└── package.json     (workspaces)
```

## File Mappings

| Old Location | New Location |
|--------------|--------------|
| `src/core/ICommand.ts` | `packages/core/src/ICommand.ts` |
| `src/core/Command.ts` | `packages/core/src/Command.ts` |
| `src/utils/FileUtils.ts` | `packages/utils/src/FileUtils.ts` |
| `src/utils/InputValidator.ts` | `packages/utils/src/InputValidator.ts` |
| `src/utils/APIResilience.ts` | `packages/utils/src/APIResilience.ts` |
| `src/utils/EnvValidator.ts` | `packages/utils/src/EnvValidator.ts` |
| `src/utils/Config.ts` | `packages/utils/src/Config.ts` |
| `src/services/OpenAIService.ts` | `packages/websearch/src/OpenAIService.ts` |
| `src/services/SearchService.ts` | `packages/websearch/src/SearchService.ts` |
| `src/services/GeminiService.ts` | `packages/feedback/src/GeminiService.ts` |
| `src/services/ScreenshotService.ts` | `packages/screenshot/src/ScreenshotService.ts` |
| `src/utils/ScreenshotUtils.ts` | `packages/screenshot/src/ScreenshotUtils.ts` |
| `src/services/ImageService.ts` | `packages/imagegen/src/ImageService.ts` |
| `src/commands/*.ts` | `packages/cli/src/commands/*.ts` |
| `src/index.ts` | `packages/cli/src/index.ts` |

## Import Changes

### Before
```typescript
import { FileUtils } from '../utils/FileUtils.js';
import { OpenAIService } from '../services/OpenAIService.js';
```

### After
```typescript
import { FileUtils } from '@cli-ai-toolkit/utils';
import { OpenAIService } from '@cli-ai-toolkit/websearch';
```

## Usage Changes

### CLI Usage (Unchanged)
```bash
# Still works the same way
npm run dev -- web-search "query"
npm run dev -- gemini "prompt"
npm run dev -- screenshot "url"
npm run dev -- image-generate "prompt"
```

### New: Library Usage
```typescript
// Now you can import and use programmatically
import { search } from '@cli-ai-toolkit/websearch';
import { captureScreenshot } from '@cli-ai-toolkit/screenshot';

const result = await search('query');
const screenshot = await captureScreenshot({ url: 'https://example.com' });
```

## Build Process Changes

### Before
```bash
npm run build  # Single tsc command
```

### After
```bash
# Must build in dependency order
cd packages/core && npm run build
cd packages/utils && npm run build
cd packages/websearch && npm run build
# ... etc
```

## Benefits of Monorepo

1. **Reusable Libraries** - Each tool can be imported separately
2. **Better Separation** - Clear boundaries between packages
3. **Independent Testing** - Test each package in isolation
4. **Flexible Deployment** - Publish libraries to npm independently
5. **SOLID Architecture** - Enforced dependency direction
6. **Programmatic API** - Use tools without CLI

## Breaking Changes

None for CLI users. The command-line interface remains identical.

For programmatic users (if any existed): Import paths changed from relative to package-based.

## Old src/ Directory

After migration, the original `src/` directory can be deleted. All code has been moved to `packages/`.
