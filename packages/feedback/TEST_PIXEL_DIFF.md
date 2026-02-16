# Pixel Diff Testing Guide

## Quick Test

To test the pixel diff functionality, you need two PNG images to compare.

### Option 1: Using the Test Script

```bash
# Navigate to the feedback package
cd packages/feedback

# Run the test script
node dist/test-pixel-diff.js <target-image> <candidate-image> [threshold] [slug]
```

**Examples:**

```bash
# Basic comparison with default threshold (92)
node dist/test-pixel-diff.js target.png candidate.png

# With custom threshold
node dist/test-pixel-diff.js target.png candidate.png 95

# With custom threshold and slug for naming
node dist/test-pixel-diff.js target.png candidate.png 92 my-test
```

### Option 2: Programmatic Usage

```typescript
import { PixelDiffService } from '@cli-ai-toolkit/feedback';

const service = new PixelDiffService({
    passThreshold: 92,
    diffOutputDir: 'images/diffs'
});

const result = await service.compareImages(
    'path/to/target.png',
    'path/to/candidate.png',
    'test-slug'
);

console.log(`Score: ${result.score}/100`);
console.log(`Mismatch: ${result.mismatchPercent}%`);
console.log(`Pass: ${result.pass}`);
console.log(`Diff Image: ${result.diffImagePath}`);
console.log(`\nNotes:\n${result.notes}`);
```

### Option 3: Using runFeedback (Integrated API)

```typescript
import { runFeedback } from '@cli-ai-toolkit/feedback';

const result = await runFeedback(
    'Compare screenshot accuracy',
    {
        targetImagePath: 'screenshots/target.png',
        candidateImagePath: 'screenshots/candidate.png',
        usePixelDiff: true,
        passThreshold: 92,
        slug: 'homepage-test'
    }
);

console.log(`Pass: ${result.pass}`);
console.log(`Score: ${result.score}/100`);
console.log(`Feedback saved to: ${result.path}`);
console.log(`Diff image: ${result.diffImagePath}`);
```

## Creating Test Images

If you don't have test images, you can:

### Method 1: Create Simple Test Images

```bash
# Install a simple image library (if needed)
npm install -g canvas

# Create two similar test images programmatically
```

### Method 2: Use Screenshots

```bash
# If you have the screenshot package in this monorepo:
node packages/screenshot/dist/index.js <url>

# This will create a screenshot you can use for testing
```

### Method 3: Use Existing Images

Copy any two PNG images to test with. For best results:
- Images should have the same dimensions
- Use screenshots from the same source with slight differences
- Or duplicate an image and make small modifications

## Expected Output

The test script will:

1. **Run Pixel Diff Analysis**
   - Calculate similarity score (0-100)
   - Compute mismatch percentage
   - Determine pass/fail status

2. **Generate Diff Image**
   - Saved to: `images/diffs/TIMESTAMP__diff__SLUG.png`
   - Shows pixel differences highlighted in red/yellow

3. **Create Feedback Reports**
   - JSON: `references/aI_feedback/TIMESTAMP__feedback__SLUG.json`
   - Markdown: `references/aI_feedback/TIMESTAMP__feedback__SLUG.md`

4. **Display Context-Aware Notes**
   - Interpretation of mismatch level
   - Likely causes of differences
   - Recommendations

## Score Interpretation

- **100-99%**: Perfect or near-perfect match (< 1% difference)
- **99-95%**: Excellent match (1-5% difference) - likely anti-aliasing
- **95-85%**: Good match (5-15% difference) - minor layout/font differences
- **85-60%**: Moderate differences (15-40% difference) - structural changes
- **< 60%**: Significant differences (> 40% difference) - very different images

## Example Output

```
🔍 Pixel Diff Comparison Test

Target Image:     screenshots/homepage-expected.png
Candidate Image:  screenshots/homepage-actual.png
Pass Threshold:   92
Slug:             homepage-test

============================================================

📊 Running pixel diff service...

✅ Pixel Diff Results:
   Pass:             ✅ YES
   Score:            98.45/100
   Mismatch:         1.55%
   Mismatch Pixels:  3,145
   Total Pixels:     202,500
   Diff Image:       images/diffs/2026-02-16T14-30-45__diff__homepage-test.png

📝 Notes:
   ✅ Excellent match (1.55% difference). 
   Minor differences detected, likely due to:
     • Slight anti-aliasing variations
     • Sub-pixel rendering differences
     • Negligible color variations

   **Objective Score:** 98.45/100
   **Pass Threshold:** 92
   **Status:** PASS ✅

============================================================

📦 Running integrated feedback...

✅ Feedback Results:
   Pass:             ✅ YES
   Score:            98.45/100
   Method:           pixel-diff
   Mismatch:         1.55%
   Diff Image:       images/diffs/2026-02-16T14-30-45__diff__homepage-test.png
   Feedback Path:    references/aI_feedback/2026-02-16T14-30-45__feedback__homepage-test.json

✨ Test completed successfully!
```

## Troubleshooting

### "Image dimensions do not match"
- Ensure both images have the same width and height
- Use the same source/resolution for screenshots

### "Cannot find module"
- Make sure you've run `npm install` in the feedback package
- Build the package: `npm run build`

### "Module not found: @cli-ai-toolkit/utils"
- Build the utils package first: `cd ../utils && npm run build`
- Or build all packages from root: `npm run build`

### No diff image created
- Check that `images/diffs/` directory permissions
- Verify PNG images are valid
- Check console for error messages
