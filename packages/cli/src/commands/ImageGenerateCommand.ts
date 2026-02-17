import { Command } from '@cli-ai-toolkit/core';
import { generateImage } from '@cli-ai-toolkit/imagegen';
import { InputValidator, APIResilience, APIError } from '@cli-ai-toolkit/utils';

export class ImageGenerateCommand implements Command {
    name = 'image-generate';

    async execute(options: any): Promise<void> {
        try {
            const prompt = options.prompt || options.args?.[0];
            const size = options.options?.size || '1024x1024';
            const provider = options.options?.provider || 'comfyui';

            // Validate prompt
            const promptValidation = InputValidator.validatePrompt(prompt);
            if (!promptValidation.valid) {
                console.error(`❌ Prompt validation failed: ${promptValidation.error}`);
                console.log('\nUsage: cli-ai-toolkit image-generate "your prompt here" [options]');
                console.log('\nOptions:');
                console.log('  --provider <name>    Provider: comfyui (default) or dalle');
                console.log('  --size <size>        Image size (default: 1024x1024)');
                console.log('\nComfyUI-specific options:');
                console.log('  --negative <text>    Negative prompt');
                console.log('  --steps <number>     Sampling steps (default: 20)');
                console.log('  --cfg <number>       CFG scale (default: 8)');
                console.log('  --seed <number>      Random seed (default: random)');
                process.exit(1);
            }

            // Validate provider
            if (!['comfyui', 'dalle'].includes(provider)) {
                console.error(`❌ Invalid provider: ${provider}`);
                console.log('Valid providers: comfyui, dalle');
                process.exit(1);
            }

            // Validate size for DALL-E
            if (provider === 'dalle') {
                const sizeValidation = InputValidator.validateImageSize(size);
                if (!sizeValidation.valid) {
                    console.error(`❌ ${sizeValidation.error}`);
                    process.exit(1);
                }
            }

            // Display generation info
            const providerName = provider === 'comfyui' ? 'ComfyUI + SDXL' : 'DALL-E 3';
            const providerEmoji = provider === 'comfyui' ? '🎨' : '🤖';
            
            console.log(`\n${providerEmoji} Generating image with ${providerName}...`);
            console.log(`   Prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`);
            console.log(`   Size: ${size}`);
            
            if (provider === 'comfyui') {
                const negativePrompt = options.options?.negative;
                const steps = options.options?.steps;
                const cfg = options.options?.cfg;
                const seed = options.options?.seed;
                
                if (negativePrompt) console.log(`   Negative: "${negativePrompt.substring(0, 60)}${negativePrompt.length > 60 ? '...' : ''}"`);
                if (steps) console.log(`   Steps: ${steps}`);
                if (cfg) console.log(`   CFG Scale: ${cfg}`);
                if (seed && seed !== -1) console.log(`   Seed: ${seed}`);
            }
            
            console.log('');
            
            if (provider === 'comfyui') {
                console.log(`⏳ ComfyUI generation in progress...`);
                console.log(`   First-time: 90-150s (model loading)`);
                console.log(`   Subsequent: 30-90s`);
                console.log(`   Check ComfyUI window for progress\n`);
            } else {
                console.log(`⏳ This may take 30-60 seconds...\n`);
            }

            // Prepare generation options
            const generateOptions: any = { 
                size,
                provider 
            };

            if (provider === 'comfyui') {
                // Parse size into width/height
                const [width, height] = size.split('x').map(Number);
                generateOptions.width = width;
                generateOptions.height = height;
                
                // Add ComfyUI-specific options
                if (options.options?.negative) {
                    generateOptions.negativePrompt = options.options.negative;
                }
                if (options.options?.steps) {
                    generateOptions.steps = parseInt(options.options.steps, 10);
                }
                if (options.options?.cfg) {
                    generateOptions.cfgScale = parseFloat(options.options.cfg);
                }
                if (options.options?.seed) {
                    generateOptions.seed = parseInt(options.options.seed, 10);
                }
            }

            // Generate and save image using library API
            const result = await generateImage(promptValidation.sanitized!, generateOptions);
            
            console.log(`\n✅ Success! Image saved to:\n   ${result.path}`);
            console.log(`   Provider: ${result.provider}\n`);
        } catch (error: any) {
            if (error instanceof APIError) {
                console.error(`\n${APIResilience.formatErrorForUser(error)}`);
                if (error.category === 'QUOTA_EXCEEDED') {
                    console.log('\n💡 Note: DALL-E 3 requires a paid OpenAI plan.');
                }
            } else if (error.message?.includes('ComfyUI is not running')) {
                console.error(`\n❌ ${error.message}`);
                console.log('\n💡 To start ComfyUI:');
                console.log('   1. Open PowerShell');
                console.log('   2. Run: C:\\AI\\ComfyUI\\scripts\\start_comfyui.ps1');
                console.log('   3. Wait for "http://127.0.0.1:8188" message');
                console.log('   4. Retry this command');
                console.log('\nOr use DALL-E instead: --provider dalle');
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
