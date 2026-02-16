export interface ICommand {
    name: string;
    execute(args: any): Promise<void>;
}
