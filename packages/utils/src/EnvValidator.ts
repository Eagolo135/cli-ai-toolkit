/**
 * Environment Variable Validator
 * Validates all required environment variables at startup
 */

export interface EnvValidationResult {
    valid: boolean;
    missing: string[];
    message: string;
}

export class EnvValidator {
    private static readonly REQUIRED_VARS = {
        OPENAI_API_KEY: 'OpenAI API Key for image generation and web search',
        GEMINI_API_KEY: 'Google Gemini API Key for AI content generation',
    };

    /**
     * Validate all required environment variables
     */
    static validate(): EnvValidationResult {
        const missing: string[] = [];

        for (const [key, description] of Object.entries(this.REQUIRED_VARS)) {
            const value = process.env[key];
            if (!value || value.trim() === '') {
                missing.push(`${key} (${description})`);
            }
        }

        if (missing.length > 0) {
            const message = this.buildErrorMessage(missing);
            return { valid: false, missing, message };
        }

        return { valid: true, missing: [], message: 'All environment variables configured' };
    }

    /**
     * Build a helpful error message for missing environment variables
     */
    private static buildErrorMessage(missing: string[]): string {
        return `
╔════════════════════════════════════════════════════════════════╗
║  ❌ CONFIGURATION ERROR: Missing Environment Variables        ║
╚════════════════════════════════════════════════════════════════╝

The following required environment variables are missing:

${missing.map(m => `  • ${m}`).join('\n')}

📝 Setup Instructions:
   1. Create a .env file in the project root directory
   2. Add the required API keys:

      OPENAI_API_KEY=your_openai_api_key_here
      GEMINI_API_KEY=your_gemini_api_key_here

   3. Get your API keys from:
      • OpenAI: https://platform.openai.com/api-keys
      • Gemini: https://aistudio.google.com/app/apikey

For more information, check the README.md file.
`;
    }

    /**
     * Validate and exit if invalid
     */
    static validateOrExit(): void {
        const result = this.validate();
        if (!result.valid) {
            console.error(result.message);
            process.exit(1);
        }
    }
}
