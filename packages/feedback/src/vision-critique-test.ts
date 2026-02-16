#!/usr/bin/env node
/**
 * Test script for vision-based UI critique feature
 * Demonstrates supplementary vision analysis with pixel diff as primary signal
 */

import { runFeedback } from './index.js';
import { PNG } from 'pngjs';
import fs from 'fs/promises';

async function createTestImage(
    filename: string,
    variant: 'target' | 'candidate'
): Promise<void> {
    const width = 400;
    const height = 300;
    const png = new PNG({ width, height });
    
    // White background
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (width * y + x) << 2;
            png.data[idx] = 255;
            png.data[idx + 1] = 255;
            png.data[idx + 2] = 255;
            png.data[idx + 3] = 255;
        }
    }
    
    // Header bar (different height for candidate)
    const headerHeight = variant === 'candidate' ? 52 : 60;
    for (let y = 0; y < headerHeight; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (width * y + x) << 2;
            png.data[idx] = 51;  // Dark gray header
            png.data[idx + 1] = 51;
            png.data[idx + 2] = 51;
            png.data[idx + 3] = 255;
        }
    }
    
    // Button (different position and size for candidate)
    const buttonTop = variant === 'candidate' ? 120 : 100;
    const buttonLeft = variant === 'candidate' ? 55 : 50;
    const buttonWidth = variant === 'candidate' ? 110 : 120;
    const buttonHeight = variant === 'candidate' ? 35 : 40;
    const buttonRadius = variant === 'candidate' ? 4 : 8; // Different border radius
    
    for (let y = buttonTop; y < buttonTop + buttonHeight; y++) {
        for (let x = buttonLeft; x < buttonLeft + buttonWidth; x++) {
            const idx = (width * y + x) << 2;
            // Blue button (slightly different shade for candidate)
            png.data[idx] = variant === 'candidate' ? 45 : 37;
            png.data[idx + 1] = variant === 'candidate' ? 115 : 99;
            png.data[idx + 2] = variant === 'candidate' ? 210 : 235;
            png.data[idx + 3] = 255;
        }
    }
    
    // Text box (different padding for candidate)
    const textBoxTop = 200;
    const textBoxLeft = variant === 'candidate' ? 48 : 50; // Less padding
    const textBoxWidth = variant === 'candidate' ? 304 : 300;
    const textBoxHeight = 50;
    
    for (let y = textBoxTop; y < textBoxTop + textBoxHeight; y++) {
        for (let x = textBoxLeft; x < textBoxLeft + textBoxWidth; x++) {
            const idx = (width * y + x) << 2;
            png.data[idx] = 240; // Light gray
            png.data[idx + 1] = 240;
            png.data[idx + 2] = 240;
            png.data[idx + 3] = 255;
        }
    }
    
    await fs.mkdir('.test-images', { recursive: true });
    await fs.writeFile(filename, PNG.sync.write(png));
}

async function visionCritiqueTest() {
    console.log('🔍 Vision-Based UI Critique Test\n');
    console.log('Demonstrating supplementary vision analysis with pixel diff\n');
    console.log('='.repeat(70) + '\n');
    
    try {
        // Check if GEMINI_API_KEY is available
        if (!process.env.GEMINI_API_KEY) {
            console.log('⚠️  GEMINI_API_KEY not found in environment.');
            console.log('   Vision critique requires Gemini API access.');
            console.log('   Pixel diff will still work without it.\n');
            console.log('To test vision critique:');
            console.log('1. Get a Gemini API key from https://makersuite.google.com/app/apikey');
            console.log('2. Add to .env file: GEMINI_API_KEY=your_key_here');
            console.log('3. Run this test again\n');
            process.exit(0);
        }
        
        // Create test images with intentional UI differences
        console.log('1️⃣  Creating test images with UI differences...');
        await createTestImage('.test-images/vision-target.png', 'target');
        await createTestImage('.test-images/vision-candidate.png', 'candidate');
        console.log('   ✅ Created images with differences in:');
        console.log('      • Header height (60px vs 52px)');
        console.log('      • Button position, size, color, border-radius');
        console.log('      • Text box padding\n');
        
        // Test 1: Pixel diff only (fast, no API)
        console.log('2️⃣  Running pixel diff only (baseline)...\n');
        const pixelOnlyResult = await runFeedback(
            'Compare UI component implementation',
            {
                targetImagePath: '.test-images/vision-target.png',
                candidateImagePath: '.test-images/vision-candidate.png',
                usePixelDiff: true,
                passThreshold: 92,
                includeVisionCritique: false, // No vision critique
                slug: 'vision-test-pixel-only'
            }
        );
        
        console.log(`   Pass:             ${pixelOnlyResult.pass ? '✅ YES' : '❌ NO'}`);
        console.log(`   Score:            ${pixelOnlyResult.score.toFixed(2)}/100`);
        console.log(`   Mismatch:         ${pixelOnlyResult.mismatchPercent?.toFixed(2)}%`);
        console.log(`   Method:           ${pixelOnlyResult.method}`);
        console.log(`   Vision Critique:  ${pixelOnlyResult.visionCritique ? 'YES' : 'NO'}\n`);
        
        // Test 2: Pixel diff + Vision critique (comprehensive)
        console.log('3️⃣  Running pixel diff + vision critique...\n');
        console.log('   🌐 Calling Gemini Vision API (this may take 10-20 seconds)...\n');
        
        const fullResult = await runFeedback(
            'Compare UI component implementation',
            {
                targetImagePath: '.test-images/vision-target.png',
                candidateImagePath: '.test-images/vision-candidate.png',
                usePixelDiff: true,
                passThreshold: 92,
                includeVisionCritique: true, // Enable vision critique
                visionContext: 'Web application header and button styling',
                slug: 'vision-test-full'
            }
        );
        
        console.log(`   Pass:             ${fullResult.pass ? '✅ YES' : '❌ NO'}`);
        console.log(`   Score:            ${fullResult.score.toFixed(2)}/100`);
        console.log(`   Mismatch:         ${fullResult.mismatchPercent?.toFixed(2)}%`);
        console.log(`   Method:           ${fullResult.method}`);
        console.log(`   Vision Critique:  ${fullResult.visionCritique ? 'YES ✅' : 'NO'}`);
        
        if (fullResult.visionCritiqueError) {
            console.log(`   Critique Error:   ${fullResult.visionCritiqueError}\n`);
        }
        
        if (fullResult.visionCritique) {
            console.log(`   Total Issues:     ${fullResult.visionCritique.totalIssues}\n`);
            
            console.log('4️⃣  Vision Critique Details:\n');
            console.log(`   Summary: ${fullResult.visionCritique.summary}\n`);
            
            // Display prioritized punch list
            const priorities = ['critical', 'high', 'medium', 'low'] as const;
            for (const priority of priorities) {
                const items = fullResult.visionCritique.items.filter(
                    item => item.priority === priority
                );
                if (items.length > 0) {
                    const icon = priority === 'critical' ? '🔴' : 
                                 priority === 'high' ? '🟠' : 
                                 priority === 'medium' ? '🟡' : '🟢';
                    console.log(`   ${icon} ${priority.toUpperCase()} Priority (${items.length} items):`);
                    console.log('');
                    
                    items.forEach((item, index) => {
                        console.log(`   ${index + 1}. ${item.element} [${item.category}]`);
                        console.log(`      Issue:    ${item.issue}`);
                        console.log(`      Expected: ${item.expected}`);
                        console.log(`      Actual:   ${item.actual}`);
                        console.log('');
                    });
                }
            }
        }
        
        console.log('='.repeat(70) + '\n');
        console.log('✨ Vision critique test completed!\n');
        console.log('📂 Generated files:');
        console.log(`   • Pixel only:     ${pixelOnlyResult.path}`);
        console.log(`   • With critique:  ${fullResult.path}`);
        console.log(`   • Diff images:    ${pixelOnlyResult.diffImagePath}`);
        console.log('');
        console.log('💡 Key Points:');
        console.log('   • Pixel diff determines PASS/FAIL (objective measurement)');
        console.log('   • Vision critique provides actionable UI fix list (supplementary)');
        console.log('   • Vision failures do NOT affect pixel diff results');
        console.log('   • Critique includes specific CSS-like values and measurements');
        console.log('   • Prioritized by visual impact for efficient fixing');
        
    } catch (error) {
        console.error('❌ Error during vision critique test:');
        console.error(error);
        process.exit(1);
    }
}

visionCritiqueTest();
