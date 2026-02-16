# Vision Critique - Quick Reference

## What Was Added

Enhanced `@cli-ai-toolkit/feedback` with optional AI-powered UI critique that generates a prioritized punch list of concrete, actionable fixes.

## Key Principle

**Pixel diff = Primary pass/fail signal**  
**Vision critique = Supplementary fix list**

## Usage

### Enable Vision Critique

```typescript
import { runFeedback } from '@cli-ai-toolkit/feedback';

const result = await runFeedback(
    'Compare UI implementation',
    {
        targetImagePath: 'design/target.png',
        candidateImagePath: 'output/candidate.png',
        usePixelDiff: true,           // Primary pass/fail
        passThreshold: 92,
        includeVisionCritique: true,  // ADD THIS for vision critique
        visionContext: 'Header and navigation',
        slug: 'test'
    }
);

// Pass/fail from pixel diff (unchanged)
console.log(`Pass: ${result.pass}, Score: ${result.score}/100`);

// New: Vision critique with actionable fixes
if (result.visionCritique) {
    console.log(`Issues found: ${result.visionCritique.totalIssues}`);
    result.visionCritique.items.forEach(item => {
        console.log(`[${item.priority}] ${item.element}: ${item.issue}`);
        console.log(`  Expected: ${item.expected}`);
        console.log(`  Actual: ${item.actual}`);
    });
}
```

## Output Structure

### Vision Critique Item

```typescript
{
    priority: 'critical' | 'high' | 'medium' | 'low',
    category: 'layout' | 'typography' | 'colors' | 'spacing' | 'sizing' | 'alignment' | 'borders' | 'other',
    element: 'Primary CTA button',          // Specific UI element
    issue: 'Border radius too sharp',       // What's wrong
    expected: 'border-radius: 8px',         // From target (concrete value)
    actual: 'border-radius: 4px'            // From candidate (concrete value)
}
```

## Files Modified

1. **GeminiService.ts** - Added `generateUICritique()` method + types
2. **index.ts** - Integrated vision critique into `runFeedback()`
3. **README.md** - Documented new feature
4. **vision-critique-test.ts** (NEW) - Test/demo script

## Requirements

- `GEMINI_API_KEY` environment variable (only for vision critique)
- Pixel diff works without it

## Error Handling

**Safe degradation**: If vision fails, pixel diff result still returns

```typescript
if (result.visionCritiqueError) {
    console.warn(result.visionCritiqueError);
}
// result.pass and result.score always available
```

## Testing

```bash
cd packages/feedback
npm run build

# Test vision critique (requires GEMINI_API_KEY)
node dist/vision-critique-test.js
```

## When to Use

✅ **Enable vision critique:**
- Failed tests (understand why)
- Manual reviews
- Designer-developer handoff
- QA reporting

❌ **Skip vision critique:**
- Automated CI/CD (too slow)
- High-frequency tests (cost)
- Pixel diff sufficient

## Example Output

```
🔍 Vision-Based UI Critique

Summary: Header spacing and button styling inconsistencies  
Total Issues: 7

🟠 HIGH (2)
1. Header navigation [spacing]
   Issue: Horizontal padding mismatch
   Expected: padding: 0 24px
   Actual: padding: 0 16px

2. Primary CTA button [borders]
   Issue: Border radius too sharp
   Expected: border-radius: 8px
   Actual: border-radius: 4px
```

## Cost & Performance

| Metric | Pixel Diff | Vision Critique |
|--------|------------|-----------------|
| Speed | < 1s | 10-20s |
| Cost | $0 | ~$0.001/call |
| Pass/Fail | ✅ | Same (from pixel diff) |
| Fixes | ❌ | ✅ 5-10 items |

## Quick Start

1. Add to `.env`: `GEMINI_API_KEY=your_key`
2. Add option: `includeVisionCritique: true`
3. Check result: `result.visionCritique.items`
4. Get concrete fixes with specific values!

That's it! 🎯
