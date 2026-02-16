import { Command } from '@cli-ai-toolkit/core';
import { generateImage } from '@cli-ai-toolkit/imagegen';
import { InputValidator, APIResilience, APIError } from '@cli-ai-toolkit/utils';

export class ImageGenerateCommand implements Command {
    name = 'image-generate';

    async execute(options: any): Promise<void> {
        try {
            const prompt = options.prompt || options.args?.[0];
            const size = options.options?.size || '1024x1024';

            // Validate prompt
            const promptValidation = InputValidator.validatePrompt(prompt);
            if (!promptValidation.valid) {
                console.error(`❌ Prompt validation failed: ${promptValidation.error}`);
                console.log('\nUsage: cli-ai-toolkit image-generate "your prompt here" [-s size]');
                process.exit(1);
            }

            // Validate size
            const sizeValidation = InputValidator.validateImageSize(size);
            if (!sizeValidation.valid) {
                console.error(`❌ ${sizeValidation.error}`);
                process.exit(1);
            }

            console.log(`\n🎨 Generating image with DALL-E 3...\n   Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"\n   Size: ${size}\n`);
            console.log('⏳ This may take 30-60 seconds...\n');

            // Generate and save image using library API
            const { path } = await generateImage(promptValidation.sanitized!, { size });
            
            console.log(`\n✅ Success! Image saved to:\n   ${path}\n`);
        } catch (error: any) {
            if (error instanceof APIError) {
                console.error(`\n${APIResilience.formatErrorForUser(error)}`);
                if (error.category === 'QUOTA_EXCEEDED') {
                    console.log('\n💡 Note: DALL-E 3 requires a paid OpenAI plan.');
                }
            } else if (error.message?.includes('File save failed')) {
                console.error(`\n❌ ${error.message}`);
                console.log('\n💡 Troubleshooting:');
                console.log('   • Check disk space (images can be large)');
                console.log('   • Verify write permissions for the images directory');
            } else {
                console.error(`\n❌ Failed to generate image: ${error.message}`);
            }
            process.exit(1);
        }
    }
}
