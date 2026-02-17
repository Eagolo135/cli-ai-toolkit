import { Command } from '../core/Command.js';
import { recreateWebsite } from '@cli-ai-toolkit/agent';
import { InputValidator } from '../utils/InputValidator.js';

export class RecreateCommand implements Command {
    name = 'recreate';

    async execute(options: any): Promise<void> {
        try {
            const url = options.url || options.args?.[0];

            // Validate URL
            const urlValidation = InputValidator.validateUrl(url);
            if (!urlValidation.valid) {
                console.error(`❌ URL validation failed: ${urlValidation.error}`);
                console.log('\nUsage: npm run dev -- recreate "https://example.com"');
                process.exit(1);
            }

            const sanitizedUrl = urlValidation.sanitized!;

            console.log(`\n🎨 Starting website recreation...`);
            console.log(`   Target: ${sanitizedUrl}\n`);

            // Call the recreation service
            const result = await recreateWebsite(sanitizedUrl);

            // Print results
            console.log(`\n${'='.repeat(60)}`);
            console.log(`   📊 RECREATION COMPLETE`);
            console.log(`${'='.repeat(60)}\n`);

            // Final recreated path (last iteration HTML)
            const lastIteration = result.iterations[result.iterations.length - 1];
            const finalHTML = `${result.artifacts.runDirectory}/iteration_${lastIteration.iteration}.html`;
            
            console.log(`📄 Final Recreated HTML: ${finalHTML}`);
            console.log(`📋 Report: ${result.artifacts.summaryFile}\n`);

            // Additional useful info
            console.log(`   Status: ${result.success ? '✅ Success' : '⚠️  Partial (max iterations reached)'}`);
            console.log(`   Iterations: ${result.totalIterations}`);
            console.log(`   Pixel Diff Score: ${result.finalScores.pixelDiff}%`);
            console.log(`   Vision Score: ${result.finalScores.vision}%`);
            console.log(`   Execution Time: ${(result.executionTimeMs / 1000).toFixed(1)}s`);
            console.log(`\n   📁 All artifacts: ${result.artifacts.runDirectory}\n`);

        } catch (error: any) {
            console.error(`\n❌ Recreation failed: ${error.message}`);
            if (process.env.DEBUG) {
                console.error(error);
            }
            process.exit(1);
        }
    }
}
