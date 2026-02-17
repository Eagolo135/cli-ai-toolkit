# ComfyUI + SDXL Setup for AMD GPU (DirectML)

## Target System
- **GPU:** AMD RX 6650 XT
- **Backend:** DirectML (Windows Machine Learning)
- **Python:** 3.10.x (required for DirectML compatibility)
- **Location:** `C:\AI\ComfyUI`

---

## Prerequisites Check

Run these commands to check what's installed:

```powershell
# Check if Python 3.10 is installed
python --version

# Check if Git is installed
git --version

# Check if winget is available
winget --version
```

---

## Step 1: Install Prerequisites

### Option A: Using winget (Recommended)

```powershell
# Install Python 3.10 (if not already installed)
winget install Python.Python.3.10

# Install Git (if not already installed)
winget install Git.Git

# Restart PowerShell to refresh PATH
```

### Option B: Manual Installation

If winget is not available:

1. **Python 3.10:** Download from https://www.python.org/downloads/release/python-31011/
   - Choose "Windows installer (64-bit)"
   - ✅ Check "Add Python to PATH" during installation
   
2. **Git:** Download from https://git-scm.com/download/win
   - Use default installation options

**After installation, restart PowerShell and verify:**
```powershell
python --version  # Should show Python 3.10.x
git --version     # Should show git version
```

---

## Step 2: Create Directory Structure

**No admin required** (assuming you have write access to C:\)

```powershell
# Create base directory
New-Item -Path "C:\AI\ComfyUI" -ItemType Directory -Force

# Create subdirectories
New-Item -Path "C:\AI\ComfyUI\scripts" -ItemType Directory -Force
New-Item -Path "C:\AI\ComfyUI\models\checkpoints" -ItemType Directory -Force
New-Item -Path "C:\AI\ComfyUI\models\vae" -ItemType Directory -Force
New-Item -Path "C:\AI\ComfyUI\models\loras" -ItemType Directory -Force
New-Item -Path "C:\AI\ComfyUI\output" -ItemType Directory -Force

# Navigate to ComfyUI directory
cd C:\AI\ComfyUI
```

---

## Step 3: Clone ComfyUI Repository

```powershell
# Clone ComfyUI into current directory
git clone https://github.com/comfyanonymous/ComfyUI.git .

# Verify files exist
dir
# You should see: main.py, requirements.txt, comfy/, etc.
```

---

## Step 4: Create Setup Script

Create `C:\AI\ComfyUI\scripts\setup_comfyui.ps1` with the following content:

```powershell
# ComfyUI Setup Script for AMD GPU (DirectML)
# Run this once to set up the environment

Write-Host "=== ComfyUI + DirectML Setup for AMD GPU ===" -ForegroundColor Cyan
Write-Host ""

# Navigate to ComfyUI directory
Set-Location "C:\AI\ComfyUI"

# Check if Python 3.10 is available
$pythonVersion = python --version 2>&1
Write-Host "Python version: $pythonVersion" -ForegroundColor Yellow

if ($pythonVersion -notmatch "Python 3\.10") {
    Write-Host "WARNING: Python 3.10 is recommended for DirectML" -ForegroundColor Red
    Write-Host "You have: $pythonVersion" -ForegroundColor Red
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Create virtual environment
Write-Host ""
Write-Host "Creating virtual environment..." -ForegroundColor Green
python -m venv venv

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Green
.\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host ""
Write-Host "Upgrading pip..." -ForegroundColor Green
python -m pip install --upgrade pip

# Install torch-directml
Write-Host ""
Write-Host "Installing torch-directml for AMD GPU support..." -ForegroundColor Green
pip install torch-directml

# Install ComfyUI requirements
Write-Host ""
Write-Host "Installing ComfyUI requirements..." -ForegroundColor Green
pip install -r requirements.txt

# Verify installations
Write-Host ""
Write-Host "=== Installation Summary ===" -ForegroundColor Cyan
pip list | Select-String -Pattern "torch|numpy|pillow|directml"

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Download SDXL model from: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0"
Write-Host "2. Place sd_xl_base_1.0.safetensors in: C:\AI\ComfyUI\models\checkpoints\"
Write-Host "3. Run: .\scripts\start_comfyui.ps1"
Write-Host ""
```

---

## Step 5: Create Start Script

Create `C:\AI\ComfyUI\scripts\start_comfyui.ps1` with the following content:

```powershell
# ComfyUI Start Script for AMD GPU (DirectML)
# Run this to start ComfyUI server

Write-Host "=== Starting ComfyUI with DirectML ===" -ForegroundColor Cyan

# Navigate to ComfyUI directory
Set-Location "C:\AI\ComfyUI"

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Green
.\venv\Scripts\Activate.ps1

# Check if main.py exists
if (-not (Test-Path "main.py")) {
    Write-Host "ERROR: main.py not found in C:\AI\ComfyUI" -ForegroundColor Red
    Write-Host "Did you clone the repository?" -ForegroundColor Red
    exit 1
}

# Check if any model exists in checkpoints
$checkpointFiles = Get-ChildItem -Path "models\checkpoints" -Filter "*.safetensors" -ErrorAction SilentlyContinue
if ($checkpointFiles.Count -eq 0) {
    Write-Host ""
    Write-Host "WARNING: No .safetensors models found in models\checkpoints\" -ForegroundColor Yellow
    Write-Host "ComfyUI will start but you won't be able to generate images." -ForegroundColor Yellow
    Write-Host "Download SDXL from: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Start ComfyUI with DirectML backend
Write-Host ""
Write-Host "Launching ComfyUI..." -ForegroundColor Green
Write-Host "URL: http://127.0.0.1:8188" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

python main.py --directml
```

---

## Step 6: Run Setup

```powershell
# Navigate to ComfyUI
cd C:\AI\ComfyUI

# Run setup script (may take 5-10 minutes)
.\scripts\setup_comfyui.ps1
```

**Expected output:**
- Virtual environment created
- torch-directml installed (~300MB)
- ComfyUI dependencies installed
- Success message with next steps

---

## Step 7: Download SDXL Model

**Manual Download Required** (Model is ~6.9 GB)

1. **Go to:** https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/tree/main
2. **Download:** `sd_xl_base_1.0.safetensors`
3. **Place in:** `C:\AI\ComfyUI\models\checkpoints\`

**Alternative source:** https://civitai.com/models/101055/sd-xl

---

## Step 8: Start ComfyUI

```powershell
# Start the server
.\scripts\start_comfyui.ps1
```

**Expected output:**
```
Total VRAM 8192 MB, total RAM 32768 MB
pytorch version: 2.x.x
Set vram state to: NORMAL_VRAM
Device: privateuseone
VAE dtype: torch.float32
```

---

## Step 9: Verify Installation

Open browser to: **http://127.0.0.1:8188**

You should see the ComfyUI interface with:
- Node graph editor
- Load Checkpoint node
- CLIP Text Encode nodes
- KSampler node
- VAE Decode node
- Save Image node

**Test workflow:**
1. Click "Load Default" (if available)
2. In "Load Checkpoint" node, select `sd_xl_base_1.0.safetensors`
3. Enter a prompt in positive CLIP node: "a photograph of a cat"
4. Click "Queue Prompt"
5. Check `C:\AI\ComfyUI\output` for generated image

---

## Troubleshooting

### Issue 1: "torch-directml not found" or Import Errors

**Solution:**
```powershell
cd C:\AI\ComfyUI
.\venv\Scripts\Activate.ps1
pip uninstall torch torch-directml -y
pip install torch-directml
```

### Issue 2: "CUDA not available" warnings

**This is normal for AMD GPUs using DirectML.**
- DirectML uses `privateuseone` device, not CUDA
- Ignore CUDA warnings; focus on "Device: privateuseone" message

### Issue 3: Slow generation or OOM (Out of Memory)

**Solutions:**
1. **Reduce resolution:**
   - Change Empty Latent Image width/height to 512x512 or 768x768
   
2. **Enable low VRAM mode:**
   ```powershell
   python main.py --directml --lowvram
   ```

3. **Use CPU offload (slowest but works):**
   ```powershell
   python main.py --directml --cpu
   ```

### Issue 4: "Failed to initialize DirectML device"

**Solution:**
1. Update GPU drivers from AMD website
2. Update Windows to latest version (DirectML requires Win10 1903+ or Win11)
3. Check Device Manager → Display adapters → AMD Radeon RX 6650 XT is present
4. Reinstall torch-directml:
   ```powershell
   pip install --force-reinstall torch-directml
   ```

### Issue 5: ComfyUI won't start - "Port 8188 already in use"

**Solution:**
```powershell
# Find process using port 8188
Get-NetTCPConnection -LocalPort 8188 | Select-Object OwningProcess

# Kill the process (replace <PID> with the process ID)
Stop-Process -Id <PID> -Force

# Or use a different port
python main.py --directml --port 8189
```

### Issue 6: Virtual environment activation fails

**Error:** "Execution of scripts is disabled on this system"

**Solution (No admin needed):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then retry: `.\venv\Scripts\Activate.ps1`

---

## Performance Notes

### Expected Performance (RX 6650 XT)
- **SDXL 1024x1024:** ~45-90 seconds per image (20 steps)
- **VRAM Usage:** ~6-7 GB (ensure nothing else is using GPU)
- **First run slower:** Model loading takes extra time

### Optimization Tips
1. **Use SDXL Turbo:** Faster inference (4 steps instead of 20-50)
   - Download: https://huggingface.co/stabilityai/sdxl-turbo
   
2. **Keep ComfyUI running:** Reloading models is slow, keep server up

3. **Batch generation:** Queue multiple prompts at once

---

## Directory Structure (Final)

```
C:\AI\ComfyUI\
├── main.py                          # ComfyUI entry point
├── requirements.txt                 # Dependencies
├── venv\                            # Python virtual environment
├── scripts\
│   ├── setup_comfyui.ps1          # Setup script
│   └── start_comfyui.ps1          # Start script
├── models\
│   ├── checkpoints\                # Place SDXL models here
│   │   └── sd_xl_base_1.0.safetensors
│   ├── vae\                        # Optional VAE models
│   └── loras\                      # Optional LoRA models
├── output\                          # Generated images
├── input\                           # Input images (for img2img)
├── comfy\                           # ComfyUI core code
└── custom_nodes\                    # Custom extensions
```

---

## Quick Start Command Summary

```powershell
# One-time setup
cd C:\AI\ComfyUI
.\scripts\setup_comfyui.ps1

# Download SDXL model manually to:
# C:\AI\ComfyUI\models\checkpoints\sd_xl_base_1.0.safetensors

# Start ComfyUI
.\scripts\start_comfyui.ps1

# Open browser
start http://127.0.0.1:8188
```

---

## API Integration (Next Step)

Once ComfyUI is running, you can integrate it with your toolkit using the ComfyUI API:

- **API Endpoint:** http://127.0.0.1:8188
- **Submit Prompt:** POST `/prompt`
- **Get History:** GET `/history/{prompt_id}`
- **View Image:** GET `/view?filename={filename}`

See `packages/imagegen/src/services/ComfyUIService.ts` for implementation details.

---

## Resources

- **ComfyUI GitHub:** https://github.com/comfyanonymous/ComfyUI
- **ComfyUI Wiki:** https://github.com/comfyanonymous/ComfyUI/wiki
- **DirectML Docs:** https://learn.microsoft.com/en-us/windows/ai/directml/
- **SDXL Models:** https://huggingface.co/stabilityai
- **Community Workflows:** https://comfyworkflows.com/
