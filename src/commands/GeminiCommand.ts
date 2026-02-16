import { Command } from '../core/Command.js';
import { GeminiService } from '../services/GeminiService.js';
import { FileUtils } from '../utils/FileUtils.js';
import fs from 'fs/promises';

export class GeminiCommand implements Command {
    name = 'gemini';
    private geminiService: GeminiService;

    constructor() {
        this.geminiService = new GeminiService();
    }

    async execute(options: any): Promise<void> {
        const prompt = options.prompt || options.args?.[0];
        const filePath = options.options?.file;

        if (!prompt || typeof prompt !== 'string') {
            console.error('Error: Prompt argument is required.');
            return;
        }

        let finalPrompt = prompt;

        // If file is provided, read it and append to prompt
        if (filePath) {
            try {
                const fileContent = await fs.readFile(filePath, 'utf-8');
                finalPrompt = `${prompt}\n\nFile content:\n${fileContent}`;
                console.log(`Read file: ${filePath}`);
            } catch (error) {
                console.error(`Failed to read file: ${filePath}`, error);
                return;
            }
        }

        console.log(`Executing gemini for: "${prompt}"...`);

        try {
            const result = await this.geminiService.generateContent(finalPrompt);
            const savedPath = await FileUtils.saveAIFeedback(result, prompt);
            console.log(`Saved to: ${savedPath}`);
        } catch (error) {
            console.error('Failed to execute gemini:', error);
        }
    }
}
