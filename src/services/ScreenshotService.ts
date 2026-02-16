import { chromium, Browser, Page } from 'playwright';
import { ScreenshotMetadata, ViewportDimensions, ScreenshotUtils } from '../utils/ScreenshotUtils.js';

export interface ScreenshotOptions {
    url: string;
    viewport: ViewportDimensions;
    fullPage: boolean;
    selector: string | null;
    waitMs: number;
    disableAnimations: boolean;
}

export interface ScreenshotResult {
    buffer: Buffer;
    metadata: ScreenshotMetadata;
}

export class ScreenshotService {
    private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    /**
     * Capture a screenshot with the given options
     */
    async captureScreenshot(options: ScreenshotOptions): Promise<ScreenshotResult> {
        let browser: Browser | null = null;
        let page: Page | null = null;

        try {
            // Launch browser
            browser = await chromium.launch({
                headless: true,
                args: [
                    '--disable-gpu',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                ],
            });

            // Create context with custom user agent and viewport
            const context = await browser.newContext({
                userAgent: this.userAgent,
                viewport: options.viewport,
                deviceScaleFactor: 1,
            });

            page = await context.newPage();

            // Navigate to URL with load event (more practical than networkidle)
            console.log(`📡 Navigating to: ${options.url}`);
            const response = await page.goto(options.url, {
                waitUntil: 'load', // Wait for load event, not all network connections
                timeout: 60000, // 60 second timeout for navigation
            });

            if (!response) {
                throw new Error('Failed to load page: No response received');
            }

            if (!response.ok() && response.status() !== 304) {
                console.warn(`⚠️  Warning: Page returned status ${response.status()}`);
            }

            // Get final URL (after redirects)
            const finalUrl = page.url();
            console.log(`✓ Loaded: ${finalUrl}`);

            // Disable animations if requested
            if (options.disableAnimations) {
                await page.addStyleTag({ content: ScreenshotUtils.getDisableAnimationsCSS() });
                console.log('✓ Animations disabled');
            }

            // Additional wait time
            if (options.waitMs > 0) {
                console.log(`⏳ Waiting ${options.waitMs}ms for page to stabilize...`);
                await page.waitForTimeout(options.waitMs);
            }

            // Capture screenshot
            let screenshotBuffer: Buffer;

            if (options.selector) {
                // Screenshot specific element
                console.log(`📸 Capturing element: ${options.selector}`);
                
                const element = await page.$(options.selector);
                if (!element) {
                    throw new Error(`Element not found: ${options.selector}`);
                }

                const buffer = await element.screenshot({ type: 'png' });
                screenshotBuffer = Buffer.from(buffer);
            } else if (options.fullPage) {
                // Full page screenshot
                console.log('📸 Capturing full page...');
                const buffer = await page.screenshot({ 
                    type: 'png', 
                    fullPage: true 
                });
                screenshotBuffer = Buffer.from(buffer);
            } else {
                // Viewport screenshot
                console.log('📸 Capturing viewport...');
                const buffer = await page.screenshot({ 
                    type: 'png', 
                    fullPage: false 
                });
                screenshotBuffer = Buffer.from(buffer);
            }

            // Build metadata
            const metadata: ScreenshotMetadata = {
                url: options.url,
                finalUrl: finalUrl,
                timestamp: new Date().toISOString(),
                viewport: options.viewport,
                fullPage: options.fullPage,
                selector: options.selector,
                waitMs: options.waitMs,
                userAgent: this.userAgent,
            };

            console.log(`✓ Screenshot captured (${(screenshotBuffer.length / 1024).toFixed(2)} KB)`);

            return {
                buffer: screenshotBuffer,
                metadata,
            };
        } catch (error: any) {
            // Categorize errors for better user experience
            if (error.message?.includes('net::ERR_NAME_NOT_RESOLVED')) {
                throw new Error(`Could not resolve domain. Check if the URL is correct: ${options.url}`);
            }
            if (error.message?.includes('net::ERR_CONNECTION_REFUSED')) {
                throw new Error(`Connection refused. The server may be down: ${options.url}`);
            }
            if (error.message?.includes('net::ERR_CONNECTION_TIMED_OUT')) {
                throw new Error(`Connection timed out. The server may be slow or unreachable: ${options.url}`);
            }
            if (error.message?.includes('Timeout')) {
                throw new Error(`Navigation timeout. The page took too long to load: ${options.url}`);
            }
            if (error.message?.includes('Element not found')) {
                throw error; // Already well-formatted
            }

            throw new Error(`Screenshot capture failed: ${error.message}`);
        } finally {
            // Clean up resources
            if (page) {
                try {
                    await page.close();
                } catch {
                    // Ignore cleanup errors
                }
            }
            if (browser) {
                try {
                    await browser.close();
                } catch {
                    // Ignore cleanup errors
                }
            }
        }
    }

    /**
     * Set custom user agent (for testing or customization)
     */
    setUserAgent(userAgent: string): void {
        this.userAgent = userAgent;
    }
}
