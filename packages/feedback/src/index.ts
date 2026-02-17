// Gemini feedback library exports
export { GeminiService, ImageComparisonResult, UICritiqueItem, UICritique } from './GeminiService.js';

// OpenAI Vision exports
export { OpenAIVisionService } from './OpenAIVisionService.js';

// Pixel diff exports
export { PixelDiffService, PixelDiffConfig, PixelDiffResult } from './PixelDiffService.js';

// Public API for programmatic use
import { GeminiService, UICritique } from './GeminiService.js';
import { PixelDiffService } from './PixelDiffService.js';

export interface RunFeedbackOptions {
    targetImagePath: string;
    candidateImagePath: string;
    outputDir?: string;
    feedbackOutputDir?: string; // Default: references/aI_feedback
    usePixelDiff?: boolean; // Use pixel diff instead of Gemini (default: true)
    passThreshold?: number; // Pass threshold for pixel diff (default: 92)
    slug?: string | undefined; // Slug for naming output files
    includeVisionCritique?: boolean; // Add vision-based UI critique (default: false)
    visionContext?: string; // Optional context for vision critique
}

export interface FeedbackResult {
    pass: boolean;
    score: number;
    notes: string;
    path: string;
    mismatchPercent?: number | undefined; // Only present with pixel diff
    diffImagePath?: string | undefined; // Only present with pixel diff
    method: 'pixel-diff' | 'gemini-ai'; // Which method was used
    visionCritique?: UICritique | undefined; // Optional vision-based UI critique
    visionCritiqueError?: string | undefined; // If vision critique failed
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
 * Supports both pixel-diff (objective) and Gemini AI (subjective) comparison
 * @param goal - The evaluation criteria/goal
 * @param opts - Options including target and candidate image paths, and output directory
 * @returns Feedback result with pass/fail, score, notes, and path to saved feedback
 */
export async function runFeedback(
    goal: string,
    opts: RunFeedbackOptions
): Promise<FeedbackResult> {
    const usePixelDiff = opts.usePixelDiff ?? true; // Default to pixel diff
    const outputDir = opts.feedbackOutputDir ?? 'references/aI_feedback';
    
    let pass: boolean;
    let score: number;
    let notes: string;
    let mismatchPercent: number | undefined;
    let diffImagePath: string | undefined;
    let method: 'pixel-diff' | 'gemini-ai';
    let visionCritique: UICritique | undefined;
    let visionCritiqueError: string | undefined;

    if (usePixelDiff) {
        // Use objective pixel-by-pixel comparison
        method = 'pixel-diff';
        const pixelDiffService = new PixelDiffService({
            passThreshold: opts.passThreshold ?? 92,
            diffOutputDir: 'images/diffs'
        });

        const result = await pixelDiffService.compareImages(
            opts.targetImagePath,
            opts.candidateImagePath,
            opts.slug
        );

        pass = result.pass;
        score = result.score;
        notes = result.notes;
        mismatchPercent = result.mismatchPercent;
        diffImagePath = result.diffImagePath;
    } else {
        // Use Gemini AI for subjective comparison
        method = 'gemini-ai';
        const service = new GeminiService();
        const result = await service.compareImages(
            goal,
            opts.targetImagePath,
            opts.candidateImagePath
        );

        pass = result.pass;
        score = result.score;
        notes = result.notes;
    }

    // Optionally generate vision-based UI critique (supplementary)
    // This does NOT affect pass/fail - pixel diff is the primary signal
    if (opts.includeVisionCritique) {
        try {
            const service = new GeminiService();
            visionCritique = await service.generateUICritique(
                opts.targetImagePath,
                opts.candidateImagePath,
                opts.visionContext || goal
            );
        } catch (error) {
            // Safe error handling: if vision fails, we still return pixel diff result
            visionCritiqueError = error instanceof Error 
                ? `Vision critique failed: ${error.message}` 
                : 'Vision critique failed with unknown error';
            console.warn(`⚠️  ${visionCritiqueError}`);
        }
    }

    // Prepare feedback content
    const feedbackData = {
        goal,
        method,
        targetImage: opts.targetImagePath,
        candidateImage: opts.candidateImagePath,
        result: {
            pass,
            score,
            mismatchPercent,
            diffImagePath,
            notes
        },
        visionCritique: visionCritique || undefined,
        visionCritiqueError: visionCritiqueError || undefined,
        timestamp: new Date().toISOString()
    };

    // Format readable feedback content
    let feedbackContent = `# Image Comparison Feedback

**Goal:** ${goal}
**Method:** ${method.toUpperCase()}

**Target Image:** ${opts.targetImagePath}
**Candidate Image:** ${opts.candidateImagePath}

**Result:** ${pass ? '✅ PASS' : '❌ FAIL'}
**Score:** ${score}/100
${mismatchPercent !== undefined ? `**Mismatch:** ${mismatchPercent}%\n` : ''}${diffImagePath ? `**Diff Image:** ${diffImagePath}\n` : ''}
**Notes:**
${notes}
`;

    // Add vision critique if available
    if (visionCritique) {
        feedbackContent += `\n---

## 🔍 Vision-Based UI Critique

**Summary:** ${visionCritique.summary}
**Total Issues Identified:** ${visionCritique.totalIssues}

### Prioritized Punch List

`;
        
        // Group by priority
        const priorities = ['critical', 'high', 'medium', 'low'] as const;
        for (const priority of priorities) {
            const items = visionCritique.items.filter(item => item.priority === priority);
            if (items.length > 0) {
                const icon = priority === 'critical' ? '🔴' : priority === 'high' ? '🟠' : priority === 'medium' ? '🟡' : '🟢';
                feedbackContent += `\n#### ${icon} ${priority.toUpperCase()} (${items.length})\n\n`;
                
                items.forEach((item, index) => {
                    feedbackContent += `${index + 1}. **${item.element}** [${item.category}]\n`;
                    feedbackContent += `   - **Issue:** ${item.issue}\n`;
                    feedbackContent += `   - **Expected:** ${item.expected}\n`;
                    feedbackContent += `   - **Actual:** ${item.actual}\n\n`;
                });
            }
        }
    } else if (visionCritiqueError) {
        feedbackContent += `\n---

## ⚠️ Vision Critique Failed

${visionCritiqueError}

`;
    }

    feedbackContent += `\n---
Generated: ${new Date().toISOString()}
`;

    // Save feedback as JSON
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const slugPart = opts.slug ? `__${opts.slug}` : '';
    const filename = `${timestamp}__feedback${slugPart}.json`;
    
    const fs = await import('fs/promises');
    await fs.mkdir(outputDir, { recursive: true });
    const feedbackPath = `${outputDir}/${filename}`;
    
    await fs.writeFile(feedbackPath, JSON.stringify(feedbackData, null, 2), 'utf-8');

    // Also save markdown version
    const mdPath = feedbackPath.replace('.json', '.md');
    await fs.writeFile(mdPath, feedbackContent, 'utf-8');

    return { 
        pass, 
        score, 
        notes, 
        path: feedbackPath,
        mismatchPercent,
        diffImagePath,
        method,
        visionCritique,
        visionCritiqueError
    };
}
