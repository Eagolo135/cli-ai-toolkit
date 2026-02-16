// Screenshot library exports
export { ScreenshotService, ScreenshotOptions, ScreenshotResult } from './ScreenshotService.js';
export { ScreenshotUtils, ScreenshotMetadata, ViewportDimensions } from './ScreenshotUtils.js';

// Public API for programmatic use
import { ScreenshotService } from './ScreenshotService.js';
import { ScreenshotUtils, ViewportDimensions } from './ScreenshotUtils.js';

export interface TakeScreenshotOptions {
    fullPage?: boolean;
    selector?: string;
    waitMs?: number;
    viewport?: ViewportDimensions;
    disableAnimations?: boolean;
    outputDir?: string;
}

/**
 * Take a screenshot of a website and save it to disk
 * @param url - The URL to screenshot
 * @param opts - Screenshot options
 * @returns Object with paths to the saved PNG and metadata JSON files
 */
export async function takeScreenshot(
    url: string,
    opts?: TakeScreenshotOptions
): Promise<{ pngPath: string; metaPath: string }> {
    const service = new ScreenshotService();
    
    // Defaults
    const viewport = opts?.viewport ?? { width: 1440, height: 900 };
    const fullPage = opts?.fullPage ?? true;
    const selector = opts?.selector ?? null;
    const waitMs = opts?.waitMs ?? 1500;
    const disableAnimations = opts?.disableAnimations ?? false;
    const outputDir = opts?.outputDir ?? 'images/screenshots';

    // Validate and normalize URL
    const validatedUrl = ScreenshotUtils.validateUrl(url);

    // Capture screenshot
    const { buffer, metadata } = await service.captureScreenshot({
        url: validatedUrl,
        viewport,
        fullPage,
        selector,
        waitMs,
        disableAnimations,
    });

    // Save files
    const { pngPath, jsonPath } = await ScreenshotUtils.saveScreenshotFiles(
        buffer,
        metadata,
        outputDir,
        validatedUrl
    );

    return { pngPath, metaPath: jsonPath };
}
