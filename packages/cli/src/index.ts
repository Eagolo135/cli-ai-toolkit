#!/usr/bin/env node
import { Command as CommanderProgram } from 'commander';
import dotenv from 'dotenv';
import { Command } from '@cli-ai-toolkit/core';
import { EnvValidator } from '@cli-ai-toolkit/utils';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Validate environment variables at startup
EnvValidator.validateOrExit();

// Initialize Commander
const program = new CommanderProgram();

program
    .name('cli-ai-toolkit')
    .description('A SOLID-compliant Node.js TypeScript CLI toolkit with AI commands')
    .version('1.0.0');

// Command Registry
class CommandRegistry {
    private commands: Map<string, Command> = new Map();

    register(command: Command, argsDefinition?: string) {
        if (this.commands.has(command.name)) {
            console.warn(`Command '${command.name}' is already registered. Overwriting.`);
        }
        this.commands.set(command.name, command);
        this.bindToCommander(command, argsDefinition);
    }

    private bindToCommander(command: Command, argsDefinition: string = '') {
        const cmdDef = argsDefinition ? `${command.name} ${argsDefinition}` : command.name;
        const cmd = program.command(cmdDef);

        // Add options based on command name
        if (command.name === 'gemini') {
            cmd.option('-f, --file <path>', 'File to include in prompt');
        } else if (command.name === 'image-generate') {
            cmd.option('-s, --size <size>', 'Image size (1024x1024, 1792x1024, or 1024x1792)', '1024x1024');
            cmd.option('--provider <name>', 'Provider: comfyui (default) or dalle', 'comfyui');
            cmd.option('--negative <text>', 'Negative prompt (ComfyUI only)');
            cmd.option('--steps <number>', 'Sampling steps (ComfyUI only, default: 20)');
            cmd.option('--cfg <number>', 'CFG scale (ComfyUI only, default: 8)');
            cmd.option('--seed <number>', 'Random seed (ComfyUI only, -1 for random)');
        } else if (command.name === 'web-search') {
            cmd.option('--mode <mode>', 'Search mode: agentic (default), weak, or deep-research', 'agentic');
            cmd.option('--reasoning <level>', 'Reasoning level: low, medium (default), high', 'medium');
            cmd.option('--model <model>', 'Override model (e.g., gpt-4o, gpt-4o-mini)');
        } else if (command.name === 'screenshot') {
            cmd.option('--full', 'Full page screenshot (default: true)');
            cmd.option('--viewport-only', 'Capture only the viewport instead of full page');
            cmd.option('--selector <css>', 'Screenshot specific element');
            cmd.option('--wait <ms>', 'Additional wait after load (default: 1500)');
            cmd.option('--viewport <size>', 'Viewport size (default: 1440x900)', '1440x900');
            cmd.option('--no-animations', 'Disable CSS animations');
            cmd.option('--out <dir>', 'Output directory (default: images/screenshots)');
        } else if (command.name === 'recreate') {
            cmd.option('--max-iterations <number>', 'Maximum iterations (default: 6)', '6');
            cmd.option('--pixel-threshold <number>', 'Pixel diff pass threshold 0-100 (default: 92)', '92');
            cmd.option('--vision-threshold <number>', 'Vision pass threshold 0-100 (default: 85)', '85');
        }

        cmd.action(async (...args: any[]) => {
            try {
                // Commander args: [arg1, arg2, ..., options, commandObject]
                const commandObj = args.pop(); // last arg is command object
                const options = args.pop(); // second to last is options

                // Build payload with query/prompt mapped correctly
                const payload: any = { options, args };
                if (command.name === 'web-search' && args.length > 0) {
                    payload.query = args[0];
                } else if (command.name === 'gemini' && args.length > 0) {
                    payload.prompt = args[0];
                } else if (command.name === 'image-generate' && args.length > 0) {
                    payload.prompt = args[0];
                } else if (command.name === 'screenshot' && args.length > 0) {
                    payload.url = args[0];
                } else if (command.name === 'recreate' && args.length > 0) {
                    payload.url = args[0];
                }

                await command.execute(payload);
            } catch (error: any) {
                // Fallback error handler (commands should handle their own errors)
                console.error(`\n❌ Unexpected error in ${command.name}:`, error.message);
                if (process.env.DEBUG) {
                    console.error(error);
                }
                process.exit(1);
            }
        });
    }
}

export const registry = new CommandRegistry();

// Register commands
import { WebSearchCommand } from './commands/WebSearchCommand.js';
import { GeminiCommand } from './commands/GeminiCommand.js';
import { ImageGenerateCommand } from './commands/ImageGenerateCommand.js';
import { ScreenshotCommand } from './commands/ScreenshotCommand.js';
import { RecreateCommand } from './commands/RecreateCommand.js';

try {
    registry.register(new WebSearchCommand(), '<query>');
    registry.register(new GeminiCommand(), '<prompt>');
    registry.register(new ImageGenerateCommand(), '<prompt>');
    registry.register(new ScreenshotCommand(), '<url>');
    registry.register(new RecreateCommand(), '<url>');
} catch (error: any) {
    console.error(`\n❌ Failed to initialize commands: ${error.message}`);
    process.exit(1);
}

// Parse arguments
program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
