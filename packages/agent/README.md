# @cli-ai-toolkit/agent

Orchestrator for complex multi-step AI tasks.

## Features

### Website Recreation

The `recreateWebsite()` function uses an iterative AI feedback loop to recreate any website from a URL:

1. Screenshots the target page
2. Uses Gemini Vision to generate HTML/CSS from the screenshot
3. Screenshots the generated recreation
4. Runs both pixel-diff and vision-based comparison
5. If quality thresholds aren't met, generates a detailed UI critique
6. Revises the HTML/CSS based on the critique and loops

The process continues for up to 6 iterations (configurable) or until quality thresholds are met.

## Usage

```typescript
import { recreateWebsite } from '@cli-ai-toolkit/agent';

// Simple usage
const result = await recreateWebsite('https://example.com');

console.log(`Success: ${result.success}`);
console.log(`Iterations: ${result.totalIterations}`);
console.log(`Final HTML saved to: ${result.artifacts.runDirectory}`);

// Advanced usage with custom options
const result = await recreateWebsite('https://example.com', {
  maxIterations: 8,
  pixelDiffThreshold: 95,
  visionThreshold: 90,
  viewport: { width: 1920, height: 1080 },
  runId: 'my-custom-run',
  outputDirs: {
    runs: 'custom/runs',
    screenshots: 'custom/screenshots',
    diffs: 'custom/diffs'
  }
});

// Access iteration details
result.iterations.forEach((iteration, idx) => {
  console.log(`\nIteration ${idx + 1}:`);
  console.log(`  Pixel Diff Score: ${iteration.pixelDiff.score}%`);
  console.log(`  Vision Score: ${iteration.vision.score}%`);
  
  if (iteration.critique) {
    console.log(`  Issues Found: ${iteration.critique.totalIssues}`);
  }
});
```

## Output Structure

All artifacts are saved automatically:

```
references/runs/<runId>/
  ├── iteration_1.html
  ├── iteration_2.html
  ├── ...
  └── summary.json

images/screenshots/
  ├── <runId>_target.png
  ├── <runId>_iteration_1.png
  ├── <runId>_iteration_2.png
  └── ...

images/diffs/
  ├── <runId>_iteration_1.png
  ├── <runId>_iteration_2.png
  └── ...
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxIterations` | number | 6 | Maximum number of revision iterations |
| `pixelDiffThreshold` | number | 92 | Pass threshold for pixel comparison (0-100) |
| `visionThreshold` | number | 85 | Pass threshold for AI vision comparison (0-100) |
| `viewport` | object | `{width: 1280, height: 720}` | Browser viewport dimensions |
| `waitMs` | number | 1000 | Wait time after page load (ms) |
| `runId` | string | auto | Custom run ID for organizing artifacts |
| `outputDirs` | object | see above | Custom output directories |

## Result Object

```typescript
{
  success: boolean;              // True if quality thresholds met
  finalHTML: string;             // Final generated HTML
  iterations: Array<{            // Details of each iteration
    iteration: number;
    html: string;
    screenshotPath: string;
    pixelDiff: { ... };
    vision: { ... };
    critique?: { ... };
  }>;
  totalIterations: number;
  runId: string;
  artifacts: {                   // Paths to all saved files
    targetScreenshot: string;
    finalRecreationScreenshot: string;
    finalDiffImage: string;
    runDirectory: string;
    summaryFile: string;
  };
  finalScores: {
    pixelDiff: number;
    vision: number;
  };
  executionTimeMs: number;
  stopReason: 'success' | 'max_iterations' | 'error';
  errorMessage?: string;
}
```

## Requirements

- **Environment Variables:**
  - `GEMINI_API_KEY` - Required for vision analysis and HTML generation
  
- **Dependencies:**
  - Playwright (installed automatically)
  - All packages in this monorepo

## See Also

- [example.ts](src/example.ts) - Complete usage example
