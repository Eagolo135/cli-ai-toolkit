import fs from 'fs/promises';
import path from 'path';

export class FileUtils {
    static async saveReference(content: string, slugPrompt: string): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const slug = slugPrompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 50);
        const filename = `${timestamp}__web_search__${slug}.txt`;
        const directory = path.join(process.cwd(), 'references');

        await fs.mkdir(directory, { recursive: true });

        const fullPath = path.join(directory, filename);
        await fs.writeFile(fullPath, content);

        return fullPath;
    }

    static async saveAIFeedback(content: string, slugPrompt: string): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const slug = slugPrompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 50);
        const filename = `${timestamp}__gemini__${slug}.txt`;
        const directory = path.join(process.cwd(), 'references', 'aI_feedback');

        await fs.mkdir(directory, { recursive: true });

        const fullPath = path.join(directory, filename);
        await fs.writeFile(fullPath, content);

        return fullPath;
    }

    static async saveImage(imageBuffer: Buffer, slugPrompt: string): Promise<string> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const slug = slugPrompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 50);
        const filename = `${timestamp}__image__${slug}.png`;
        const directory = path.join(process.cwd(), 'images');

        await fs.mkdir(directory, { recursive: true });

        const fullPath = path.join(directory, filename);
        await fs.writeFile(fullPath, imageBuffer);

        return fullPath;
    }
}
