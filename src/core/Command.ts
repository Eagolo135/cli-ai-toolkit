export interface Command {
    name: string;
    execute(args: any): Promise<void>;
}
