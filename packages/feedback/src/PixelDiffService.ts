import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs/promises';
import path from 'path';

export interface PixelDiffConfig {
    passThreshold?: number; // Minimum score to pass (default: 92)
    diffOutputDir?: string; // Directory for diff images (default: images/diffs)
}

export interface PixelDiffResult {
    pass: boolean;
    score: number;
    mismatchPercent: number;
    mismatchPixels: number;
    totalPixels: number;
    notes: string;
    diffImagePath: string;
}

export class PixelDiffService {
    private config: Required<PixelDiffConfig>;

    constructor(config: PixelDiffConfig = {}) {
        this.config = {
            passThreshold: config.passThreshold ?? 92,
            diffOutputDir: config.diffOutputDir ?? 'images/diffs'
        };
    }

    /**
     * Compare two PNG images pixel-by-pixel
     * @param targetImagePath - Path to the reference/target image
     * @param candidateImagePath - Path to the candidate image
     * @param slug - Optional slug for naming the diff image
     * @returns Detailed comparison result with metrics and diff image
     */
    async compareImages(
        targetImagePath: string,
        candidateImagePath: string,
        slug?: string
    ): Promise<PixelDiffResult> {
        // Load images
        const targetBuffer = await fs.readFile(targetImagePath);
        const candidateBuffer = await fs.readFile(candidateImagePath);

        const targetPNG = PNG.sync.read(targetBuffer);
        const candidatePNG = PNG.sync.read(candidateBuffer);

        // Validate dimensions match
        if (targetPNG.width !== candidatePNG.width || targetPNG.height !== candidatePNG.height) {
            throw new Error(
                `Image dimensions do not match: target (${targetPNG.width}x${targetPNG.height}) ` +
                `vs candidate (${candidatePNG.width}x${candidatePNG.height})`
            );
        }

        const { width, height } = targetPNG;
        const totalPixels = width * height;

        // Create diff image
        const diff = new PNG({ width, height });

        // Run pixelmatch
        const mismatchPixels = pixelmatch(
            targetPNG.data,
            candidatePNG.data,
            diff.data,
            width,
            height,
            {
                threshold: 0.1, // Sensitivity (0.0 = strict, 1.0 = loose)
                includeAA: true, // Include anti-aliased pixels
                alpha: 0.1, // Alpha blend
                aaColor: [255, 255, 0], // Yellow for AA differences
                diffColor: [255, 0, 0], // Red for differences
                diffColorAlt: [0, 255, 0] // Green for differences (alternate)
            }
        );

        // Calculate metrics
        const mismatchPercent = (mismatchPixels / totalPixels) * 100;
        const score = Math.max(0, Math.min(100, 100 - mismatchPercent));
        const pass = score >= this.config.passThreshold;

        // Generate human-readable notes
        const notes = this.generateNotes(mismatchPercent, score, pass);

        // Save diff image
        const diffImagePath = await this.saveDiffImage(diff, slug);

        return {
            pass,
            score: Math.round(score * 100) / 100, // Round to 2 decimal places
            mismatchPercent: Math.round(mismatchPercent * 100) / 100,
            mismatchPixels,
            totalPixels,
            notes,
            diffImagePath
        };
    }

    /**
     * Generate context-aware notes based on mismatch level
     */
    private generateNotes(mismatchPercent: number, score: number, pass: boolean): string {
        let notes = '';

        if (mismatchPercent === 0) {
            notes = '✅ Perfect match! The images are pixel-identical.';
        } else if (mismatchPercent < 1) {
            notes = `✅ Excellent match (${mismatchPercent.toFixed(2)}% difference). ` +
                'Minor differences detected, likely due to:\n' +
                '  • Slight anti-aliasing variations\n' +
                '  • Sub-pixel rendering differences\n' +
                '  • Negligible color variations';
        } else if (mismatchPercent < 5) {
            notes = `${pass ? '✅' : '⚠️'} Good match (${mismatchPercent.toFixed(2)}% difference). ` +
                'Some differences detected, possibly from:\n' +
                '  • Font rendering variations\n' +
                '  • Minor spacing adjustments\n' +
                '  • Small color or contrast differences';
        } else if (mismatchPercent < 15) {
            notes = `⚠️ Moderate differences (${mismatchPercent.toFixed(2)}% difference). ` +
                'Notable variations likely caused by:\n' +
                '  • Layout shifts or spacing changes\n' +
                '  • Different font weights or sizes\n' +
                '  • Color scheme variations\n' +
                '  • Missing or added UI elements';
        } else if (mismatchPercent < 40) {
            notes = `❌ Significant differences (${mismatchPercent.toFixed(2)}% difference). ` +
                'Major variations detected:\n' +
                '  • Structural layout changes\n' +
                '  • Different content or elements\n' +
                '  • Major styling differences\n' +
                '  • Possible incorrect screenshot';
        } else {
            notes = `❌ Very high mismatch (${mismatchPercent.toFixed(2)}% difference). ` +
                'The images appear substantially different:\n' +
                '  • Completely different layouts or content\n' +
                '  • Wrong page or screenshot captured\n' +
                '  • Major rendering failure\n' +
                '  • Images may be from different sources';
        }

        notes += `\n\n**Objective Score:** ${score.toFixed(2)}/100`;
        notes += `\n**Pass Threshold:** ${this.config.passThreshold}`;
        notes += `\n**Status:** ${pass ? 'PASS ✅' : 'FAIL ❌'}`;

        return notes;
    }

    /**
     * Save the diff image with timestamp naming
     */
    private async saveDiffImage(diff: PNG, slug?: string): Promise<string> {
        // Ensure output directory exists
        await fs.mkdir(this.config.diffOutputDir, { recursive: true });

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const slugPart = slug ? `__${slug}` : '';
        const filename = `${timestamp}__diff${slugPart}.png`;
        const diffPath = path.join(this.config.diffOutputDir, filename);

        // Save diff image
        const buffer = PNG.sync.write(diff);
        await fs.writeFile(diffPath, buffer);

        return diffPath;
    }

    /**
     * Get the configured pass threshold
     */
    getPassThreshold(): number {
        return this.config.passThreshold;
    }

    /**
     * Update the pass threshold
     */
    setPassThreshold(threshold: number): void {
        if (threshold < 0 || threshold > 100) {
            throw new Error('Pass threshold must be between 0 and 100');
        }
        this.config.passThreshold = threshold;
    }
}
