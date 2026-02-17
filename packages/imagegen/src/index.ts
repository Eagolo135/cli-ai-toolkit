// Image generation library exports
export { ImageService } from './ImageService.js';
export { ComfyUIService } from './ComfyUIService.js';

// Public API for programmatic use
import { ImageService } from './ImageService.js';
import { ComfyUIService } from './ComfyUIService.js';
import { FileUtils } from '@cli-ai-toolkit/utils';

export interface GenerateImageOptions {
    size?: string;
    outputDir?: string;
    provider?: 'comfyui' | 'dalle';
    // ComfyUI-specific options
    negativePrompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    cfgScale?: number;
    seed?: number;
    comfyuiUrl?: string;
}

/**
 * Generate an image using DALL-E 3 or ComfyUI and save it to disk
 * @param prompt - The image prompt
 * @param opts - Options including provider, size, and generation parameters
 * @returns Object with path to the saved image file
 */
export async function generateImage(
    prompt: string,
    opts?: GenerateImageOptions
): Promise<{ path: string; provider: string }> {
    const provider = opts?.provider ?? 'comfyui'; // ComfyUI is now default
    const outputDir = opts?.outputDir ?? 'images';

    let buffer: Buffer;
    let usedProvider: string;

    if (provider === 'comfyui') {
        // Use ComfyUI for image generation
        const comfyuiUrl = opts?.comfyuiUrl ?? 'http://127.0.0.1:8188';
        const service = new ComfyUIService(comfyuiUrl);

        // Check if ComfyUI is running
        const isRunning = await service.isRunning();
        if (!isRunning) {
            throw new Error(
                'ComfyUI is not running. Please start it with:\n' +
                '  C:\\AI\\ComfyUI\\scripts\\start_comfyui.ps1\n' +
                'Or use --provider dalle to use DALL-E instead.'
            );
        }

        // Parse dimensions from size or use explicit width/height
        const size = opts?.size ?? '1024x1024';
        const [w, h] = size.split('x').map(Number);
        const finalWidth = opts?.width ?? w;
        const finalHeight = opts?.height ?? h;

        // Ensure width and height are valid numbers
        if (!finalWidth || !finalHeight || isNaN(finalWidth) || isNaN(finalHeight)) {
            throw new Error('Invalid image dimensions');
        }

        const comfyOptions: {
            negativePrompt?: string;
            width: number;
            height: number;
            steps?: number;
            cfgScale?: number;
            seed?: number;
        } = {
            width: finalWidth,
            height: finalHeight
        };

        if (opts?.negativePrompt !== undefined) {
            comfyOptions.negativePrompt = opts.negativePrompt;
        }
        if (opts?.steps !== undefined) {
            comfyOptions.steps = opts.steps;
        }
        if (opts?.cfgScale !== undefined) {
            comfyOptions.cfgScale = opts.cfgScale;
        }
        if (opts?.seed !== undefined) {
            comfyOptions.seed = opts.seed;
        }

        buffer = await service.generateImage(prompt, comfyOptions);

        usedProvider = 'ComfyUI';
    } else {
        // Use DALL-E 3 for image generation
        const service = new ImageService();
        const size = opts?.size ?? '1024x1024';
        
        buffer = await service.generateImage(prompt, size);
        usedProvider = 'DALL-E 3';
    }

    // Save image
    const path = await FileUtils.saveImage(buffer, prompt, outputDir);

    return { path, provider: usedProvider };
}
