import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { APIResilience } from '@cli-ai-toolkit/utils';

interface ComfyUIPromptWorkflow {
    prompt: Record<string, any>;
    client_id?: string;
}

interface ComfyUIHistoryItem {
    outputs: Record<string, {
        images?: Array<{
            filename: string;
            subfolder: string;
            type: string;
        }>;
    }>;
    status: {
        completed: boolean;
        messages?: Array<[string, any]>;
    };
}

export class ComfyUIService {
    private baseUrl: string;
    private maxPollAttempts: number;
    private pollIntervalMs: number;

    constructor(baseUrl: string = 'http://127.0.0.1:8188') {
        this.baseUrl = baseUrl;
        this.maxPollAttempts = 120; // 120 attempts (4 minutes total)
        this.pollIntervalMs = 2000; // Poll every 2 seconds
    }

    /**
     * Generate an image using ComfyUI
     * @param prompt - The text prompt for image generation
     * @param negativePrompt - Optional negative prompt
     * @param width - Image width (default: 1024)
     * @param height - Image height (default: 1024)
     * @param steps - Number of sampling steps (default: 20)
     * @param cfgScale - CFG scale (default: 8)
     * @param seed - Random seed (-1 for random, default: -1)
     * @param checkpointName - Model checkpoint to use (default: auto-detect first .safetensors)
     * @returns Buffer containing the generated image
     */
    async generateImage(
        prompt: string,
        options: {
            negativePrompt?: string;
            width?: number;
            height?: number;
            steps?: number;
            cfgScale?: number;
            seed?: number;
            checkpointName?: string;
        } = {}
    ): Promise<Buffer> {
        // Set defaults
        const negativePrompt = options.negativePrompt ?? '';
        const width = options.width ?? 1024;
        const height = options.height ?? 1024;
        const steps = options.steps ?? 20;
        const cfgScale = options.cfgScale ?? 8;
        const seed = options.seed ?? Math.floor(Math.random() * 1000000);
        
        // Get checkpoint name (auto-detect if not provided)
        let checkpointName = options.checkpointName;
        if (!checkpointName) {
            checkpointName = await this.getFirstCheckpoint();
        }

        // Build workflow
        const workflow = this.buildSDXLWorkflow(
            prompt,
            negativePrompt,
            width,
            height,
            steps,
            cfgScale,
            seed,
            checkpointName
        );

        // Submit prompt
        console.log(`   📤 Submitting to ComfyUI...`);
        const promptId = await this.submitPrompt(workflow);
        console.log(`   ⏳ Processing (prompt ID: ${promptId.substring(0, 8)}...)`);

        // Poll for completion
        await this.pollForCompletion(promptId);

        // Get output image
        console.log(`   📥 Downloading image...`);
        const imageBuffer = await this.downloadImage(promptId);

        return imageBuffer;
    }

    /**
     * Build a basic SDXL workflow
     */
    private buildSDXLWorkflow(
        prompt: string,
        negativePrompt: string,
        width: number,
        height: number,
        steps: number,
        cfgScale: number,
        seed: number,
        checkpointName: string
    ): Record<string, any> {
        return {
            "3": {
                "inputs": {
                    "seed": seed,
                    "steps": steps,
                    "cfg": cfgScale,
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "denoise": 1,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0]
                },
                "class_type": "KSampler"
            },
            "4": {
                "inputs": {
                    "ckpt_name": checkpointName
                },
                "class_type": "CheckpointLoaderSimple"
            },
            "5": {
                "inputs": {
                    "width": width,
                    "height": height,
                    "batch_size": 1
                },
                "class_type": "EmptyLatentImage"
            },
            "6": {
                "inputs": {
                    "text": prompt,
                    "clip": ["4", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "7": {
                "inputs": {
                    "text": negativePrompt,
                    "clip": ["4", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "8": {
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["4", 2]
                },
                "class_type": "VAEDecode"
            },
            "9": {
                "inputs": {
                    "filename_prefix": "ComfyUI",
                    "images": ["8", 0]
                },
                "class_type": "SaveImage"
            }
        };
    }

    /**
     * Get the first available checkpoint from ComfyUI
     */
    private async getFirstCheckpoint(): Promise<string> {
        try {
            const response = await axios.get(`${this.baseUrl}/object_info/CheckpointLoaderSimple`);
            const checkpoints = response.data?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0];
            
            if (!checkpoints || checkpoints.length === 0) {
                throw new Error('No checkpoints found. Please place a model in C:\\AI\\ComfyUI\\models\\checkpoints\\');
            }

            // Prefer SDXL models
            const sdxlCheckpoint = checkpoints.find((name: string) => 
                name.toLowerCase().includes('xl') || name.toLowerCase().includes('sdxl')
            );

            return sdxlCheckpoint || checkpoints[0];
        } catch (error: any) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('ComfyUI is not running. Please start it with: .\\scripts\\start_comfyui.ps1');
            }
            throw new Error(`Failed to get checkpoints: ${error.message}`);
        }
    }

    /**
     * Submit a prompt to ComfyUI
     */
    private async submitPrompt(workflow: Record<string, any>): Promise<string> {
        return APIResilience.executeWithRetry(
            async () => {
                const response = await axios.post(
                    `${this.baseUrl}/prompt`,
                    {
                        prompt: workflow,
                        client_id: `cli-toolkit-${Date.now()}`
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    }
                );

                const promptId = response.data?.prompt_id;
                if (!promptId) {
                    throw new Error('No prompt_id returned from ComfyUI');
                }

                return promptId;
            },
            { maxRetries: 2, timeoutMs: 15000 },
            'ComfyUI Prompt Submission'
        );
    }

    /**
     * Poll ComfyUI for completion
     */
    private async pollForCompletion(promptId: string): Promise<void> {
        const startTime = Date.now();
        let lastLogTime = startTime;
        
        for (let i = 0; i < this.maxPollAttempts; i++) {
            try {
                const response = await axios.get(`${this.baseUrl}/history/${promptId}`);
                const history = response.data?.[promptId];

                if (history) {
                    // Check for errors first
                    if (history.status?.status_str === 'error') {
                        const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
                        console.log(`   ❌ ComfyUI error (${elapsedSeconds}s)`);
                        
                        // Extract error message from messages array
                        let errorMsg = 'Unknown ComfyUI error';
                        if (history.status.messages) {
                            const errorMessage = history.status.messages.find(
                                (msg: any[]) => msg[0] === 'execution_error'
                            );
                            if (errorMessage && errorMessage[1]?.exception_message) {
                                errorMsg = errorMessage[1].exception_message.trim();
                            }
                        }
                        
                        // Check for common GPU memory errors
                        if (errorMsg.includes('not enough GPU video memory') || 
                            errorMsg.includes('out of memory') || 
                            errorMsg.includes('OOM')) {
                            throw new Error(
                                `ComfyUI ran out of GPU memory: ${errorMsg}\n` +
                                `  Try these fixes:\n` +
                                `  1. Reduce resolution: --size 768x768 or --size 512x512\n` +
                                `  2. Restart ComfyUI with low VRAM mode: --lowvram flag\n` +
                                `  3. Reduce steps: --steps 15\n` +
                                `  4. Close other GPU applications`
                            );
                        }
                        
                        throw new Error(`ComfyUI generation failed: ${errorMsg}`);
                    }
                    
                    // Check for completion
                    if (history.status?.completed) {
                        const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
                        console.log(`   ✓ Generation complete (${elapsedSeconds}s)`);
                        return; // Generation complete
                    }
                }

                // Log progress every 10 seconds
                const now = Date.now();
                if (now - lastLogTime >= 10000) {
                    const elapsedSeconds = ((now - startTime) / 1000).toFixed(0);
                    console.log(`   ⏳ Still processing... (${elapsedSeconds}s elapsed)`);
                    lastLogTime = now;
                }

                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, this.pollIntervalMs));
            } catch (error: any) {
                // If it's our own thrown error, propagate it
                if (error.message.includes('ComfyUI')) {
                    throw error;
                }
                
                if (i === this.maxPollAttempts - 1) {
                    throw new Error(`Failed to poll ComfyUI: ${error.message}`);
                }
                // Continue polling on temporary errors
                await new Promise(resolve => setTimeout(resolve, this.pollIntervalMs));
            }
        }

        const totalSeconds = ((Date.now() - startTime) / 1000).toFixed(0);
        throw new Error(
            `Image generation timed out after ${totalSeconds}s. This may happen on first run (model loading).\n` +
            `  Check ComfyUI window for errors or try:\n` +
            `  1. Reduce resolution: --size 768x768\n` +
            `  2. Reduce steps: --steps 15\n` +
            `  3. Restart ComfyUI if it crashed`
        );
    }

    /**
     * Download the generated image from ComfyUI
     */
    private async downloadImage(promptId: string): Promise<Buffer> {
        return APIResilience.executeWithRetry(
            async () => {
                // Get history to find output filename
                const historyResponse = await axios.get(`${this.baseUrl}/history/${promptId}`);
                const history: ComfyUIHistoryItem = historyResponse.data?.[promptId];

                if (!history) {
                    throw new Error('No history found for prompt');
                }

                // Find the output image
                let imageFilename: string | undefined;
                let imageSubfolder: string = '';

                for (const nodeId in history.outputs) {
                    const output = history.outputs[nodeId];
                    if (output && output.images && output.images.length > 0) {
                        const firstImage = output.images[0];
                        if (firstImage) {
                            imageFilename = firstImage.filename;
                            imageSubfolder = firstImage.subfolder || '';
                            break;
                        }
                    }
                }

                if (!imageFilename) {
                    throw new Error('No output image found in generation history');
                }

                // Download the image
                const imageUrl = `${this.baseUrl}/view?filename=${encodeURIComponent(imageFilename)}&subfolder=${encodeURIComponent(imageSubfolder)}&type=output`;
                
                const imageResponse = await axios.get(imageUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                });

                return Buffer.from(imageResponse.data);
            },
            { maxRetries: 3, timeoutMs: 45000 },
            'ComfyUI Image Download'
        );
    }

    /**
     * Check if ComfyUI is running
     */
    async isRunning(): Promise<boolean> {
        try {
            await axios.get(`${this.baseUrl}/system_stats`, { timeout: 3000 });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get ComfyUI server info
     */
    async getServerInfo(): Promise<any> {
        try {
            const response = await axios.get(`${this.baseUrl}/system_stats`);
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get server info: ${error.message}`);
        }
    }
}
