import { WebSearchCommand } from './src/commands/WebSearchCommand.js';

async function run() {
    console.log('Running test-search.ts');
    const cmd = new WebSearchCommand();
    await cmd.execute({ query: 'test' });
    console.log('Done.');
}

run().catch(console.error);
