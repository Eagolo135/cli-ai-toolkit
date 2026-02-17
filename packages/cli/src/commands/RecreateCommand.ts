import { Command } from '@cli-ai-toolkit/core';
import { recreateWebsite } from '@cli-ai-toolkit/agent';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class RecreateCommand implements Command {
    name = 'recreate';

    async execute(options: any): Promise<void> {
        try {
            const url = options.url || options.args?.[0];

            // Validate URL
            if (!url) {
                console.error('❌ URL argument is required.');
                console.log('\nUsage: npm run dev -- recreate "https://example.com"');
                process.exit(1);
            }

            console.log(`\n🎨 Starting website recreation...`);
            console.log(`   Target: ${url}`);
            console.log(`   Coding Agent: OpenAI`);
            console.log(`   Judge: Gemini\n`);

            // Parse CLI options
            const maxIterations = parseInt(options.options?.maxIterations || '6', 10);
            const pixelDiffThreshold = parseInt(options.options?.pixelThreshold || '92', 10);
            const visionThreshold = parseInt(options.options?.visionThreshold || '85', 10);

            // Call the recreation service
            const result = await recreateWebsite(url, {
                maxIterations,
                pixelDiffThreshold,
                visionThreshold
            });

            // Handle errors in result
            if (result.stopReason === 'error') {
                console.error(`\n❌ Recreation failed: ${result.errorMessage}`);
                console.log(`📋 Partial report saved: ${result.artifacts.summaryFile}\n`);
                process.exit(1);
            }

            // Print results
            console.log(`\n${'='.repeat(60)}`);
            console.log(`   📊SUCCESS - RECREATION COMPLETE`);
            console.log(`${'='.repeat(60)}\n`);

            // Final recreated website
            console.log(`🌐 Recreated Website: ${result.artifacts.recreatedWebsite}`);
            console.log(`📋 Full Report: ${result.artifacts.summaryFile}\n`);

            // Additional useful info
            console.log(`   Status: ${result.success ? '✅ Success' : '⚠️  Partial (max iterations reached)'}`);
            console.log(`   Iterations: ${result.totalIterations}`);
            console.log(`   Pixel Diff Score: ${result.finalScores.pixelDiff}%`);
            console.log(`   Vision Score: ${result.finalScores.vision}%`);
            console.log(`   Execution Time: ${(result.executionTimeMs / 1000).toFixed(1)}s`);
            console.log(`\n   📁 All artifacts: ${result.artifacts.runDirectory}\n`);

            // Auto-launch recreated website in browser
            if (result.success && result.artifacts.recreatedWebsite) {
                console.log(`🚀 Launching recreated website in browser...\n`);
                try {
                    await execAsync(`start "" "${result.artifacts.recreatedWebsite}"`);
                } catch (error: any) {
                    console.log(`⚠️  Could not auto-launch browser: ${error.message}`);
                    console.log(`   Please open manually: ${result.artifacts.recreatedWebsite}\n`);
                }
            }

        } catch (error: any) {
            console.error(`\n❌ Recreation failed: ${error.message}`);
            if (process.env.DEBUG) {
                console.error(error);
            }
            process.exit(1);
        }
    }
}
