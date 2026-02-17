# LIBRARY STRUCTURE

## Overview

This toolkit follows a **clean library architecture** where each package is a reusable library with a public API, and the CLI is a thin wrapper layer.

---

## Architecture Principles

### ✅ SOLID COMPLIANCE

- **Service Classes**: Core business logic
- **Command Classes**: CLI wrappers only
- **Library Exports**: Public API functions
- **Agent Orchestrator**: Coordinates multiple services
- **Clean Separation**: No business logic in CLI

### ✅ GEMINI ISOLATION

**Gemini is ONLY allowed in:**
- ✅ `packages/feedback` - Vision comparison and UI critique
- ✅ `packages/imagegen` - **NOT USED** (uses DALL-E instead)

**Gemini is NEVER in:**
- ✅ `packages/agent` - Uses feedback library, doesn't call Gemini directly
- ✅ `packages/screenshot` - Pure Playwright automation
- ✅ `packages/websearch` - Uses OpenAI only
- ✅ `packages/cli` - Wraps libraries only
- ✅ `packages/core` - Framework only

---

## Package Structure

### 📦 packages/screenshot

**Purpose:** Browser screenshot automation

**Export:** `takeScreenshot(url, opts)`

**Tech Stack:**
- Playwright (chromium headless)
- NO AI services

**Example:**
```typescript
import { takeScreenshot } from '@cli-ai-toolkit/screenshot';

const { pngPath, metaPath } = await takeScreenshot('https://example.com', {
    viewport: { width: 1440, height: 900 },
    fullPage: true,
    waitMs: 1500
});
```

**Output:** `images/screenshots/`

---

### 📦 packages/websearch

**Purpose:** AI-powered web search with reasoning

**Export:** `webSearch(query, opts)`

**Tech Stack:**
- OpenAI (gpt-4o with reasoning)
- NO Gemini

**Example:**
```typescript
import { webSearch } from '@cli-ai-toolkit/websearch';

const { path, results } = await webSearch('NJIT computer science rankings', {
    mode: 'agentic',
    reasoningLevel: 'medium'
});
```

**Output:** `references/`

---

### 📦 packages/feedback

**Purpose:** Image comparison and AI feedback

**Export:** `runFeedback(imagePath1, imagePath2, opts)`

**Export:** `generateFeedback(prompt)`

**Tech Stack:**
- ✅ Gemini Vision (gemini-2.0-flash-lite) - Image comparison ONLY
- PixelMatch - Objective pixel-by-pixel diff
- OpenAI Vision - NOT used here (used in agent)

**Example:**
```typescript
import { runFeedback, generateFeedback } from '@cli-ai-toolkit/feedback';

// Image comparison
const comparison = await runFeedback('target.png', 'recreation.png', {
    usePixelDiff: true,
    threshold: 92
});

// Text feedback
const feedback = await generateFeedback('Analyze this design');
```

**Output:** `references/aI_feedback/`, `images/diffs/`

**Role:** Gemini judges ONLY, never generates code

---

### 📦 packages/imagegen

**Purpose:** AI image generation

**Export:** `generateImage(prompt, opts)`

**Tech Stack:**
- DALL-E 3 (OpenAI)
- NO Gemini

**Example:**
```typescript
import { generateImage } from '@cli-ai-toolkit/imagegen';

const { path } = await generateImage('A futuristic cityscape', {
    size: '1024x1024'
});
```

**Output:** `images/`

---

### 📦 packages/agent

**Purpose:** Orchestrate multi-step AI workflows

**Export:** `recreateWebsite(url, opts)`

**Tech Stack:**
- Uses ALL library packages
- OpenAI Vision - HTML/CSS code generation
- Gemini Vision (via feedback) - Quality judging ONLY
- Screenshot service - Target & recreation captures
- PixelDiff service - Objective comparison

**Example:**
```typescript
import { recreateWebsite } from '@cli-ai-toolkit/agent';

const result = await recreateWebsite('https://example.com', {
    maxIterations: 6,
    pixelDiffThreshold: 92,
    visionThreshold: 85
});
```

**Workflow Loop:**
1. Screenshot target → `packages/screenshot`
2. OpenAI generates HTML → `packages/feedback` (OpenAI Vision)
3. Screenshot recreation → `packages/screenshot`
4. Compare images → `packages/feedback` (Gemini judges + PixelDiff)
5. Pass/Revise decision → Agent orchestrator
6. Repeat until pass or max iterations

**Output:** `docs/recreated/<runId>/index.html`, `references/runs/`, `images/screenshots/`, `images/diffs/`

**Features:**
- ✅ Auto-launches recreated website in browser
- ✅ Saves all artifacts (HTML, screenshots, diffs, reports)
- ✅ Stops early on success
- ✅ Max 6 iterations (configurable)

---

### 📦 packages/core

**Purpose:** Framework for CLI command registration

**Exports:**
- `Command` interface
- `CommandRegistry`

**Example:**
```typescript
import { Command, CommandRegistry } from '@cli-ai-toolkit/core';

export class MyCommand implements Command {
    name = 'my-command';
    async execute(options: any): Promise<void> {
        // Implementation
    }
}

const registry = new CommandRegistry();
registry.register(new MyCommand(), '<arg>');
```

---

### 📦 packages/utils

**Purpose:** Shared utilities

**Exports:**
- `FileUtils` - File I/O with safe naming
- `InputValidator` - Sanitize user input
- `APIResilience` - Retry logic with exponential backoff
- `EnvValidator` - Validate .env configuration

---

### 📦 packages/cli

**Purpose:** CLI wrapper ONLY (no business logic)

**Commands:**
- `screenshot` → wraps `takeScreenshot()`
- `web-search` → wraps `webSearch()`
- `gemini` → wraps `generateFeedback()`
- `image-generate` → wraps `generateImage()`
- `recreate` → wraps `recreateWebsite()`

**Example Command:**
```typescript
import { Command } from '@cli-ai-toolkit/core';
import { takeScreenshot } from '@cli-ai-toolkit/screenshot';

export class ScreenshotCommand implements Command {
    name = 'screenshot';
    
    async execute(options: any): Promise<void> {
        // Parse CLI options
        const url = options.args?.[0];
        const fullPage = !options.options?.viewport;
        
        // Call library function (NO business logic here)
        const { pngPath } = await takeScreenshot(url, { fullPage });
        
        console.log(`✅ Saved: ${pngPath}`);
    }
}
```

---

## Output Directories

**Fixed locations** (never changed):

```
references/                      # Web search results
references/aI_feedback/          # Gemini feedback (judging only)
references/runs/<runId>/         # Recreation run artifacts

images/                          # Generated images (DALL-E)
images/screenshots/              # Browser screenshots
images/diffs/                    # Pixel difference visualizations

docs/recreated/<runId>/          # Recreated websites
└── index.html                   # Final recreation (auto-launched)
```

---

## AI Provider Separation

### OpenAI Usage
- ✅ `packages/websearch` - Agentic search with reasoning
- ✅ `packages/imagegen` - DALL-E 3 image generation
- ✅ `packages/agent` - HTML/CSS code generation (OpenAIVisionService)

### Gemini Usage
- ✅ `packages/feedback` - Vision comparison, UI critique
- ✅ **Role:** Judge ONLY, NEVER generates code

### Clear Roles
- **OpenAI = Builder** (generates code, content, images)
- **Gemini = Judge** (evaluates quality, compares, critiques)

---

## Import Examples

### From CLI
```typescript
// CLI commands import library functions
import { takeScreenshot } from '@cli-ai-toolkit/screenshot';
import { webSearch } from '@cli-ai-toolkit/websearch';
import { generateImage } from '@cli-ai-toolkit/imagegen';
import { generateFeedback } from '@cli-ai-toolkit/feedback';
import { recreateWebsite } from '@cli-ai-toolkit/agent';
```

### From Agent
```typescript
// Agent imports services from other packages
import { ScreenshotService } from '@cli-ai-toolkit/screenshot';
import { GeminiService, OpenAIVisionService, PixelDiffService } from '@cli-ai-toolkit/feedback';
```

### From External Projects
```typescript
// External projects can import any library
import { takeScreenshot } from '@cli-ai-toolkit/screenshot';
import { recreateWebsite } from '@cli-ai-toolkit/agent';

// Use in your own project
const result = await recreateWebsite('https://mysite.com');
```

---

## Success Criteria ✅

- ✅ Agent uses library packages directly
- ✅ CLI wraps libraries (no business logic)
- ✅ Gemini only judges (never generates code)
- ✅ Gemini isolated to feedback package
- ✅ Clean SOLID architecture
- ✅ All packages are reusable libraries
- ✅ Output directories remain fixed
- ✅ Auto-launch recreated websites

---

## Usage Examples

### Screenshot
```bash
npm run dev -- screenshot "https://example.com"
```

### Web Search
```bash
npm run dev -- web-search "NJIT computer science" --mode agentic
```

### Image Generation
```bash
npm run dev -- image-generate "A futuristic robot" --size 1024x1024
```

### Gemini Feedback
```bash
npm run dev -- gemini "Explain quantum computing"
```

### Website Recreation
```bash
npm run dev -- recreate "https://example.com" --max-iterations 6
```

**Result:** Opens recreated website automatically in browser

---

## Testing

Build all packages:
```bash
npm run build
```

Run a command:
```bash
npm run dev -- <command> <args>
```

Check for errors:
- TypeScript compilation errors caught during build
- Runtime errors logged to console
- API errors handled with retry logic

---

## Maintenance

### Adding a New Tool

1. **Create package in `packages/<tool-name>/`**
2. **Implement Service class** with business logic
3. **Export public API function** in `src/index.ts`
4. **Create CLI Command class** that wraps the API
5. **Register command** in `packages/cli/src/index.ts`

### Gemini Restriction

- ✅ Check: `grep -r "gemini\|Gemini" packages/*/src/` 
- ❌ If found outside `feedback` or `cli`, move to feedback service
- ✅ Agent orchestrates, never calls Gemini directly

---

## Verification Commands

```bash
# Check Gemini is only in feedback
grep -r "GeminiService" packages/*/src/*.ts | grep -v feedback | grep -v cli

# Verify library exports
grep -r "export function" packages/*/src/index.ts

# Check CLI wraps libraries
grep -r "import {" packages/cli/src/commands/*.ts
```
