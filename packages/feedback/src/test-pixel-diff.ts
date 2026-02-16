#!/usr/bin/env node
/**
 * Test script for pixel diff comparison
 * Usage: node dist/test-pixel-diff.js <target-image> <candidate-image> [threshold]
 */

import { PixelDiffService } from './PixelDiffService.js';
import { runFeedback } from './index.js';

async function testPixelDiff() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.error('Usage: node dist/test-pixel-diff.js <target-image> <candidate-image> [threshold] [slug]');
        console.error('');
        console.error('Examples:');
        console.error('  node dist/test-pixel-diff.js target.png candidate.png');
        console.error('  node dist/test-pixel-diff.js target.png candidate.png 95');
        console.error('  node dist/test-pixel-diff.js target.png candidate.png 92 my-test');
        process.exit(1);
    }

    if (!args[0] || !args[1]) {
        console.error('Error: Both target and candidate image paths are required');
        process.exit(1);
    }

    const targetImage: string = args[0];
    const candidateImage: string = args[1];
    const threshold = args[2] ? parseInt(args[2], 10) : 92;
    const slug: string | undefined = args[3] ? args[3] : undefined;

    console.log('🔍 Pixel Diff Comparison Test\n');
    console.log(`Target Image:     ${targetImage}`);
    console.log(`Candidate Image:  ${candidateImage}`);
    console.log(`Pass Threshold:   ${threshold}`);
    console.log(`Slug:             ${slug || '(none)'}`);
    console.log('\n' + '='.repeat(60) + '\n');

    try {
        // Test direct PixelDiffService
        console.log('📊 Running pixel diff service...\n');
        const pixelDiffService = new PixelDiffService({
            passThreshold: threshold,
            diffOutputDir: 'images/diffs'
        });

        const result = await pixelDiffService.compareImages(
            targetImage,
            candidateImage,
            slug
        );

        console.log('✅ Pixel Diff Results:');
        console.log(`   Pass:             ${result.pass ? '✅ YES' : '❌ NO'}`);
        console.log(`   Score:            ${result.score.toFixed(2)}/100`);
        console.log(`   Mismatch:         ${result.mismatchPercent.toFixed(2)}%`);
        console.log(`   Mismatch Pixels:  ${result.mismatchPixels.toLocaleString()}`);
        console.log(`   Total Pixels:     ${result.totalPixels.toLocaleString()}`);
        console.log(`   Diff Image:       ${result.diffImagePath}`);
        console.log('');
        console.log('📝 Notes:');
        console.log(result.notes.split('\n').map(line => '   ' + line).join('\n'));
        console.log('\n' + '='.repeat(60) + '\n');

        // Test runFeedback integration
        console.log('📦 Running integrated feedback...\n');
        const feedbackResult = await runFeedback(
            'Compare these two images for pixel accuracy',
            {
                targetImagePath: targetImage,
                candidateImagePath: candidateImage,
                usePixelDiff: true,
                passThreshold: threshold,
                slug
            }
        );

        console.log('✅ Feedback Results:');
        console.log(`   Pass:             ${feedbackResult.pass ? '✅ YES' : '❌ NO'}`);
        console.log(`   Score:            ${feedbackResult.score.toFixed(2)}/100`);
        console.log(`   Method:           ${feedbackResult.method}`);
        console.log(`   Mismatch:         ${feedbackResult.mismatchPercent?.toFixed(2)}%`);
        console.log(`   Diff Image:       ${feedbackResult.diffImagePath}`);
        console.log(`   Feedback Path:    ${feedbackResult.path}`);
        console.log('');
        console.log('✨ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during pixel diff test:');
        console.error(error);
        process.exit(1);
    }
}

testPixelDiff();
