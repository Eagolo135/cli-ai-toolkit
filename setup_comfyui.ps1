# ComfyUI Setup Script for AMD GPU (DirectML)
# Run this once to set up the environment
# Location: C:\AI\ComfyUI\scripts\setup_comfyui.ps1

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
Write-Host "This may take 5-10 minutes (~300MB download)..." -ForegroundColor Yellow
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
Write-Host "Optional model sources:" -ForegroundColor Cyan
Write-Host "- CivitAI: https://civitai.com/models/101055/sd-xl"
Write-Host "- HuggingFace: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0"
Write-Host ""
