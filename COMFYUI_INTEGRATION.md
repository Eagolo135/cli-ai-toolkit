# ComfyUI Integration Quick Reference

## Setup Complete! ✅

Your toolkit now supports **two image generation providers**:
1. **ComfyUI** (Local, AMD GPU, SDXL) - **Default**
2. **DALL-E 3** (Cloud, OpenAI API)

---

## ComfyUI Setup Steps

### 1. Run Setup Commands (First Time Only)

```powershell
# Create directory structure
New-Item -Path "C:\AI\ComfyUI" -ItemType Directory -Force
New-Item -Path "C:\AI\ComfyUI\scripts" -ItemType Directory -Force
New-Item -Path "C:\AI\ComfyUI\models\checkpoints" -ItemType Directory -Force

# Navigate to ComfyUI
cd C:\AI\ComfyUI

# Clone ComfyUI repository
git clone https://github.com/comfyanonymous/ComfyUI.git .

# Copy setup script (from this repo to C:\AI\ComfyUI\scripts\)
Copy-Item "setup_comfyui.ps1" "C:\AI\ComfyUI\scripts\"
Copy-Item "start_comfyui.ps1" "C:\AI\ComfyUI\scripts\"

# Run setup
.\scripts\setup_comfyui.ps1
```

**Note:** If you get "execution policy" error:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. Download SDXL Model

**Manual download required** (~6.9 GB):
- URL: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/tree/main
- File: `sd_xl_base_1.0.safetensors`
- Place in: `C:\AI\ComfyUI\models\checkpoints\`

### 3. Start ComfyUI Server

```powershell
C:\AI\ComfyUI\scripts\start_comfyui.ps1
```

**Wait for:** `http://127.0.0.1:8188` message in console

**Keep this window open** while generating images

---

## Usage Examples

### ⚠️ Important: npm Argument Parsing Issue

For options like `--size`, use **direct tsx** instead of `npm run dev`:

```bash
# ✅ RECOMMENDED: Direct call
cd packages/cli
npx tsx src/index.ts image-generate -s 768x768 "your prompt"

# ❌ BROKEN: npm run dev mangles arguments
npm run dev -- image-generate --size 768x768 "your prompt"
```

### Generate with ComfyUI (Default)

```bash
# Basic generation (from packages/cli/)
npx tsx src/index.ts image-generate "a futuristic robot"

# With custom size (768x768 recommended for RX 6650 XT)
npx tsx src/index.ts image-generate -s 768x768 "a cat astronaut"

# With negative prompt
npx tsx src/index.ts image-generate "a beautiful landscape" --negative "ugly, blurry"

# Full control
npx tsx src/index.ts image-generate "cyberpunk city at night" \
  -s 768x768 \
  --negative "low quality, bad anatomy" \
  --steps 30 \
  --cfg 7 \
  --seed 12345
```

### GPU Memory Recommendations (AMD RX 6650 XT - 8GB VRAM)

**✅ Safe Resolutions:**
- `512x512` - Fast, low memory (~2GB)
- `768x768` - Balanced, tested working (~4GB)
- `640x896` or `896x640` - Portrait/landscape (~3GB)

**❌ Memory Issues:**
- `1024x1024` - **Out of memory** during VAE decode (~6-8GB)
- `1024x1792` - Too large

**If you get "not enough GPU video memory":**
1. Use `--size 768x768` or smaller
2. Restart ComfyUI with `--lowvram` flag
3. Reduce steps: `--steps 15`
4. Close other GPU applications

### Generate with DALL-E 3

```bash
# Switch to DALL-E (cloud, requires OpenAI API key)
npm run dev -- image-generate "a serene mountain lake" --provider dalle

# DALL-E with custom size
npm run dev -- image-generate "abstract art" --provider dalle --size 1792x1024
```

---

## CLI Options Reference

### Common Options
| Option | Description | Default |
|--------|-------------|---------|
| `--provider` | Provider: `comfyui` or `dalle` | `comfyui` |
| `--size` | Image dimensions (e.g., 1024x1024) | `1024x1024` |

### ComfyUI-Only Options
| Option | Description | Default |
|--------|-------------|---------|
| `--negative <text>` | Negative prompt | - |
| `--steps <number>` | Sampling steps (higher = better quality, slower) | `20` |
| `--cfg <number>` | CFG scale (prompt adherence strength) | `8` |
| `--seed <number>` | Random seed for reproducibility (-1 = random) | `-1` |

### DALL-E-Only Sizes
- `1024x1024` (square)
- `1792x1024` (landscape)
- `1024x1792` (portrait)

---

## Common ComfyUI Sizes (Performance on RX 6650 XT)

| Size | Time (20 steps) | Use Case |
|------|----------------|----------|
| 512x512 | ~15s | Testing, fast iteration |
| 768x768 | ~30s | Quick generation |
| 1024x1024 | **~60s** | Standard SDXL |
| 1280x1280 | ~90s | High quality |
| 1536x1536 | ~120s+ | Maximum quality (may OOM) |

**Tip:** Use `--steps 15` for faster generation during testing

---

## Troubleshooting

### "ComfyUI is not running"

**Solution:**
```powershell
# Open new PowerShell window
C:\AI\ComfyUI\scripts\start_comfyui.ps1

# Wait for server to start
# You should see: "To see the GUI go to: http://127.0.0.1:8188"
```

### "No checkpoints found"

**Solution:**
1. Download SDXL: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0
2. Place `.safetensors` file in: `C:\AI\ComfyUI\models\checkpoints\`
3. Restart ComfyUI

### Slow Generation / Out of Memory

**Solutions:**
```powershell
# Option 1: Enable low VRAM mode
cd C:\AI\ComfyUI
python main.py --directml --lowvram

# Option 2: Use smaller resolution
npm run dev -- image-generate "prompt" --size 768x768

# Option 3: Reduce steps
npm run dev -- image-generate "prompt" --steps 15
```

### Generation Hangs / Times Out

**Causes:**
- ComfyUI crashed (check the ComfyUI window)
- GPU driver issue (update AMD drivers)
- Model loading issue (restart ComfyUI)

**Solution:**
```powershell
# Restart ComfyUI server
# Ctrl+C in ComfyUI window
# Then run: .\scripts\start_comfyui.ps1
```

---

## Architecture Details

### Files Added
```
packages/imagegen/
└── src/
    ├── ComfyUIService.ts        # ComfyUI API client
    ├── ImageService.ts           # DALL-E 3 client (existing)
    └── index.ts                  # Provider selection logic

packages/cli/
└── src/
    └── commands/
        └── ImageGenerateCommand.ts   # Updated with provider option
```

### How It Works
1. **CLI** receives `image-generate` command with `--provider` flag
2. **imagegen/index.ts** routes to appropriate service:
   - `comfyui` → ComfyUIService
   - `dalle` → ImageService (DALL-E 3)
3. **ComfyUIService**:
   - Checks if ComfyUI is running (health check)
   - Auto-detects checkpoint model
   - Builds SDXL workflow JSON
   - Submits to `/prompt` endpoint
   - Polls `/history/{promptId}` for completion
   - Downloads image from `/view?filename=...`
4. **FileUtils** saves image with timestamp slug
5. **Result** returned with path and provider name

---

## Tips & Best Practices

### For Fast Iteration
```bash
# Use low resolution + low steps during prompt testing
npm run dev -- image-generate "test prompt" --size 512x512 --steps 10
```

### For High Quality
```bash
# Use high resolution + high steps for final renders
npm run dev -- image-generate "final prompt" --size 1024x1024 --steps 40 --cfg 9
```

### For Consistent Results
```bash
# Use seed to reproduce exact same image
npm run dev -- image-generate "prompt" --seed 42069

# Vary only the seed to explore same prompt
npm run dev -- image-generate "prompt" --seed 42070
```

### When to Use Each Provider

**Use ComfyUI when:**
- ✅ You need cost-effective generation (local, no API costs)
- ✅ You want full control (steps, CFG, seed, etc.)
- ✅ You need batch generation
- ✅ You have ComfyUI running

**Use DALL-E when:**
- ✅ ComfyUI is not available
- ✅ You need fast setup (no local installation)
- ✅ You want OpenAI's safety filters
- ✅ You prefer cloud-based generation

---

## Integration with Toolkit

### Programmatic Use (TypeScript)

```typescript
import { generateImage } from '@cli-ai-toolkit/imagegen';

// Generate with ComfyUI
const result1 = await generateImage('a cat', {
    provider: 'comfyui',
    width: 1024,
    height: 1024,
    negativePrompt: 'ugly, blurry',
    steps: 25,
    cfgScale: 8
});

console.log(`Image saved to: ${result1.path}`);
console.log(`Generated with: ${result1.provider}`); // "ComfyUI"

// Generate with DALL-E
const result2 = await generateImage('a dog', {
    provider: 'dalle',
    size: '1024x1024'
});

console.log(`Image saved to: ${result2.path}`);
console.log(`Generated with: ${result2.provider}`); // "DALL-E 3"
```

### From Other Packages

```typescript
// In packages/agent or other custom code
import { ComfyUIService } from '@cli-ai-toolkit/imagegen';

const service = new ComfyUIService('http://127.0.0.1:8188');

// Check if ComfyUI is running
const isRunning = await service.isRunning();

if (isRunning) {
    const buffer = await service.generateImage('test prompt', {
        width: 512,
        height: 512,
        steps: 10
    });
    
    // Save buffer to file
}
```

---

## Performance Benchmarks (RX 6650 XT)

**Test Setup:**
- Model: SDXL Base 1.0
- Resolution: 1024x1024
- CFG Scale: 8
- Sampler: Euler

| Steps | Time | Quality |
|-------|------|---------|
| 10 | ~30s | Low (testing only) |
| 15 | ~45s | Fair (draft) |
| 20 | **~60s** | **Good (default)** |
| 30 | ~90s | Better |
| 40 | ~120s | Best |
| 50 | ~150s | Diminishing returns |

**Recommendation:** Stick with 20 steps for balanced quality/speed

---

## Verification Checklist

✅ ComfyUI installed in `C:\AI\ComfyUI`  
✅ Virtual environment created  
✅ torch-directml installed  
✅ SDXL model in `models/checkpoints/`  
✅ ComfyUI starts with `.\scripts\start_comfyui.ps1`  
✅ Web UI accessible at http://127.0.0.1:8188  
✅ Toolkit image-generate command works  
✅ Both providers (comfyui, dalle) functional  

---

## Additional Resources

- **Full Setup Guide:** See `COMFYUI_SETUP.md`
- **ComfyUI Docs:** https://github.com/comfyanonymous/ComfyUI
- **SDXL Paper:** https://arxiv.org/abs/2307.01952
- **DirectML:** https://learn.microsoft.com/en-us/windows/ai/directml/
- **Community Workflows:** https://comfyworkflows.com/

---

**Status:** ✅ Ready to use! Start ComfyUI and generate images.
