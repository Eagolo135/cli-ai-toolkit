// Web search library exports
export { OpenAIService, WebSearchOptions, SearchResult } from './OpenAIService.js';
export { SearchService } from './SearchService.js';

// Public API for programmatic use
import { OpenAIService, WebSearchOptions, SearchResult } from './OpenAIService.js';
import { FileUtils } from '@cli-ai-toolkit/utils';

/**
 * Perform web search with OpenAI agentic capabilities
 * @param query - The search query
 * @param opts - Search options
 * @returns Object with path and results
 */
export async function webSearch(
    query: string, 
    opts?: { 
        mode?: 'weak' | 'agentic' | 'deep-research';
        reasoningLevel?: 'low' | 'medium' | 'high';
        model?: string;
        outputDir?: string;
    }
): Promise<{ path: string; results: SearchResult }> {
    const service = new OpenAIService();
    
    // Build search options, only including defined values
    const searchOptions: WebSearchOptions = { query };
    if (opts?.mode !== undefined) searchOptions.mode = opts.mode;
    if (opts?.reasoningLevel !== undefined) searchOptions.reasoningLevel = opts.reasoningLevel;
    if (opts?.model !== undefined) searchOptions.model = opts.model;
    
    const results = await service.agenticWebSearch(searchOptions);
    
    // Save to file
    const outputDir = opts?.outputDir || 'references';
    const savedPath = await FileUtils.saveReference(results.content, query, outputDir);
    
    return {
        path: savedPath,
        results
    };
}

/**
 * Get a quick completion from OpenAI (legacy)
 * @param prompt - The prompt text
 * @returns Response content
 */
export async function getCompletion(prompt: string): Promise<string> {
    const service = new OpenAIService();
    return service.getCompletion(prompt);
}
