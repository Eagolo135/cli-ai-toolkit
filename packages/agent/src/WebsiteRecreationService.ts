import { chromium, Browser } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { ScreenshotService } from '@cli-ai-toolkit/screenshot';
import { GeminiService, OpenAIVisionService, PixelDiffService } from '@cli-ai-toolkit/feedback';
import { RecreateWebsiteOptions, RecreateWebsiteResult, RecreationIteration } from './types.js';

export class WebsiteRecreationService {
    private screenshotService: ScreenshotService;
    private geminiService: GeminiService;
    private openaiService: OpenAIVisionService;
    private pixelDiffService: PixelDiffService;

    constructor() {
        this.screenshotService = new ScreenshotService();
        this.geminiService = new GeminiService();
        this.openaiService = new OpenAIVisionService();
        this.pixelDiffService = new PixelDiffService();
    }

    /**
     * Recreate a website from a URL using iterative AI feedback
     * @param url - Target URL to recreate
     * @param options - Configuration options
     * @returns Result with final HTML and all iteration details
     */
    async recreateWebsite(
        url: string,
        options: RecreateWebsiteOptions = {}
    ): Promise<RecreateWebsiteResult> {
        const startTime = Date.now();

        // Set defaults
        const opts = {
            maxIterations: options.maxIterations ?? 6,
            pixelDiffThreshold: options.pixelDiffThreshold ?? 92,
            visionThreshold: options.visionThreshold ?? 85,
            viewport: options.viewport ?? { width: 1280, height: 720 },
            waitMs: options.waitMs ?? 1000,
            runId: options.runId ?? this.generateRunId(),
            outputDirs: {
                recreated: options.outputDirs?.recreated ?? 'docs/recreated',
                runs: options.outputDirs?.runs ?? 'references/runs',
                screenshots: options.outputDirs?.screenshots ?? 'images/screenshots',
                diffs: options.outputDirs?.diffs ?? 'images/diffs'
            }
        };

        // Create output directories
        const runDir = path.join(opts.outputDirs.runs, opts.runId);
        const recreatedDir = path.join(opts.outputDirs.recreated, opts.runId);
        await fs.mkdir(runDir, { recursive: true });
        await fs.mkdir(recreatedDir, { recursive: true });
        await fs.mkdir(opts.outputDirs.screenshots, { recursive: true });
        await fs.mkdir(opts.outputDirs.diffs, { recursive: true });

        console.log(`\n🚀 Starting website recreation`);
        console.log(`   URL: ${url}`);
        console.log(`   Coding Agent: OPENAI`);
        console.log(`   Judge: GEMINI`);
        console.log(`   Run ID: ${opts.runId}`);
        console.log(`   Max Iterations: ${opts.maxIterations}`);
        console.log(`   Thresholds: Pixel=${opts.pixelDiffThreshold}%, Vision=${opts.visionThreshold}%\n`);

        const iterations: RecreationIteration[] = [];
        let finalHTML = '';
        let stopReason: 'success' | 'max_iterations' | 'error' = 'max_iterations';
        let errorMessage: string | undefined;

        try {
            // Step 1: Screenshot target page
            console.log(`📸 Step 1: Capturing target screenshot...`);
            const targetScreenshotResult = await this.screenshotService.captureScreenshot({
                url,
                viewport: opts.viewport,
                fullPage: false,
                selector: null,
                waitMs: opts.waitMs,
                disableAnimations: true
            });

            const targetScreenshotPath = path.join(
                opts.outputDirs.screenshots,
                `${opts.runId}_target.png`
            );
            await fs.writeFile(targetScreenshotPath, targetScreenshotResult.buffer);
            console.log(`   ✓ Saved: ${targetScreenshotPath}\n`);

            // Iteration loop
            for (let i = 1; i <= opts.maxIterations; i++) {
                console.log(`\n${'='.repeat(60)}`);
                console.log(`   ITERATION ${i}/${opts.maxIterations}`);
                console.log(`${'='.repeat(60)}\n`);

                const iterationStart = Date.now();
                const timestamp = new Date().toISOString();

                // Step 2: Generate HTML/CSS with OpenAI (coding agent)
                console.log(`🎨 Step 2: OpenAI generating HTML/CSS...`);
                const previousCritique = iterations[i - 2]?.critique;
                const revisionContext = previousCritique 
                    ? this.formatCritiqueForRevision(previousCritique)
                    : undefined;

                const html = await this.openaiService.generateHTMLFromScreenshot(
                    targetScreenshotPath,
                    revisionContext
                );
                console.log(`   ✓ Generated HTML (${html.length} chars)\n`);

                // Save HTML
                const htmlPath = path.join(recreatedDir, `iteration_${i}.html`);
                await fs.writeFile(htmlPath, html);
                
                // Also save as index.html for the final iteration
                if (i === opts.maxIterations) {
                    const indexPath = path.join(recreatedDir, 'index.html');
                    await fs.writeFile(indexPath, html);
                }

                // Step 3: Screenshot the recreation
                console.log(`📸 Step 3: Capturing recreation screenshot...`);
                const recreationScreenshotPath = await this.screenshotHTML(
                    html,
                    opts.viewport,
                    path.join(opts.outputDirs.screenshots, `${opts.runId}_iteration_${i}.png`)
                );
                console.log(`   ✓ Saved: ${recreationScreenshotPath}\n`);

                // Step 4: Run feedback comparisons
                console.log(`🔍 Step 4: Running feedback comparisons...\n`);

                // Pixel diff
                console.log(`   📊 Pixel Diff Analysis...`);
                const pixelDiffResult = await this.pixelDiffService.compareImages(
                    targetScreenshotPath,
                    recreationScreenshotPath,
                    `${opts.runId}_iteration_${i}`
                );
                console.log(`      Score: ${pixelDiffResult.score}% (threshold: ${opts.pixelDiffThreshold}%)`);
                console.log(`      Status: ${pixelDiffResult.pass ? '✓ PASS' : '✗ FAIL'}`);
                console.log(`      Diff: ${pixelDiffResult.diffImagePath}\n`);

                // Vision comparison
                console.log(`   👁️  Vision Analysis...`);
                const visionResult = await this.geminiService.compareImages(
                    'The candidate should be a pixel-perfect recreation of the target webpage, matching layout, colors, typography, spacing, and overall visual appearance.',
                    targetScreenshotPath,
                    recreationScreenshotPath
                );
                console.log(`      Score: ${visionResult.score}% (threshold: ${opts.visionThreshold}%)`);
                console.log(`      Status: ${visionResult.pass ? '✓ PASS' : '✗ FAIL'}`);
                console.log(`      Notes: ${visionResult.notes}\n`);

                const bothPass = 
                    pixelDiffResult.score >= opts.pixelDiffThreshold &&
                    visionResult.score >= opts.visionThreshold;

                // Build iteration record
                const iteration: RecreationIteration = {
                    iteration: i,
                    html,
                    screenshotPath: recreationScreenshotPath,
                    pixelDiff: {
                        pass: pixelDiffResult.pass,
                        score: pixelDiffResult.score,
                        mismatchPercent: pixelDiffResult.mismatchPercent,
                        diffImagePath: pixelDiffResult.diffImagePath
                    },
                    vision: {
                        pass: visionResult.pass,
                        score: visionResult.score,
                        notes: visionResult.notes
                    },
                    timestamp
                };

                // Step 5: Check if we should stop or generate critique
                if (bothPass) {
                    console.log(`\n✨ SUCCESS! Recreation passes all quality checks.\n`);
                    finalHTML = html;
                    stopReason = 'success';
                    iterations.push(iteration);
                    
                    // Save final successful HTML as index.html
                    const indexPath = path.join(recreatedDir, 'index.html');
                    await fs.writeFile(indexPath, html);
                    console.log(`   💾 Saved final recreation: ${indexPath}\n`);
                    
                    break;
                } else if (i < opts.maxIterations) {
                    // Generate UI critique for next iteration
                    console.log(`   🔧 Generating UI critique for revision...\n`);
                    const critique = await this.geminiService.generateUICritique(
                        targetScreenshotPath,
                        recreationScreenshotPath,
                        'Webpage recreation attempt'
                    );

                    iteration.critique = {
                        summary: critique.summary,
                        totalIssues: critique.totalIssues,
                        items: critique.items
                    };

                    console.log(`   📋 Critique Summary: ${critique.summary}`);
                    console.log(`   📋 Issues Found: ${critique.totalIssues}\n`);

                    // Log top issues
                    const topIssues = critique.items.slice(0, 3);
                    topIssues.forEach((item, idx) => {
                        console.log(`      ${idx + 1}. [${item.priority.toUpperCase()}] ${item.element}`);
                        console.log(`         ${item.issue}`);
                    });
                    console.log();
                }

                iterations.push(iteration);
                finalHTML = html;

                const iterationTime = Date.now() - iterationStart;
                console.log(`   ⏱️  Iteration completed in ${(iterationTime / 1000).toFixed(1)}s`);

                // If this was the last iteration
                if (i === opts.maxIterations) {
                    console.log(`\n⚠️  Reached maximum iterations (${opts.maxIterations})`);
                    console.log(`   Best result saved, but quality thresholds not fully met.\n`);
                }
            }

        } catch (error) {
            stopReason = 'error';
            errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`\n❌ Error: ${errorMessage}\n`);
        }

        // Prepare final result
        const lastIteration = iterations[iterations.length - 1];
        const executionTimeMs = Date.now() - startTime;

        const result: RecreateWebsiteResult = {
            success: stopReason === 'success',
            finalHTML,
            iterations,
            totalIterations: iterations.length,
            runId: opts.runId,
            artifacts: {
                targetScreenshot: path.join(opts.outputDirs.screenshots, `${opts.runId}_target.png`),
                finalRecreationScreenshot: lastIteration?.screenshotPath ?? '',
                finalDiffImage: lastIteration?.pixelDiff.diffImagePath ?? '',
                recreatedWebsite: path.join(recreatedDir, 'index.html'),
                runDirectory: runDir,
                summaryFile: path.join(runDir, 'summary.json')
            },
            finalScores: {
                pixelDiff: lastIteration?.pixelDiff.score ?? 0,
                vision: lastIteration?.vision.score ?? 0
            },
            executionTimeMs,
            stopReason,
            errorMessage
        };

        // Save summary
        await fs.writeFile(
            result.artifacts.summaryFile,
            JSON.stringify(result, null, 2)
        );

        console.log(`\n${'='.repeat(60)}`);
        console.log(`   FINAL RESULTS`);
        console.log(`${'='.repeat(60)}`);
        console.log(`   Status: ${result.success ? '✓ SUCCESS' : '✗ NOT FULLY MATCHED'}`);
        console.log(`   Iterations: ${result.totalIterations}`);
        console.log(`   Final Pixel Diff Score: ${result.finalScores.pixelDiff}%`);
        console.log(`   Final Vision Score: ${result.finalScores.vision}%`);
        console.log(`   Execution Time: ${(executionTimeMs / 1000).toFixed(1)}s`);
        console.log(`   Run Directory: ${runDir}`);
        console.log(`   Summary: ${result.artifacts.summaryFile}`);
        console.log(`${'='.repeat(60)}\n`);

        return result;
    }

    /**
     * Screenshot HTML content by serving it locally
     */
    private async screenshotHTML(
        html: string,
        viewport: { width: number; height: number },
        outputPath: string
    ): Promise<string> {
        let browser: Browser | null = null;

        try {
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext({ viewport });
            const page = await context.newPage();

            // Load HTML directly (data URL)
            const dataUrl = `data:text/html;base64,${Buffer.from(html).toString('base64')}`;
            await page.goto(dataUrl, { waitUntil: 'load' });

            // Wait for any dynamic content
            await page.waitForTimeout(1000);

            // Take screenshot
            const buffer = await page.screenshot({ type: 'png', fullPage: false });
            await fs.writeFile(outputPath, buffer);

            await browser.close();
            return outputPath;
        } catch (error) {
            if (browser) await browser.close();
            throw error;
        }
    }

    /**
     * Format UI critique into revision context for next iteration
     */
    private formatCritiqueForRevision(critique: RecreationIteration['critique']): string {
        if (!critique || critique.totalIssues === 0) {
            return 'Previous iteration had no specific issues identified.';
        }

        let context = `ISSUES TO FIX (${critique.totalIssues} total):\n\n`;
        context += `Summary: ${critique.summary}\n\n`;

        critique.items.forEach((item, idx) => {
            context += `${idx + 1}. [${item.priority.toUpperCase()}] ${item.element}\n`;
            context += `   Category: ${item.category}\n`;
            context += `   Issue: ${item.issue}\n`;
            context += `   Expected: ${item.expected}\n`;
            context += `   Actual: ${item.actual}\n\n`;
        });

        return context;
    }

    /**
     * Generate a unique run ID
     */
    private generateRunId(): string {
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
        return `${timestamp}_recreation`;
    }
}

/**
 * Convenience function to recreate a website
 */
export async function recreateWebsite(
    url: string,
    options?: RecreateWebsiteOptions
): Promise<RecreateWebsiteResult> {
    const service = new WebsiteRecreationService();
    return service.recreateWebsite(url, options);
}
