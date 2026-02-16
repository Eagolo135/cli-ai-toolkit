import { Config } from '@cli-ai-toolkit/utils';

export class SearchService {
    private apiKey: string;
    private engineId: string;
    private baseUrl = 'https://www.googleapis.com/customsearch/v1';

    constructor() {
        this.apiKey = Config.get('SEARCH_API_KEY');
        this.engineId = Config.get('SEARCH_ENGINE_ID');
    }

    async search(query: string): Promise<string> {
        if (!this.apiKey || this.apiKey.includes('your_') || !this.engineId || this.engineId.includes('your_')) {
            console.warn('WARNING: SEARCH_API_KEY or SEARCH_ENGINE_ID not found or is placeholder. Using mock data.');
            return `Mock Search Result for "${query}"\n\nTitle: Example Result\nLink: https://example.com\nSnippet: This is a mock search result because API keys were not found.\n---`;
        }

        const url = `${this.baseUrl}?key=${this.apiKey}&cx=${this.engineId}&q=${encodeURIComponent(query)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Search API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json() as { items?: any[] };

            // Parse and format results
            if (!data.items || data.items.length === 0) {
                return 'No results found.';
            }

            return data.items.map((item: any) => {
                return `Title: ${item.title}\nLink: ${item.link}\nSnippet: ${item.snippet}\n---`;
            }).join('\n');

        } catch (error) {
            console.error('Search service error:', error);
            throw error;
        }
    }
}
