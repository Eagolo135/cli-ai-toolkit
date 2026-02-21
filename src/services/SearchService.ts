import axios from 'axios';

/**
 * SearchService - Uses Tavily API for live web searches
 */
export class SearchService {
    private apiKey: string;
    private baseUrl = 'https://api.tavily.com/search';

    constructor() {
        this.apiKey = process.env.TAVILY_API_KEY || '';
        
        if (!this.apiKey || this.apiKey.includes('your_')) {
            console.warn('WARNING: TAVILY_API_KEY not found. Web search will use fallback.');
        }
    }

    async search(query: string): Promise<string> {
        if (!this.apiKey || this.apiKey.includes('your_')) {
            return `Search Query: "${query}"\n\n[Tavily API key not configured - using AI knowledge synthesis]`;
        }

        try {
            const response = await axios.post(this.baseUrl, {
                api_key: this.apiKey,
                query: query,
                search_depth: 'basic',
                include_answer: true,
                include_raw_content: false,
                max_results: 5,
                include_domains: [],
                exclude_domains: []
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
            });

            const data = response.data;
            
            // Format results
            let formattedResults = `Search Query: "${query}"\n\n`;
            
            // Add AI-generated answer if available
            if (data.answer) {
                formattedResults += `Answer: ${data.answer}\n\n`;
            }
            
            // Add search results
            if (data.results && data.results.length > 0) {
                formattedResults += `Results:\n\n`;
                data.results.forEach((result: any, index: number) => {
                    formattedResults += `[${index + 1}] ${result.title}\n`;
                    formattedResults += `    URL: ${result.url}\n`;
                    if (result.content) {
                        formattedResults += `    ${result.content}\n`;
                    }
                    if (result.published_date) {
                        formattedResults += `    Published: ${result.published_date}\n`;
                    }
                    formattedResults += `\n`;
                });
            } else {
                formattedResults += 'No results found.\n';
            }
            
            return formattedResults;

        } catch (error: any) {
            console.error('Tavily search error:', error.message);
            
            if (error.response?.status === 401) {
                throw new Error('Tavily API authentication failed. Check your TAVILY_API_KEY.');
            } else if (error.response?.status === 429) {
                throw new Error('Tavily API rate limit exceeded. Please try again later.');
            } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                throw new Error('Tavily API request timed out. Please try again.');
            }
            
            throw new Error(`Tavily search failed: ${error.message}`);
        }
    }
}
