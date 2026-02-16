# CLI AI Toolkit - Monorepo

A SOLID-compliant, modular AI toolkit with CLI and library support.

## 📦 Packages

### Libraries (Reusable)
- **[@cli-ai-toolkit/core](packages/core)** - Core interfaces and types
- **[@cli-ai-toolkit/utils](packages/utils)** - Shared utilities (validation, resilience, file ops)
- **[@cli-ai-toolkit/websearch](packages/websearch)** - OpenAI web search with agentic reasoning
- **[@cli-ai-toolkit/feedback](packages/feedback)** - Gemini AI content generation
- **[@cli-ai-toolkit/screenshot](packages/screenshot)** - Playwright website screenshots
- **[@cli-ai-toolkit/imagegen](packages/imagegen)** - DALL-E 3 image generation

### Applications
- **[@cli-ai-toolkit/cli](packages/cli)** - CLI wrapper (thin interface to libraries)
- **[@cli-ai-toolkit/agent](packages/agent)** - Orchestrator (stub, future implementation)

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Build

```bash
# Build all packages (in dependency order)
cd packages/core && npm run build && cd ../..
cd packages/utils && npm run build && cd ../..
cd packages/websearch && npm run build && cd ../..
cd packages/feedback && npm run build && cd ../..
cd packages/screenshot && npm run build && cd ../..
cd packages/imagegen && npm run build && cd ../..
cd packages/cli && npm run build && cd ../..
cd packages/agent && npm run build && cd ../..
```

### Run CLI (Development)

```bash
npm run dev -- web-search "your query"
npm run dev -- gemini "your prompt"
npm run dev -- image-generate "your prompt" -s 1024x1024
npm run dev -- screenshot "https://example.com"
```

## 💻 Library Usage

Each package can be imported and used programmatically:

### Web Search
```typescript
import { search } from '@cli-ai-toolkit/websearch';

const result = await search('AI trends 2026', { 
  mode: 'agentic', 
  reasoningLevel: 'high' 
});
console.log(result.content);
```

### Feedback
```typescript
import { generateFeedback } from '@cli-ai-toolkit/feedback';

const feedback = await generateFeedback('Explain quantum computing');
```

### Screenshot
```typescript
import { captureScreenshot } from '@cli-ai-toolkit/screenshot';

const { buffer, metadata } = await captureScreenshot({
  url: 'https://example.com',
  fullPage: true
});
```

### Image Generation
```typescript
import { generateImage } from '@cli-ai-toolkit/imagegen';

const imageBuffer = await generateImage('A futuristic city', '1024x1024');
```

## ⚙️ Configuration

Create `.env` file in the project root:

```bash
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

## 📂 Project Structure

```
repo/
├── package.json (workspaces root)
├── tsconfig.json (project references)
├── packages/
│   ├── core/         (interfaces, types)
│   ├── utils/        (shared utilities)
│   ├── websearch/    (library)
│   ├── feedback/     (library)
│   ├── screenshot/   (library)
│   ├── imagegen/     (library)
│   ├── cli/          (CLI wrapper)
│   └── agent/        (orchestrator stub)
├── references/       (web search, feedback outputs)
│   └── aI_feedback/
└── images/           (generated images, screenshots)
    └── screenshots/
```

## 🛠️ Development

### Package Scripts

Each package has:
- `npm run build` - Compile TypeScript
- `npm run clean` - Remove dist/ folder

### Root Scripts

- `npm run build` - Build all packages
- `npm run dev` - Run CLI in development mode

### Adding New Packages

1. Create package directory in `packages/`
2. Add `package.json` with name `@cli-ai-toolkit/<name>`
3. Add `tsconfig.json` extending root config
4. Add package reference to root `tsconfig.json`
5. Build in dependency order

## 📝 Architecture

- **SOLID principles** - Single responsibility, dependency injection
- **Modular** - Each tool is a separate library package
- **Type-safe** - Full TypeScript with strict mode
- **Error resilient** - Retry logic, timeouts, validation
- **CLI + Library** - Use from command line or programmatically

## 📄 License

ISC
