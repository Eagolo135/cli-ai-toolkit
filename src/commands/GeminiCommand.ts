import { Command } from '../core/Command.js';
import { GeminiService } from '../services/GeminiService.js';
import { FileUtils } from '../utils/FileUtils.js';
import { InputValidator } from '../utils/InputValidator.js';
import { APIResilience, APIError } from '../utils/APIResilience.js';

export class GeminiCommand implements Command {
    name = 'gemini';
    private geminiService: GeminiService;

    constructor() {
        this.geminiService = new GeminiService();
    }

    async execute(options: any): Promise<void> {
        try {
            const prompt = options.prompt || options.args?.[0];
            const filePath = options.options?.file;

            // Validate prompt
            const promptValidation = InputValidator.validatePrompt(prompt);
            if (!promptValidation.valid) {
                console.error(`❌ Prompt validation failed: ${promptValidation.error}`);
                console.log('\nUsage: cli-ai-toolkit gemini "your prompt here"');
                process.exit(1);
            }

            let finalPrompt = promptValidation.sanitized!;

            // If file is provided, validate and read it
            if (filePath) {
                const fileValidation = await InputValidator.validateFilePath(filePath);
                if (!fileValidation.valid) {
                    console.error(`❌ File validation failed: ${fileValidation.error}`);
                    process.exit(1);
                }

                try {
                    const fileContent = await FileUtils.readFileSafely(fileValidation.sanitized!);
                    finalPrompt = `${finalPrompt}\n\nFile content:\n${fileContent}`;
                    console.log(`📄 Included file: ${filePath}`);
                } catch (error: any) {
                    console.error(`❌ Failed to read file: ${error.message}`);
                    process.exit(1);
                }
            }

            console.log(`\n🤖 Generating content with Gemini...\n   Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"\n`);

            // Call Gemini API
            const result = await this.geminiService.generateContent(finalPrompt);

            // Save result
            const savedPath = await FileUtils.saveAIFeedback(result, prompt);
            
            console.log(`\n✅ Success! Response saved to:\n   ${savedPath}\n`);
            console.log('━'.repeat(60));
            console.log('Preview:');
            console.log(result.substring(0, 300) + (result.length > 300 ? '\n...(truncated)' : ''));
            console.log('━'.repeat(60));
        } catch (error: any) {
            if (error instanceof APIError) {
                console.error(`\n${APIResilience.formatErrorForUser(error)}`);
            } else if (error.message?.includes('File save failed')) {
                console.error(`\n❌ ${error.message}`);
                console.log('\n💡 Troubleshooting:');
                console.log('   • Check disk space');
                console.log('   • Verify write permissions for the references/aI_feedback directory');
            } else {
                console.error(`\n❌ Failed to execute gemini command: ${error.message}`);
            }
            process.exit(1);
        }
    }
}
