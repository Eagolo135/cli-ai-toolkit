/**
 * Type definitions for Website Recreation Agent
 */

export interface RecreateWebsiteOptions {
    /** Maximum number of iterations to attempt (default: 6) */
    maxIterations?: number;
    
    /** Pass threshold for pixel diff comparison (0-100, default: 92) */
    pixelDiffThreshold?: number;
    
    /** Pass threshold for vision comparison (0-100, default: 85) */
    visionThreshold?: number;
    
    /** Viewport dimensions for screenshots (default: 1280x720) */
    viewport?: {
        width: number;
        height: number;
    };
    
    /** Additional wait time after page load in ms (default: 1000) */
    waitMs?: number;
    
    /** Custom run ID for organizing artifacts (auto-generated if not provided) */
    runId?: string;
    
    /** Output directories for artifacts */
    outputDirs?: {
        recreated?: string;   // Default: docs/recreated
        runs?: string;        // Default: references/runs
        screenshots?: string; // Default: images/screenshots
        diffs?: string;       // Default: images/diffs
    };
}

export interface RecreationIteration {
    /** Iteration number (1-based) */
    iteration: number;
    
    /** Generated HTML content */
    html: string;
    
    /** Path to recreation screenshot */
    screenshotPath: string;
    
    /** Pixel diff comparison result */
    pixelDiff: {
        pass: boolean;
        score: number;
        mismatchPercent: number;
        diffImagePath: string;
    };
    
    /** Vision comparison result */
    vision: {
        pass: boolean;
        score: number;
        notes: string;
    };
    
    /** UI critique (only generated if not passing) */
    critique?: {
        summary: string;
        totalIssues: number;
        items: Array<{
            priority: string;
            category: string;
            element: string;
            issue: string;
            expected: string;
            actual: string;
        }>;
    };
    
    /** Timestamp of this iteration */
    timestamp: string;
}

export interface RecreateWebsiteResult {
    /** Whether the recreation passed quality checks */
    success: boolean;
    
    /** Final HTML content */
    finalHTML: string;
    
    /** All iterations attempted */
    iterations: RecreationIteration[];
    
    /** Total number of iterations */
    totalIterations: number;
    
    /** Unique run ID for this recreation attempt */
    runId: string;
    
    /** Paths to key artifacts */
    artifacts: {
        targetScreenshot: string;
        finalRecreationScreenshot: string;
        finalDiffImage: string;
        recreatedWebsite: string;
        runDirectory: string;
        summaryFile: string;
    };
    
    /** Final scores */
    finalScores: {
        pixelDiff: number;
        vision: number;
    };
    
    /** Total execution time in milliseconds */
    executionTimeMs: number;
    
    /** Reason for stopping (success, max_iterations, error) */
    stopReason: 'success' | 'max_iterations' | 'error';
    
    /** Error message if stopReason is 'error' */
    errorMessage?: string | undefined;
}
