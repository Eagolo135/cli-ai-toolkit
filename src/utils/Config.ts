import dotenv from 'dotenv';

// Load .env from project root (process.cwd())
dotenv.config();

export class Config {
    static get(key: string): string {
        const value = process.env[key];
        if (!value) {
            // Allow optional keys if needed, but for now strict
            // actually let's just return undefined or throw if strictly required
            // For this toolkit, keys are critical.
            // But maybe we check in the service instead?
            // Let's return the string or undefined.
            return '';
        }
        return value;
    }

    static getRequired(key: string): string {
        const value = process.env[key];
        if (!value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        return value;
    }
}
