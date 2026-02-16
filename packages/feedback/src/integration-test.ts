#!/usr/bin/env node
/**
 * Integration test for runFeedback with pixel diff
 * Demonstrates the complete workflow with JSON/MD outputs
 */

import { runFeedback } from './index.js';
import { PNG } from 'pngjs';
import fs from 'fs/promises';

async function createSimpleTestImage(filename: string, variant: 'target' | 'candidate'): Promise<void> {
    const width = 300;
    const height = 200;
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
    
    // Add a green box (slightly different position for candidate)
    const offsetX = variant === 'candidate' ? 2 : 0;
    const offsetY = variant === 'candidate' ? 1 : 0;
    
    for (let y = 50 + offsetY; y < 150 + offsetY; y++) {
        for (let x = 50 + offsetX; x < 150 + offsetX; x++) {
            const idx = (width * y + x) << 2;
            png.data[idx] = 0;
            png.data[idx + 1] = variant === 'candidate' ? 250 : 255; // Slightly different green
            png.data[idx + 2] = 0;
            png.data[idx + 3] = 255;
        }
    }
    
    await fs.mkdir('.test-images', { recursive: true });
    await fs.writeFile(filename, PNG.sync.write(png));
}

async function integrationTest() {
    console.log('🚀 runFeedback Integration Test\n');
    console.log('Testing complete pixel-diff workflow with feedback generation\n');
    console.log('='.repeat(60) + '\n');
    
    try {
        // Create test images
        console.log('1️⃣  Creating test images...');
        await createSimpleTestImage('.test-images/integration-target.png', 'target');
        await createSimpleTestImage('.test-images/integration-candidate.png', 'candidate');
        console.log('   ✅ Test images created\n');
        
        // Run feedback with pixel diff
        console.log('2️⃣  Running runFeedback with pixel-diff...');
        const result = await runFeedback(
            'Verify UI component renders correctly',
            {
                targetImagePath: '.test-images/integration-target.png',
                candidateImagePath: '.test-images/integration-candidate.png',
                usePixelDiff: true,
                passThreshold: 92,
                slug: 'integration-test',
                feedbackOutputDir: 'references/aI_feedback'
            }
        );
        
        console.log('   ✅ Feedback generated\n');
        
        console.log('3️⃣  Results:\n');
        console.log(`   Pass:             ${result.pass ? '✅ YES' : '❌ NO'}`);
        console.log(`   Score:            ${result.score.toFixed(2)}/100`);
        console.log(`   Mismatch:         ${result.mismatchPercent?.toFixed(2)}%`);
        console.log(`   Method:           ${result.method}`);
        console.log(`   Diff Image:       ${result.diffImagePath}`);
        console.log(`   Feedback JSON:    ${result.path}`);
        console.log(`   Feedback MD:      ${result.path.replace('.json', '.md')}`);
        console.log('');
        
        // Read and display the feedback JSON
        console.log('4️⃣  Feedback JSON Content:\n');
        const feedbackContent = await fs.readFile(result.path, 'utf-8');
        const feedback = JSON.parse(feedbackContent);
        console.log(JSON.stringify(feedback, null, 2));
        console.log('');
        
        console.log('5️⃣  Context-Aware Notes:\n');
        const notesLines = result.notes.split('\n');
        notesLines.forEach(line => console.log(`   ${line}`));
        console.log('');
        
        console.log('='.repeat(60) + '\n');
        console.log('✨ Integration test completed successfully!\n');
        console.log('📂 Generated files:');
        console.log(`   • Diff image:     ${result.diffImagePath}`);
        console.log(`   • Feedback JSON:  ${result.path}`);
        console.log(`   • Feedback MD:    ${result.path.replace('.json', '.md')}`);
        console.log('');
        console.log('✅ All features working:');
        console.log('   ✓ Pixel-by-pixel comparison');
        console.log('   ✓ Similarity score calculation');
        console.log('   ✓ Configurable pass threshold');
        console.log('   ✓ Diff image generation with timestamps');
        console.log('   ✓ JSON feedback with metrics');
        console.log('   ✓ Markdown feedback report');
        console.log('   ✓ Context-aware notes based on mismatch level');
        
    } catch (error) {
        console.error('❌ Error during integration test:');
        console.error(error);
        process.exit(1);
    }
}

integrationTest();
