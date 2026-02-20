#!/usr/bin/env node
/**
 * Test script for ComfyUI image generation integration
 * Tests both ComfyUI connectivity and DALL-E fallback
 */

import { ComfyUIService } from './ComfyUIService.js';
import { ImageService } from './ImageService.js';
import { generateImage } from './index.js';

async function testComfyUI() {
    console.log('🎨 ComfyUI Integration Test\n');
    console.log('='.repeat(60) + '\n');
    
    try {
        // Test 1: Check if ComfyUI is running
        console.log('1️⃣  Checking ComfyUI connectivity...');
        const comfyui = new ComfyUIService();
        const isRunning = await comfyui.isRunning();
        
        if (isRunning) {
            console.log('   ✅ ComfyUI is running at http://127.0.0.1:8188\n');
            
            // Test 2: Check for available checkpoints
            console.log('2️⃣  Checking for SDXL model...');
            try {
                const response = await fetch('http://127.0.0.1:8188/object_info/CheckpointLoaderSimple');
                const data: any = await response.json();
                const checkpoints = data?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];
                
                if (checkpoints.length === 0) {
                    console.log('   ⚠️  No model checkpoints found');
                    console.log('   📥 Please download SDXL model:');
                    console.log('      URL: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/tree/main');
                    console.log('      File: sd_xl_base_1.0.safetensors (~6.9 GB)');
                    console.log('      Location: C:\\AI\\ComfyUI\\models\\checkpoints\\');
                    console.log('');
                } else {
                    console.log(`   ✅ Found ${checkpoints.length} checkpoint(s):`);
                    checkpoints.forEach((name: string, i: number) => {
                        const icon = name.toLowerCase().includes('xl') || name.toLowerCase().includes('sdxl') ? '⭐' : '  ';
                        console.log(`      ${icon} ${name}`);
                    });
                    console.log('');
                    
                    // Test 3: Generate a test image
                    console.log('3️⃣  Testing image generation...');
                    console.log('   Prompt: "a simple red circle on white background"');
                    console.log('   Size: 512x512 (fast test)');
                    console.log('   Estimated time: 30-90 seconds\n');
                    
                    const testPrompt = "a simple red circle on white background, minimalist";
                    
                    try {
                        const result = await generateImage(testPrompt, {
                            provider: 'comfyui',
                            width: 512,
                            height: 512,
                            steps: 20,
                            negativePrompt: 'complex, detailed, text'
                        });
                        
                        console.log(`\n   ✅ Image generated successfully!`);
                        console.log(`   📁 Saved to: ${result.path}`);
                        console.log(`   🎨 Provider: ${result.provider}\n`);
                    } catch (genError: any) {
                        console.error(`   ❌ Generation failed: ${genError.message}\n`);
                        
                        if (genError.message.includes('out of memory') || genError.message.includes('OOM')) {
                            console.log('   💡 GPU memory issue detected. Try:');
                            console.log('      • Restart ComfyUI: C:\\AI\\ComfyUI\\scripts\\start_comfyui.ps1');
                            console.log('      • Use smaller size: --size 512x512');
                            console.log('      • Close other GPU applications\n');
                        }
                    }
                }
            } catch (checkError: any) {
                console.error(`   ❌ Failed to check checkpoints: ${checkError.message}\n`);
            }
        } else {
            console.log('   ⚠️  ComfyUI is not running');
            console.log('   To start ComfyUI:');
            console.log('      1. Open PowerShell');
            console.log('      2. Run: C:\\AI\\ComfyUI\\scripts\\start_comfyui.ps1');
            console.log('      3. Wait for "http://127.0.0.1:8188" message');
            console.log('      4. Re-run this test\n');
            
            // Test DALL-E as fallback
            console.log('2️⃣  Testing DALL-E fallback...');
            
            try {
                // Just check if API key is present
                if (process.env.OPENAI_API_KEY) {
                    console.log('   ✅ OPENAI_API_KEY is configured');
                    console.log('   You can use --provider dalle as fallback\n');
                } else {
                    console.log('   ⚠️  OPENAI_API_KEY not found in environment');
                    console.log('   Add to .env for DALL-E support\n');
                }
            } catch (dalleError) {
                console.log('   ⚠️  DALL-E not available\n');
            }
        }
        
        console.log('='.repeat(60) + '\n');
        console.log('📋 Summary:\n');
        console.log(`ComfyUI Status:  ${isRunning ? '✅ Running' : '❌ Not Running'}`);
        console.log(`DALL-E Fallback: ${process.env.OPENAI_API_KEY ? '✅ Available' : '⚠️  Not Configured'}`);
        console.log('');
        
        if (!isRunning) {
            console.log('💡 Quick Start:');
            console.log('   1. Start ComfyUI: C:\\AI\\ComfyUI\\scripts\\start_comfyui.ps1');
            console.log('   2. Wait for server to start');
            console.log('   3. Download SDXL model if needed');
            console.log('   4. Generate images with:');
            console.log('      npx tsx src/index.ts image-generate "your prompt" --size 768x768');
            console.log('');
        } else {
            console.log('✅ System ready for image generation!');
            console.log('');
        }
        
    } catch (error: any) {
        console.error('❌ Test failed:');
        console.error(error);
        process.exit(1);
    }
}

testComfyUI();
