import { Command } from '@cli-ai-toolkit/core';
import { webSearch } from '@cli-ai-toolkit/websearch';
import { InputValidator, APIResilience, APIError } from '@cli-ai-toolkit/utils';

export class WebSearchCommand implements Command {
    name = 'web-search';

    async execute(options: any): Promise<void> {
        try {
            const query = options.query || options.args?.[0];

            // Validate query
            const queryValidation = InputValidator.validatePrompt(query);
            if (!queryValidation.valid) {
                console.error(`❌ Query validation failed: ${queryValidation.error}`);
                console.log('\nUsage: cli-ai-toolkit web-search "your search query" [options]');
                console.log('\nOptions:');
                console.log('  --mode <mode>          Search mode: agentic (default), weak, or deep-research');
                console.log('  --reasoning <level>    Reasoning level: low, medium (default), high');
                console.log('  --model <model>        Override model (e.g., gpt-4o, gpt-4o-mini)');
                process.exit(1);
            }

            // Parse search options
            const mode = options.options?.mode || 'agentic';
            const reasoningLevel = options.options?.reasoning || 'medium';
            const model = options.options?.model;

            // Validate mode
            if (!['weak', 'agentic', 'deep-research'].includes(mode)) {
                console.error(`❌ Invalid mode: ${mode}. Must be: weak, agentic, or deep-research`);
                process.exit(1);
            }

            // Validate reasoning level
            if (!['low', 'medium', 'high'].includes(reasoningLevel)) {
                console.error(`❌ Invalid reasoning level: ${reasoningLevel}. Must be: low, medium, or high`);
                process.exit(1);
            }

            // Print search configuration
            const modeEmoji = {
                'weak': '⚡',
                'agentic': '🤖',
                'deep-research': '🔬'
            };

            const modeDesc = {
                'weak': 'Weak/Quick Search',
                'agentic': 'Agentic Search with Reasoning',
                'deep-research': 'Deep Research Mode'
            };

            console.log(`\n${modeEmoji[mode as keyof typeof modeEmoji]} ${modeDesc[mode as keyof typeof modeDesc]}`);
            console.log(`   Query: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`);

            // Perform web search using library API
            const { path, results } = await webSearch(queryValidation.sanitized!, {
                mode: mode as 'weak' | 'agentic' | 'deep-research',
                reasoningLevel: reasoningLevel as 'low' | 'medium' | 'high',
                model: model,
            });
            
            console.log(`\n✅ Success! Results saved to:\n   ${path}\n`);
            
            // Print metadata
            if (results.tokensUsed) {
                console.log(`📊 Metadata:`);
                console.log(`   Model: ${results.model}`);
                console.log(`   Mode: ${results.mode}`);
                console.log(`   Reasoning Depth: ${results.searchDepth}`);
                console.log(`   Tokens Used: ${results.tokensUsed}`);
            }
            
            console.log('\n' + '━'.repeat(60));
            console.log('Preview:');
            console.log(results.content.substring(0, 500) + (results.content.length > 500 ? '\n...(preview truncated)' : ''));
            console.log('━'.repeat(60));
        } catch (error: any) {
            if (error instanceof APIError) {
                console.error(`\n${APIResilience.formatErrorForUser(error)}`);
            } else if (error.message?.includes('File save failed')) {
                console.error(`\n❌ ${error.message}`);
                console.log('\n💡 Troubleshooting:');
                console.log('   • Check disk space');
                console.log('   • Verify write permissions for the references directory');
            } else {
                console.error(`\n❌ Web search failed: ${error.message}`);
            }
            process.exit(1);
        }
    }
}
