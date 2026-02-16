import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export class GeminiService {
    private apiKey: string;
    private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is missing in .env');
        }
        this.apiKey = apiKey;
    }

    async generateContent(prompt: string): Promise<string> {
        try {
            const url = `${this.baseUrl}/gemini-2.0-flash-lite:generateContent?key=${this.apiKey}`;

            const response = await axios.post(url, {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            });

            const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            return content || 'No response generated.';
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }
}
