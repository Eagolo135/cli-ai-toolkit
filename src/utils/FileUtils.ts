import fs from 'fs/promises';
import path from 'path';

export class FileUtils {
    /**
     * Save web search reference with robust error handling
     */
    static async saveReference(content: string, slugPrompt: string): Promise<string> {
        return this.saveFile(content, slugPrompt, 'references', 'web_search', '.txt');
    }

    /**
     * Save AI feedback with robust error handling
     */
    static async saveAIFeedback(content: string, slugPrompt: string): Promise<string> {
        return this.saveFile(content, slugPrompt, path.join('references', 'aI_feedback'), 'gemini', '.txt');
    }

    /**
     * Save image with robust error handling
     */
    static async saveImage(imageBuffer: Buffer, slugPrompt: string): Promise<string> {
        return this.saveFile(imageBuffer, slugPrompt, 'images', 'image', '.png');
    }

    /**
     * Generic file save with comprehensive error handling
     */
    private static async saveFile(
        content: string | Buffer,
        slugPrompt: string,
        directory: string,
        type: string,
        extension: string
    ): Promise<string> {
        try {
            // Validate content
            if (!content || (typeof content === 'string' && content.trim() === '')) {
                throw new Error('Cannot save empty content');
            }

            // Generate safe filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const slug = this.sanitizeSlug(slugPrompt);
            const filename = `${timestamp}__${type}__${slug}${extension}`;
            
            // Resolve full path
            const fullDirectory = path.join(process.cwd(), directory);
            const fullPath = path.join(fullDirectory, filename);

            // Create directory with error handling
            try {
                await fs.mkdir(fullDirectory, { recursive: true });
            } catch (mkdirError: any) {
                if (mkdirError.code === 'EACCES') {
                    throw new Error(`Permission denied: Cannot create directory ${fullDirectory}`);
                }
                throw new Error(`Failed to create directory: ${mkdirError.message}`);
            }

            // Check write permissions
            try {
                await fs.access(fullDirectory, fs.constants.W_OK);
            } catch {
                throw new Error(`No write permission for directory: ${fullDirectory}`);
            }

            // Check available disk space (on Windows)
            if (process.platform === 'win32') {
                try {
                    const stats = await fs.statfs(fullDirectory);
                    const availableSpace = stats.bavail * stats.bsize;
                    const contentSize = Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content);
                    
                    // Require at least 10MB free space or 2x content size, whichever is larger
                    const requiredSpace = Math.max(10 * 1024 * 1024, contentSize * 2);
                    
                    if (availableSpace < requiredSpace) {
                        throw new Error(`Insufficient disk space. Available: ${(availableSpace / (1024 * 1024)).toFixed(2)} MB`);
                    }
                } catch (spaceError: any) {
                    // If we can't check space, log warning but continue
                    if (spaceError.message.includes('Insufficient disk space')) {
                        throw spaceError;
                    }
                    console.warn('Warning: Could not verify disk space');
                }
            }

            // Write file with explicit error handling
            try {
                await fs.writeFile(fullPath, content, { mode: 0o644 });
            } catch (writeError: any) {
                if (writeError.code === 'ENOSPC') {
                    throw new Error('Disk full: No space available to save file');
                }
                if (writeError.code === 'EACCES') {
                    throw new Error(`Permission denied: Cannot write to ${fullPath}`);
                }
                if (writeError.code === 'EROFS') {
                    throw new Error('Read-only file system: Cannot write file');
                }
                throw new Error(`Failed to write file: ${writeError.message}`);
            }

            // Verify file was written successfully
            try {
                const stats = await fs.stat(fullPath);
                if (stats.size === 0 && content.length > 0) {
                    throw new Error('File written but appears empty');
                }
            } catch (statError: any) {
                throw new Error(`File saved but verification failed: ${statError.message}`);
            }

            return fullPath;
        } catch (error: any) {
            // Wrap all errors with context
            throw new Error(`File save failed: ${error.message}`);
        }
    }

    /**
     * Sanitize slug for safe filename
     */
    private static sanitizeSlug(input: string): string {
        if (!input || input.trim() === '') {
            return 'untitled';
        }
        
        return input
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with dash
            .replace(/^-+|-+$/g, '')      // Remove leading/trailing dashes
            .substring(0, 50)              // Limit length
            || 'untitled';                 // Fallback if everything was stripped
    }

    /**
     * Read file safely with size validation
     */
    static async readFileSafely(filePath: string, maxSize: number = 10 * 1024 * 1024): Promise<string> {
        try {
            // Check if file exists
            await fs.access(filePath, fs.constants.R_OK);

            // Check file size
            const stats = await fs.stat(filePath);
            if (stats.size > maxSize) {
                throw new Error(
                    `File too large: ${(stats.size / (1024 * 1024)).toFixed(2)} MB ` +
                    `(max: ${(maxSize / (1024 * 1024)).toFixed(0)} MB)`
                );
            }

            // Read file
            return await fs.readFile(filePath, 'utf-8');
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${filePath}`);
            }
            if (error.code === 'EACCES') {
                throw new Error(`Permission denied: ${filePath}`);
            }
            throw error;
        }
    }
}
