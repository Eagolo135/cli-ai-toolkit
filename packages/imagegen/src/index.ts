// Image generation library exports
export { ImageService } from './ImageService.js';

// Public API for programmatic use
import { ImageService } from './ImageService.js';
import { FileUtils } from '@cli-ai-toolkit/utils';

export interface GenerateImageOptions {
    size?: string;
    outputDir?: string;
}

/**
 * Generate an image using DALL-E 3 and save it to disk
 * @param prompt - The image prompt
 * @param opts - Options including size (1024x1024, 1792x1024, 1024x1792) and output directory
 * @returns Object with path to the saved image file
 */
export async function generateImage(
    prompt: string,
    opts?: GenerateImageOptions
): Promise<{ path: string }> {
    const service = new ImageService();
    
    // Defaults
    const size = opts?.size ?? '1024x1024';
    const outputDir = opts?.outputDir ?? 'images';

    // Generate image
    const buffer = await service.generateImage(prompt, size);

    // Save image
    const path = await FileUtils.saveImage(buffer, prompt, outputDir);

    return { path };
}
