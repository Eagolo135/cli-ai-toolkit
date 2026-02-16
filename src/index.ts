#!/usr/bin/env node
import { Command as CommanderProgram } from 'commander';
import dotenv from 'dotenv';
import { Command } from './core/Command.js';

// Load environment variables
dotenv.config();

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
            cmd.option('-s, --size <size>', 'Image size (e.g., 1024x1024)', '1024x1024');
        }

        cmd.action(async (...args: any[]) => {
            // Commander args: [arg1, arg2, ..., options, commandObject]
            // We want to pass a standardized object or just the raw args to execute.
            // Let's pass an object combining positional args and options.

            const commandObj = args.pop(); // last arg is command objects
            const options = args.pop(); // second to last is options

            // Map positional args if possible? 
            // For 'web-search <query>', args[0] is query.
            // Let's pass a merged object: { ...options, args: [...positionalArgs] }
            // Or if we know the argument names...
            // Simple approach: pass { query: args[0], ...options } if we know it's web-search.
            // Generic approach: pass { args: args, options: options }

            // Update: WebSearchCommand expects 'query' in the input object.
            // Let's try to pass { query: args[0] } if it's web-search.

            const payload: any = { options, args };
            if (command.name === 'web-search' && args.length > 0) {
                payload.query = args[0];
            } else if (command.name === 'gemini' && args.length > 0) {
                payload.prompt = args[0];
            } else if (command.name === 'image-generate' && args.length > 0) {
                payload.prompt = args[0];
            }

            try {
                await command.execute(payload);
            } catch (error) {
                console.error(`Error executing command ${command.name}:`, error);
                process.exit(1);
            }
        });
    }
}

export const registry = new CommandRegistry();

import { WebSearchCommand } from './commands/WebSearchCommand.js';
import { GeminiCommand } from './commands/GeminiCommand.js';
import { ImageGenerateCommand } from './commands/ImageGenerateCommand.js';
registry.register(new WebSearchCommand(), '<query>');
registry.register(new GeminiCommand(), '<prompt>');
registry.register(new ImageGenerateCommand(), '<prompt>');

// Parse arguments
program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
