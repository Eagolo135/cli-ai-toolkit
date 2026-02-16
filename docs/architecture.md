# Monorepo Architecture

## Package Dependency Graph

```
packages/core (no deps)
    ↓
packages/utils (no deps)
    ↓
packages/websearch → utils
packages/feedback → utils
packages/screenshot → utils
packages/imagegen → utils
    ↓
packages/cli → core, utils, websearch, feedback, screenshot, imagegen
packages/agent → core, utils, all libraries
```

## Build Order

1. core
2. utils
3. websearch, feedback, screenshot, imagegen (parallel)
4. cli
5. agent

## TypeScript Configuration

- Root `tsconfig.json` defines shared compiler options
- Each package extends root config
- Project references enable incremental builds
- Composite mode for inter-package imports

## Workspace Benefits

- **Shared dependencies** - Single node_modules at root
- **Cross-package imports** - Use `@cli-ai-toolkit/*` imports
- **Atomic updates** - Change library, all consumers see it
- **Independent versioning** - Each package has own version
- **Programmatic + CLI** - Same code, multiple interfaces
