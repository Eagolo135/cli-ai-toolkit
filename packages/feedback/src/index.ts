// Gemini feedback library exports
export { GeminiService, ImageComparisonResult } from './GeminiService.js';

// Public API for programmatic use
import { GeminiService } from './GeminiService.js';
import { FileUtils } from '@cli-ai-toolkit/utils';

export interface RunFeedbackOptions {
    targetImagePath: string;
    candidateImagePath: string;
    outputDir?: string;
}

export interface FeedbackResult {
    pass: boolean;
    score: number;
    notes: string;
    path: string;
}

/**
 * Generate AI feedback/content using Gemini
 * @param prompt - The prompt text
 * @returns Generated content
 */
export async function generateFeedback(prompt: string): Promise<string> {
    const service = new GeminiService();
    return service.generateContent(prompt);
}

/**
 * Run image comparison feedback (judge function)
 * Compares a candidate image against a target image based on a goal
 * @param goal - The evaluation criteria/goal
 * @param opts - Options including target and candidate image paths, and output directory
 * @returns Feedback result with pass/fail, score, notes, and path to saved feedback
 */
export async function runFeedback(
    goal: string,
    opts: RunFeedbackOptions
): Promise<FeedbackResult> {
    const service = new GeminiService();
    
    // Default output directory
    const outputDir = opts.outputDir ?? 'references/aI_feedback';

    // Compare images
    const { pass, score, notes } = await service.compareImages(
        goal,
        opts.targetImagePath,
        opts.candidateImagePath
    );

    // Format feedback content
    const feedbackContent = `# Image Comparison Feedback

**Goal:** ${goal}

**Target Image:** ${opts.targetImagePath}
**Candidate Image:** ${opts.candidateImagePath}

**Result:** ${pass ? '✅ PASS' : '❌ FAIL'}
**Score:** ${score}/100

**Notes:**
${notes}

---
Generated: ${new Date().toISOString()}
`;

    // Save feedback
    const path = await FileUtils.saveAIFeedback(
        feedbackContent,
        goal,
        outputDir
    );

    return { pass, score, notes, path };
}
