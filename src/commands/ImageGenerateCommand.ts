import { Command } from '../core/Command.js';
import { ImageService } from '../services/ImageService.js';
import { FileUtils } from '../utils/FileUtils.js';
import { InputValidator } from '../utils/InputValidator.js';
import { APIResilience, APIError } from '../utils/APIResilience.js';

export class ImageGenerateCommand implements Command {
    name = 'image-generate';
    private imageService: ImageService;

    constructor() {
        this.imageService = new ImageService();
    }

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

            // Generate image
            const imageBuffer = await this.imageService.generateImage(promptValidation.sanitized!, size);

            // Save image
            const savedPath = await FileUtils.saveImage(imageBuffer, prompt);
            
            console.log(`\n✅ Success! Image saved to:\n   ${savedPath}\n`);
            console.log(`📊 Image size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
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
