import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export class OpenAIService {
    private openai: OpenAI;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is missing in .env');
        }
        this.openai = new OpenAI({ apiKey });
    }

    async getCompletion(prompt: string): Promise<string> {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
            });

            return response.choices[0]?.message?.content || 'No response generated.';
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw error;
        }
    }
}
