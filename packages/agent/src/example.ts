/**
 * Example: Website Recreation
 * 
 * This example demonstrates how to use the recreateWebsite function
 * to automatically recreate a website using iterative AI feedback.
 */

import { recreateWebsite } from './index.js';

async function main() {
    console.log('🚀 Website Recreation Example\n');

    // Example 1: Simple usage
    console.log('Example 1: Recreate example.com with default settings');
    try {
        const result = await recreateWebsite('https://example.com');

        console.log('\n✅ Recreation complete!');
        console.log(`   Success: ${result.success}`);
        console.log(`   Iterations: ${result.totalIterations}`);
        console.log(`   Final Pixel Diff Score: ${result.finalScores.pixelDiff}%`);
        console.log(`   Final Vision Score: ${result.finalScores.vision}%`);
        console.log(`   Run Directory: ${result.artifacts.runDirectory}`);
        console.log(`   Execution Time: ${(result.executionTimeMs / 1000).toFixed(1)}s`);

        // Print iteration summary
        console.log('\n📊 Iteration Summary:');
        result.iterations.forEach((iter) => {
            console.log(`   ${iter.iteration}. Pixel: ${iter.pixelDiff.score}%, Vision: ${iter.vision.score}%`);
            if (iter.critique) {
                console.log(`      Issues: ${iter.critique.totalIssues}`);
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Uncomment to run:
// main();
