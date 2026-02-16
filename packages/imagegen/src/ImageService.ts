import axios from 'axios';
import dotenv from 'dotenv';
import { APIResilience } from '@cli-ai-toolkit/utils';

dotenv.config();

export class ImageService {
    private apiKey: string;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is missing in .env');
        }
        this.apiKey = apiKey;
    }

    async generateImage(prompt: string, size: string = '1024x1024'): Promise<Buffer> {
        return APIResilience.executeWithRetry(
            async () => {
                const response = await axios.post(
                    'https://api.openai.com/v1/images/generations',
                    {
                        model: 'dall-e-3',
                        prompt: prompt,
                        n: 1,
                        size: size,
                        response_format: 'b64_json'
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 90000 // DALL-E can take longer
                    }
                );

                const b64Image = response.data?.data?.[0]?.b64_json;
                if (!b64Image) {
                    throw new Error('No image data returned from OpenAI');
                }

                return Buffer.from(b64Image, 'base64');
            },
            { maxRetries: 2, timeoutMs: 120000 }, // 2 minutes for image generation
            'DALL-E Image Generation'
        );
    }
}
