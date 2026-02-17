# ComfyUI Start Script for AMD GPU (DirectML)
# Run this to start ComfyUI server
# Location: C:\AI\ComfyUI\scripts\start_comfyui.ps1

Write-Host "=== Starting ComfyUI with DirectML ===" -ForegroundColor Cyan

# Navigate to ComfyUI directory
Set-Location "C:\AI\ComfyUI"

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Green
.\venv\Scripts\Activate.ps1

# Check if main.py exists
if (-not (Test-Path "main.py")) {
    Write-Host ""
    Write-Host "ERROR: main.py not found in C:\AI\ComfyUI" -ForegroundColor Red
    Write-Host "Did you clone the ComfyUI repository?" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix, run:" -ForegroundColor Yellow
    Write-Host "  cd C:\AI\ComfyUI" -ForegroundColor Yellow
    Write-Host "  git clone https://github.com/comfyanonymous/ComfyUI.git ." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if any model exists in checkpoints
$checkpointFiles = Get-ChildItem -Path "models\checkpoints" -Filter "*.safetensors" -ErrorAction SilentlyContinue
if ($checkpointFiles.Count -eq 0) {
    Write-Host ""
    Write-Host "WARNING: No .safetensors models found in models\checkpoints\" -ForegroundColor Yellow
    Write-Host "ComfyUI will start but you won't be able to generate images." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Download SDXL model:" -ForegroundColor Cyan
    Write-Host "  https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Place the .safetensors file in:" -ForegroundColor Cyan
    Write-Host "  C:\AI\ComfyUI\models\checkpoints\" -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Display system info
Write-Host ""
Write-Host "=== System Configuration ===" -ForegroundColor Cyan
Write-Host "GPU: AMD RX 6650 XT (DirectML)" -ForegroundColor Green
Write-Host "Python: $(python --version 2>&1)" -ForegroundColor Green
Write-Host "Working Directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Start ComfyUI with DirectML backend
Write-Host "Launching ComfyUI..." -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  ComfyUI Web Interface" -ForegroundColor Yellow
Write-Host "  URL: http://127.0.0.1:8188" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Launch with DirectML support
python main.py --directml
