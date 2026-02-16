import { Command } from '../core/Command.js';
import { ImageService } from '../services/ImageService.js';
import { FileUtils } from '../utils/FileUtils.js';

export class ImageGenerateCommand implements Command {
    name = 'image-generate';
    private imageService: ImageService;

    constructor() {
        this.imageService = new ImageService();
    }

    async execute(options: any): Promise<void> {
        const prompt = options.prompt || options.args?.[0];
        const size = options.options?.size || '1024x1024';

        if (!prompt || typeof prompt !== 'string') {
            console.error('Error: Prompt argument is required.');
            return;
        }

        console.log(`Generating image for: "${prompt}" (size: ${size})...`);

        try {
            const imageBuffer = await this.imageService.generateImage(prompt, size);
            const savedPath = await FileUtils.saveImage(imageBuffer, prompt);
            console.log(`Saved to: ${savedPath}`);
        } catch (error) {
            console.error('Failed to generate image:', error);
        }
    }
}
