/**
 * Agent Orchestrator
 * 
 * Coordinate multiple AI tools to accomplish complex tasks.
 * 
 * Example use cases:
 * - Recreate websites using iterative AI feedback
 * - Research a topic, generate images, and create a report
 * - Screenshot multiple pages and compare them
 * - Iterative feedback loops between Gemini and search
 */

// Export types
export type {
    RecreateWebsiteOptions,
    RecreateWebsiteResult,
    RecreationIteration
} from './types.js';

// Export services
export { WebsiteRecreationService, recreateWebsite } from './WebsiteRecreationService.js';

export class Agent {
    /**
     * Execute a complex multi-step task
     */
    async execute(task: string): Promise<void> {
        throw new Error('Agent orchestration not yet implemented');
    }
}

export async function orchestrate(task: string): Promise<void> {
    const agent = new Agent();
    return agent.execute(task);
}
