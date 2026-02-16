import { Command } from '@cli-ai-toolkit/core';
import { takeScreenshot } from '@cli-ai-toolkit/screenshot';
import { ScreenshotUtils } from '@cli-ai-toolkit/screenshot';

export class ScreenshotCommand implements Command {
    name = 'screenshot';

    async execute(options: any): Promise<void> {
        try {
            // Extract URL from arguments
            const url = options.url || options.args?.[0];
            
            if (!url) {
                console.error('❌ URL argument is required.');
                console.log('\nUsage: cli-ai-toolkit screenshot "<url>" [options]');
                console.log('\nOptions:');
                console.log('  --full                 Full page screenshot (default)');
                console.log('  --viewport-only        Capture only viewport instead of full page');
                console.log('  --selector "<css>"     Screenshot specific element');
                console.log('  --wait <ms>            Additional wait after load (default: 1500)');
                console.log('  --viewport "<w>x<h>"   Viewport size (default: 1440x900)');
                console.log('  --no-animations        Disable CSS animations');
                console.log('  --out "<dir>"          Output directory (default: images/screenshots)');
                process.exit(1);
            }

            // Parse options
            const viewportOnly = options.options?.viewportOnly || false;
            const full = viewportOnly ? false : (options.options?.full !== undefined ? options.options.full : true);
            const selector = options.options?.selector || null;
            const waitMs = options.options?.wait ? 
                ScreenshotUtils.validateWaitMs(options.options.wait) : 1500;
            const viewportStr = options.options?.viewport || '1440x900';
            const disableAnimations = options.options?.noAnimations || false;
            const outputDir = options.options?.out || 'images/screenshots';

            // Parse viewport
            let viewport;
            try {
                viewport = ScreenshotUtils.parseViewport(viewportStr);
            } catch (error: any) {
                console.error(`❌ ${error.message}`);
                process.exit(1);
            }

            // Validate selector if provided
            if (selector && typeof selector !== 'string') {
                console.error('❌ Selector must be a string');
                process.exit(1);
            }

            // Print configuration
            console.log('\n🖼️  Screenshot Configuration:');
            console.log(`   URL: ${url}`);
            console.log(`   Viewport: ${viewport.width}x${viewport.height}`);
            console.log(`   Mode: ${selector ? `Element (${selector})` : full ? 'Full Page' : 'Viewport'}`);
            console.log(`   Wait: ${waitMs}ms`);
            console.log(`   Animations: ${disableAnimations ? 'Disabled' : 'Enabled'}`);
            console.log(`   Output: ${outputDir}\n`);

            // Take screenshot using library API
            const { pngPath, metaPath } = await takeScreenshot(url, {
                viewport,
                fullPage: full,
                selector,
                waitMs,
                disableAnimations,
                outputDir,
            });

            // Print success
            console.log('\n✅ Screenshot captured successfully!\n');
            console.log(`Saved to: ${pngPath}`);
            console.log(`Saved metadata to: ${metaPath}\n`);
        } catch (error: any) {
            // Handle errors with clear messages
            if (error.message?.includes('Failed to save screenshot files')) {
                console.error(`\n❌ ${error.message}`);
                console.log('\n💡 Troubleshooting:');
                console.log('   • Check disk space');
                console.log('   • Verify write permissions for the output directory');
            } else if (error.message?.includes('Could not resolve domain')) {
                console.error(`\n❌ ${error.message}`);
                console.log('\n💡 Check if:');
                console.log('   • The domain name is spelled correctly');
                console.log('   • You have an internet connection');
            } else if (error.message?.includes('Connection')) {
                console.error(`\n❌ ${error.message}`);
                console.log('\n💡 The website may be:');
                console.log('   • Temporarily down');
                console.log('   • Blocking automated access');
                console.log('   • Behind a firewall');
            } else if (error.message?.includes('Element not found')) {
                console.error(`\n❌ ${error.message}`);
                console.log('\n💡 Tips:');
                console.log('   • Check if the CSS selector is correct');
                console.log('   • The element might load dynamically (increase --wait)');
                console.log('   • Try inspecting the page in a browser first');
            } else if (error.message?.includes('Playwright')) {
                console.error(`\n❌ Playwright error: ${error.message}`);
                console.log('\n💡 Make sure Playwright is installed:');
                console.log('   npm install playwright');
                console.log('   npx playwright install chromium');
            } else {
                console.error(`\n❌ Screenshot failed: ${error.message}`);
            }
            
            if (process.env.DEBUG) {
                console.error('\nStack trace:', error.stack);
            }
            
            process.exit(1);
        }
    }
}
