import { Command } from '../core/Command.js';
import { OpenAIService } from '../services/OpenAIService.js';
import { FileUtils } from '../utils/FileUtils.js';
import { InputValidator } from '../utils/InputValidator.js';
import { APIResilience, APIError } from '../utils/APIResilience.js';

export class WebSearchCommand implements Command {
    name = 'web-search';
    private openAIService: OpenAIService;

    constructor() {
        this.openAIService = new OpenAIService();
    }

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

            // Perform agentic web search
            const result = await this.openAIService.agenticWebSearch({
                query: queryValidation.sanitized!,
                mode: mode as 'weak' | 'agentic' | 'deep-research',
                reasoningLevel: reasoningLevel as 'low' | 'medium' | 'high',
                model: model,
            });

            // Save result
            const savedPath = await FileUtils.saveReference(result.content, query);
            
            console.log(`\n✅ Success! Results saved to:\n   ${savedPath}\n`);
            
            // Print metadata
            if (result.tokensUsed) {
                console.log(`📊 Metadata:`);
                console.log(`   Model: ${result.model}`);
                console.log(`   Mode: ${result.mode}`);
                console.log(`   Reasoning Depth: ${result.searchDepth}`);
                console.log(`   Tokens Used: ${result.tokensUsed.toLocaleString()}\n`);
            }

            console.log('━'.repeat(60));
            console.log('Preview:');
            console.log(result.content.substring(0, 400) + (result.content.length > 400 ? '\n...(truncated)' : ''));
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
                console.error(`\n❌ Failed to execute web-search: ${error.message}`);
            }
            process.exit(1);
        }
    }
}
