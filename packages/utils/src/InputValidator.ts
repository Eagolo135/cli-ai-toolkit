/**
 * Input Validation Utilities
 * Validates and sanitizes user inputs
 */

export interface ValidationResult {
    valid: boolean;
    error?: string;
    sanitized?: string;
}

export class InputValidator {
    // API limits (conservative to avoid rejections)
    private static readonly MAX_PROMPT_LENGTH = 4000; // Most APIs have limits
    private static readonly MIN_PROMPT_LENGTH = 3;
    private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    /**
     * Validate a prompt string
     */
    static validatePrompt(prompt: any): ValidationResult {
        // Check type
        if (typeof prompt !== 'string') {
            return {
                valid: false,
                error: 'Prompt must be a string',
            };
        }

        // Check if empty or only whitespace
        const trimmed = prompt.trim();
        if (trimmed.length === 0) {
            return {
                valid: false,
                error: 'Prompt cannot be empty',
            };
        }

        // Check minimum length
        if (trimmed.length < this.MIN_PROMPT_LENGTH) {
            return {
                valid: false,
                error: `Prompt must be at least ${this.MIN_PROMPT_LENGTH} characters long`,
            };
        }

        // Check maximum length
        if (trimmed.length > this.MAX_PROMPT_LENGTH) {
            return {
                valid: false,
                error: `Prompt exceeds maximum length of ${this.MAX_PROMPT_LENGTH} characters (current: ${trimmed.length})`,
            };
        }

        // Sanitize: remove control characters except newlines and tabs
        const sanitized = trimmed.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

        return {
            valid: true,
            sanitized,
        };
    }

    /**
     * Validate image size parameter
     */
    static validateImageSize(size: string): ValidationResult {
        const validSizes = ['1024x1024', '1792x1024', '1024x1792'];
        
        if (!validSizes.includes(size)) {
            return {
                valid: false,
                error: `Invalid image size. Must be one of: ${validSizes.join(', ')}`,
            };
        }

        return { valid: true, sanitized: size };
    }

    /**
     * Validate file path for security and size
     */
    static async validateFilePath(filePath: string): Promise<ValidationResult> {
        const fs = await import('fs/promises');
        const path = await import('path');

        // Check if path is provided
        if (!filePath || filePath.trim() === '') {
            return {
                valid: false,
                error: 'File path cannot be empty',
            };
        }

        // Resolve to absolute path to prevent directory traversal
        const resolvedPath = path.resolve(filePath);

        // Check if file exists
        try {
            const stats = await fs.stat(resolvedPath);

            // Check if it's actually a file
            if (!stats.isFile()) {
                return {
                    valid: false,
                    error: `Path is not a file: ${filePath}`,
                };
            }

            // Check file size
            if (stats.size > this.MAX_FILE_SIZE) {
                const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                const maxMB = (this.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
                return {
                    valid: false,
                    error: `File too large: ${sizeMB} MB (max: ${maxMB} MB)`,
                };
            }

            return {
                valid: true,
                sanitized: resolvedPath,
            };
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return {
                    valid: false,
                    error: `File not found: ${filePath}`,
                };
            }
            if (error.code === 'EACCES') {
                return {
                    valid: false,
                    error: `Permission denied: ${filePath}`,
                };
            }
            return {
                valid: false,
                error: `Cannot access file: ${error.message}`,
            };
        }
    }

    /**
     * Validate write directory permissions
     */
    static async validateWriteDirectory(dirPath: string): Promise<ValidationResult> {
        const fs = await import('fs/promises');
        const path = await import('path');

        try {
            // Ensure directory exists
            await fs.mkdir(dirPath, { recursive: true });

            // Test write permissions by creating a temporary file
            const testFile = path.join(dirPath, `.write-test-${Date.now()}`);
            await fs.writeFile(testFile, 'test');
            await fs.unlink(testFile);

            return { valid: true };
        } catch (error: any) {
            if (error.code === 'EACCES') {
                return {
                    valid: false,
                    error: `No write permission for directory: ${dirPath}`,
                };
            }
            if (error.code === 'ENOSPC') {
                return {
                    valid: false,
                    error: 'No disk space available',
                };
            }
            return {
                valid: false,
                error: `Cannot write to directory: ${error.message}`,
            };
        }
    }
}
