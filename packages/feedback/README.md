# @cli-ai-toolkit/feedback

Gemini AI feedback and content generation library with objective pixel-diff comparison.

## Features

- **Pixel-Diff Comparison**: Objective pixel-by-pixel image comparison using `pixelmatch`
- **Vision-Based UI Critique**: Optional AI-powered detailed UI difference analysis
- **AI-Powered Feedback**: Subjective image evaluation using Google's Gemini 2.0 Flash Lite
- Automatic retry logic and error handling
- Configurable pass thresholds
- Diff image generation with timestamps
- JSON and Markdown feedback reports
- Prioritized punch lists for UI fixes
- Simple programmatic API

## Usage

### Pixel-Diff Comparison (Recommended)

Objective comparison with measurable similarity scores:

```typescript
import { runFeedback } from '@cli-ai-toolkit/feedback';

const result = await runFeedback(
    'Compare screenshot accuracy',
    {
        targetImagePath: 'reference/target.png',
        candidateImagePath: 'output/candidate.png',
        usePixelDiff: true,  // Default: true
        passThreshold: 92,    // Default: 92 (score >= 92 to pass)
        slug: 'my-test'       // Optional: for naming output files
    }
);

console.log(`Pass: ${result.pass}`);
console.log(`Score: ${result.score}/100`);
console.log(`Mismatch: ${result.mismatchPercent}%`);
console.log(`Diff Image: ${result.diffImagePath}`);
console.log(`Feedback: ${result.path}`);
```

### Pixel-Diff + Vision Critique (Comprehensive)

Combine objective pixel measurement with AI-powered UI analysis:

```typescript
import { runFeedback } from '@cli-ai-toolkit/feedback';

const result = await runFeedback(
    'Compare homepage implementation',
    {
        targetImagePath: 'design/homepage-design.png',
        candidateImagePath: 'screenshots/homepage-actual.png',
        usePixelDiff: true,           // Pixel diff is primary pass/fail signal
        passThreshold: 92,
        includeVisionCritique: true,  // Add AI-powered UI critique
        visionContext: 'Homepage header, navigation, and hero section',
        slug: 'homepage-test'
    }
);

// Pass/fail determined by pixel diff
console.log(`Pass: ${result.pass}`);
console.log(`Score: ${result.score}/100`);

// Vision critique provides actionable fix list
if (result.visionCritique) {
    console.log(`\nUI Issues Found: ${result.visionCritique.totalIssues}`);
    console.log(`Summary: ${result.visionCritique.summary}\n`);
    
    // Prioritized punch list
    result.visionCritique.items.forEach((item, i) => {
        console.log(`${i + 1}. [${item.priority}] ${item.element}`);
        console.log(`   Issue: ${item.issue}`);
        console.log(`   Expected: ${item.expected}`);
        console.log(`   Actual: ${item.actual}\n`);
    });
}
```

**Key Points:**
- **Pixel diff determines pass/fail** (objective, deterministic)
- **Vision critique is supplementary** (provides actionable UI fixes)
- **Safe error handling**: If vision fails, pixel diff result still returns
- **Requires**: `GEMINI_API_KEY` environment variable
- **Output**: Concrete fixes with specific CSS-like values (padding, colors, sizes, etc.)

### Direct PixelDiffService

For more control:

```typescript
import { PixelDiffService } from '@cli-ai-toolkit/feedback';

const service = new PixelDiffService({
    passThreshold: 95,           // Score >= 95 to pass
    diffOutputDir: 'images/diffs' // Output directory for diff images
});

const result = await service.compareImages(
    'target.png',
    'candidate.png',
    'test-slug' // Optional
);

console.log(`Score: ${result.score}/100`);
console.log(`Mismatch Pixels: ${result.mismatchPixels}`);
console.log(`Total Pixels: ${result.totalPixels}`);
console.log(`Diff Image: ${result.diffImagePath}`);
console.log(`Notes:\n${result.notes}`);
```

### Gemini AI Comparison (Subjective)

For subjective visual quality assessment:

```typescript
import { runFeedback } from '@cli-ai-toolkit/feedback';

const result = await runFeedback(
    'Compare visual design and layout quality',
    {
        targetImagePath: 'design/target.png',
        candidateImagePath: 'output/candidate.png',
        usePixelDiff: false  // Use Gemini AI instead
    }
);
```

### Generate AI Feedback

```typescript
import { generateFeedback } from '@cli-ai-toolkit/feedback';

const feedback = await generateFeedback('Review this code: function add(a, b) { return a + b; }');
console.log(feedback);
```

### Direct Gemini Service Access

```typescript
import { GeminiService } from '@cli-ai-toolkit/feedback';

const service = new GeminiService();
const content = await service.generateContent('Explain quantum computing');
```

## Output Structure

### Pixel-Diff Outputs

- **Diff Images**: `images/diffs/2026-02-16T10-30-45__diff__slug.png`
- **Feedback JSON**: `references/aI_feedback/2026-02-16T10-30-45__feedback__slug.json`
- **Feedback Markdown**: `references/aI_feedback/2026-02-16T10-30-45__feedback__slug.md`

### Feedback JSON Format

```json
{
  "goal": "Compare screenshot accuracy",
  "method": "pixel-diff",
  "targetImage": "reference/target.png",
  "candidateImage": "output/candidate.png",
  "result": {
    "pass": true,
    "score": 98.45,
    "mismatchPercent": 1.55,
    "diffImagePath": "images/diffs/2026-02-16T10-30-45__diff__my-test.png",
    "notes": "✅ Excellent match (1.55% difference)..."
  },
  "visionCritique": {
    "summary": "Minor spacing and sizing differences in header and button",
    "totalIssues": 5,
    "items": [
      {
        "priority": "high",
        "category": "spacing",
        "element": "Header navigation",
        "issue": "Padding inconsistency",
        "expected": "padding: 16px 24px",
        "actual": "padding: 12px 20px"
      },
      {
        "priority": "medium",
        "category": "sizing",
        "element": "Primary CTA button",
        "issue": "Button height mismatch",
        "expected": "height: 44px",
        "actual": "height: 40px"
      }
    ]
  },
  "timestamp": "2026-02-16T10:30:45.123Z"
}
```

### Vision Critique Structure

When `includeVisionCritique: true`, the feedback includes:

- **summary**: Brief overview of differences found
- **totalIssues**: Count of actionable items
- **items[]**: Prioritized list of specific fixes
  - **priority**: `critical` | `high` | `medium` | `low`
  - **category**: `layout` | `typography` | `colors` | `spacing` | `sizing` | `alignment` | `borders` | `other`
  - **element**: Specific UI component (e.g., "Header logo", "Submit button")
  - **issue**: What's wrong
  - **expected**: What target shows (specific values)
  - **actual**: What candidate shows (specific values)

## Pixel-Diff Score Interpretation

The pixel-diff service provides context-aware notes based on mismatch level:

- **0% mismatch**: Perfect pixel-identical match
- **< 1% mismatch**: Excellent match (anti-aliasing, sub-pixel rendering)
- **1-5% mismatch**: Good match (font rendering, minor spacing)
- **5-15% mismatch**: Moderate differences (layout shifts, styling)
- **15-40% mismatch**: Significant differences (structural changes)
- **> 40% mismatch**: Very high mismatch (completely different)

Score formula: `score = 100 - mismatchPercent`

## Configuration

### Environment Variables

- `GEMINI_API_KEY`: Required for Gemini AI features and vision critique  
  - **Not needed** for pixel-diff only
  - **Required** for `includeVisionCritique: true` or `usePixelDiff: false`
  - Get your key: https://makersuite.google.com/app/apikey

### Pass Threshold

Default: `92` (configurable per comparison)

```typescript
const service = new PixelDiffService({ passThreshold: 95 });
// or
const result = await runFeedback(goal, { 
    passThreshold: 95,
    ...opts 
});
```

## Testing

Test the pixel-diff functionality:

```bash
# Build the package
npm run build

# Test pixel diff only (no API key needed)
node dist/test-pixel-diff.js target.png candidate.png 92 my-test

# Test quick pixel diff (auto-generates test images)
node dist/quick-test.js

# Test vision critique (requires GEMINI_API_KEY)
node dist/vision-critique-test.js

# Test full integration
node dist/integration-test.js
```
