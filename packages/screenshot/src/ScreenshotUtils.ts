import fs from 'fs/promises';
import path from 'path';

export interface ScreenshotMetadata {
    url: string;
    finalUrl: string;
    timestamp: string;
    viewport: {
        width: number;
        height: number;
    };
    fullPage: boolean;
    selector: string | null;
    waitMs: number;
    userAgent: string;
}

export interface ViewportDimensions {
    width: number;
    height: number;
}

export class ScreenshotUtils {
    /**
     * Parse viewport string (e.g., "1440x900") into dimensions
     */
    static parseViewport(viewport: string): ViewportDimensions {
        const match = viewport.match(/^(\d+)x(\d+)$/);
        if (!match) {
            throw new Error(`Invalid viewport format: "${viewport}". Use format: WIDTHxHEIGHT (e.g., 1440x900)`);
        }

        const width = parseInt(match[1]!, 10);
        const height = parseInt(match[2]!, 10);

        if (width < 320 || width > 7680) {
            throw new Error(`Invalid viewport width: ${width}. Must be between 320 and 7680 pixels`);
        }

        if (height < 240 || height > 4320) {
            throw new Error(`Invalid viewport height: ${height}. Must be between 240 and 4320 pixels`);
        }

        return { width, height };
    }

    /**
     * Validate URL format
     */
    static validateUrl(url: string): string {
        if (!url || url.trim() === '') {
            throw new Error('URL cannot be empty');
        }

        const trimmed = url.trim();

        // Add protocol if missing
        let finalUrl = trimmed;
        if (!trimmed.match(/^https?:\/\//i)) {
            finalUrl = `https://${trimmed}`;
        }

        // Basic URL validation
        try {
            const urlObj = new URL(finalUrl);
            if (!urlObj.protocol || !urlObj.hostname) {
                throw new Error('Invalid URL structure');
            }
            return finalUrl;
        } catch (error) {
            throw new Error(`Invalid URL: ${url}`);
        }
    }

    /**
     * Generate safe slug from URL for filename
     */
    static generateSlug(url: string): string {
        try {
            const urlObj = new URL(url);
            let slug = urlObj.hostname + urlObj.pathname;
            
            // Sanitize: replace non-alphanumeric with dash, remove leading/trailing dashes
            slug = slug
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .substring(0, 50);

            return slug || 'screenshot';
        } catch {
            return 'screenshot';
        }
    }

    /**
     * Generate timestamp string for filenames (format: YYYY-MM-DD_HH-MM-SS)
     */
    static generateTimestamp(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    }

    /**
     * Save screenshot and metadata files
     */
    static async saveScreenshotFiles(
        imageBuffer: Buffer,
        metadata: ScreenshotMetadata,
        outputDir: string,
        url: string
    ): Promise<{ pngPath: string; jsonPath: string }> {
        try {
            // Generate filename components
            const timestamp = this.generateTimestamp();
            const slug = this.generateSlug(url);
            const baseName = `${timestamp}__screenshot__${slug}`;
            const pngFilename = `${baseName}.png`;
            const jsonFilename = `${baseName}.json`;

            // Resolve full paths
            const fullDir = path.resolve(process.cwd(), outputDir);
            const pngPath = path.join(fullDir, pngFilename);
            const jsonPath = path.join(fullDir, jsonFilename);

            // Ensure directory exists
            try {
                await fs.mkdir(fullDir, { recursive: true });
            } catch (mkdirError: any) {
                if (mkdirError.code === 'EACCES') {
                    throw new Error(`Permission denied: Cannot create directory ${fullDir}`);
                }
                throw new Error(`Failed to create directory: ${mkdirError.message}`);
            }

            // Check write permissions
            try {
                await fs.access(fullDir, fs.constants.W_OK);
            } catch {
                throw new Error(`No write permission for directory: ${fullDir}`);
            }

            // Check disk space (basic check for Windows)
            if (process.platform === 'win32') {
                try {
                    const stats = await fs.statfs(fullDir);
                    const availableSpace = stats.bavail * stats.bsize;
                    const requiredSpace = imageBuffer.length + 10240; // image + ~10KB for JSON
                    
                    if (availableSpace < requiredSpace * 2) {
                        throw new Error(`Insufficient disk space. Available: ${(availableSpace / (1024 * 1024)).toFixed(2)} MB`);
                    }
                } catch (spaceError: any) {
                    if (spaceError.message.includes('Insufficient disk space')) {
                        throw spaceError;
                    }
                    // If we can't check space, continue
                }
            }

            // Write PNG file
            try {
                await fs.writeFile(pngPath, imageBuffer);
            } catch (writeError: any) {
                if (writeError.code === 'ENOSPC') {
                    throw new Error('Disk full: No space available to save screenshot');
                }
                if (writeError.code === 'EACCES') {
                    throw new Error(`Permission denied: Cannot write to ${pngPath}`);
                }
                throw new Error(`Failed to write screenshot: ${writeError.message}`);
            }

            // Write JSON metadata file
            try {
                const jsonContent = JSON.stringify(metadata, null, 2);
                await fs.writeFile(jsonPath, jsonContent, 'utf-8');
            } catch (writeError: any) {
                // Try to clean up PNG if JSON write fails
                try {
                    await fs.unlink(pngPath);
                } catch {
                    // Ignore cleanup error
                }
                throw new Error(`Failed to write metadata: ${writeError.message}`);
            }

            // Verify files were written
            try {
                const pngStats = await fs.stat(pngPath);
                const jsonStats = await fs.stat(jsonPath);
                
                if (pngStats.size === 0 || jsonStats.size === 0) {
                    throw new Error('Files written but appear empty');
                }
            } catch (statError: any) {
                throw new Error(`File verification failed: ${statError.message}`);
            }

            return { pngPath, jsonPath };
        } catch (error: any) {
            throw new Error(`Failed to save screenshot files: ${error.message}`);
        }
    }

    /**
     * Validate wait time in milliseconds
     */
    static validateWaitMs(waitMs: any): number {
        const parsed = parseInt(waitMs, 10);
        
        if (isNaN(parsed)) {
            throw new Error(`Invalid wait time: "${waitMs}". Must be a number`);
        }

        if (parsed < 0) {
            throw new Error(`Invalid wait time: ${parsed}ms. Cannot be negative`);
        }

        if (parsed > 60000) {
            throw new Error(`Invalid wait time: ${parsed}ms. Maximum is 60000ms (60 seconds)`);
        }

        return parsed;
    }

    /**
     * CSS to disable animations and transitions
     */
    static getDisableAnimationsCSS(): string {
        return `
            *, *::before, *::after {
                animation-duration: 0s !important;
                animation-delay: 0s !important;
                transition-duration: 0s !important;
                transition-delay: 0s !important;
            }
        `;
    }
}
