import dotenv from 'dotenv';

// Load .env from project root (process.cwd())
dotenv.config();

export class Config {
    static get(key: string): string {
        const value = process.env[key];
        if (!value) {
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
