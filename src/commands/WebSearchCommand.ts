import { Command } from '../core/Command.js';
import { OpenAIService } from '../services/OpenAIService.js';
import { FileUtils } from '../utils/FileUtils.js';

export class WebSearchCommand implements Command {
    name = 'web-search';
    private openAIService: OpenAIService;

    constructor() {
        this.openAIService = new OpenAIService();
    }

    async execute(options: any): Promise<void> {
        // Commander passes variadic args. 
        // In our index.ts binding: .action(async (...args: any[]) => ... await command.execute(options))
        // But we need the positional argument 'query'.
        // We should update index.ts to pass arguments correctly, or handle them here if passed.
        // However, the `execute` signature in `Command` is `execute(args: any)`.
        // Let's refine `index.ts` to pass the positional args + options.
        // OR we just grab it from `options` if we defined it as an argument in Commander?
        // Commander separates arguments (positional) from options (flags).
        // Let's assume (based on my update to index.ts coming up) that `execute` receives { query: string, ...options }.

        // Wait, I need to configure the command arguments in `index.ts` or here.
        // The previous request said "Command handles routing", "index.ts must only register commands and route execution".
        // Does that mean `WebSearchCommand` defines its own arguments?
        // Commander's `.command()` structure in `index.ts` needs to know about `<query>`.

        // To strictly follow "index.ts must only register", `register` in `index.ts` should ask the command for its definition?
        // The `Command` interface I made has `name: string`. It might need `definition` or `configure(program: Command)`.

        // BUT, the `execute` method receives `args`.
        // Let's safely check what we get. 

        const query = options.query || (options as any)[0]; // Fallback if passed as array

        if (!query || typeof query !== 'string') {
            console.error('Error: Query argument is required.');
            return;
        }

        const prompt = `Search the web and provide factual sources and summaries for: ${query}`;

        console.log(`Executing web-search for: "${query}"...`);

        try {
            const result = await this.openAIService.getCompletion(prompt);
            const savedPath = await FileUtils.saveReference(result, query);
            console.log(`Saved to: ${savedPath}`);
        } catch (error) {
            console.error('Failed to execute web-search:', error);
        }
    }
}
