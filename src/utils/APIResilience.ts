/**
 * API Resilience Utilities
 * Provides retry logic, timeout handling, and error categorization
 */

export interface RetryConfig {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    timeoutMs: number;
    backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    timeoutMs: 60000, // 60 seconds
    backoffMultiplier: 2,
};

export enum ErrorCategory {
    NETWORK = 'NETWORK',
    RATE_LIMIT = 'RATE_LIMIT',
    AUTH = 'AUTH',
    INVALID_REQUEST = 'INVALID_REQUEST',
    SERVER_ERROR = 'SERVER_ERROR',
    TIMEOUT = 'TIMEOUT',
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
    UNKNOWN = 'UNKNOWN',
}

export class APIError extends Error {
    constructor(
        message: string,
        public category: ErrorCategory,
        public statusCode?: number,
        public retryable: boolean = false
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export class APIResilience {
    /**
     * Execute a function with retry logic and timeout
     */
    static async executeWithRetry<T>(
        fn: () => Promise<T>,
        config: Partial<RetryConfig> = {},
        operationName: string = 'API call'
    ): Promise<T> {
        const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
            try {
                // Wrap in timeout
                const result = await this.withTimeout(fn(), fullConfig.timeoutMs, operationName);
                
                // Success - log if there were retries
                if (attempt > 0) {
                    console.log(`✓ ${operationName} succeeded after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}`);
                }
                
                return result;
            } catch (error: any) {
                lastError = error;
                
                const apiError = this.categorizeError(error);
                
                // Don't retry if not retryable or on last attempt
                if (!apiError.retryable || attempt === fullConfig.maxRetries) {
                    throw apiError;
                }

                // Calculate delay with exponential backoff
                const delay = Math.min(
                    fullConfig.initialDelayMs * Math.pow(fullConfig.backoffMultiplier, attempt),
                    fullConfig.maxDelayMs
                );

                console.warn(
                    `⚠ ${operationName} failed (attempt ${attempt + 1}/${fullConfig.maxRetries + 1}): ${apiError.message}`
                );
                console.log(`  Retrying in ${(delay / 1000).toFixed(1)}s...`);

                await this.sleep(delay);
            }
        }

        // Should never reach here, but TypeScript needs it
        throw lastError || new Error('Unknown error occurred');
    }

    /**
     * Wrap a promise with a timeout
     */
    static withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) => {
                setTimeout(() => {
                    reject(new APIError(
                        `${operationName} timed out after ${timeoutMs / 1000}s`,
                        ErrorCategory.TIMEOUT,
                        undefined,
                        true // Timeouts are retryable
                    ));
                }, timeoutMs);
            }),
        ]);
    }

    /**
     * Categorize error and determine if it's retryable
     */
    static categorizeError(error: any): APIError {
        // Already an APIError
        if (error instanceof APIError) {
            return error;
        }

        const message = error.message || 'Unknown error';
        const statusCode = error.response?.status || error.status || error.statusCode;

        // Network errors
        if (
            error.code === 'ENOTFOUND' ||
            error.code === 'ECONNREFUSED' ||
            error.code === 'ECONNRESET' ||
            error.code === 'ETIMEDOUT' ||
            message.includes('network') ||
            message.includes('connect')
        ) {
            return new APIError(
                `Network error: ${message}`,
                ErrorCategory.NETWORK,
                statusCode,
                true
            );
        }

        // Rate limiting (429)
        if (statusCode === 429 || message.toLowerCase().includes('rate limit')) {
            return new APIError(
                'Rate limit exceeded. Please wait before retrying.',
                ErrorCategory.RATE_LIMIT,
                429,
                true
            );
        }

        // Authentication errors (401, 403)
        if (statusCode === 401 || statusCode === 403 || message.toLowerCase().includes('unauthorized')) {
            return new APIError(
                'Authentication failed. Check your API key.',
                ErrorCategory.AUTH,
                statusCode,
                false
            );
        }

        // Quota exceeded
        if (
            statusCode === 402 ||
            message.toLowerCase().includes('quota') ||
            message.toLowerCase().includes('insufficient_quota')
        ) {
            return new APIError(
                'API quota exceeded. Check your plan limits.',
                ErrorCategory.QUOTA_EXCEEDED,
                statusCode,
                false
            );
        }

        // Invalid request (400)
        if (statusCode === 400 || message.toLowerCase().includes('invalid')) {
            return new APIError(
                `Invalid request: ${message}`,
                ErrorCategory.INVALID_REQUEST,
                400,
                false
            );
        }

        // Server errors (500+) - retryable
        if (statusCode && statusCode >= 500) {
            return new APIError(
                `Server error: ${message}`,
                ErrorCategory.SERVER_ERROR,
                statusCode,
                true
            );
        }

        // Default: unknown, not retryable
        return new APIError(
            message,
            ErrorCategory.UNKNOWN,
            statusCode,
            false
        );
    }

    /**
     * Sleep for specified milliseconds
     */
    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Create user-friendly error message
     */
    static formatErrorForUser(error: APIError): string {
        const categoryMessages: Record<ErrorCategory, string> = {
            [ErrorCategory.NETWORK]: '🌐 Network connection failed',
            [ErrorCategory.RATE_LIMIT]: '⏱️  Rate limit reached',
            [ErrorCategory.AUTH]: '🔑 Authentication failed',
            [ErrorCategory.INVALID_REQUEST]: '❌ Invalid request',
            [ErrorCategory.SERVER_ERROR]: '🔧 Service temporarily unavailable',
            [ErrorCategory.TIMEOUT]: '⏰ Request timed out',
            [ErrorCategory.QUOTA_EXCEEDED]: '💳 API quota exceeded',
            [ErrorCategory.UNKNOWN]: '⚠️  An error occurred',
        };

        return `${categoryMessages[error.category]}: ${error.message}`;
    }
}
