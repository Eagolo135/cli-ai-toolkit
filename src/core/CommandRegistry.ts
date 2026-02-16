import { ICommand } from './ICommand.js';

export class CommandRegistry {
    private commands: Map<string, ICommand> = new Map();

    register(command: ICommand): void {
        if (this.commands.has(command.name)) {
            throw new Error(`Command '${command.name}' is already registered.`);
        }
        this.commands.set(command.name, command);
    }

    getCommand(name: string): ICommand | undefined {
        return this.commands.get(name);
    }

    getAllCommands(): ICommand[] {
        return Array.from(this.commands.values());
    }
}
