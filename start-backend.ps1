# FactoryMind AI - Start Backend Server
# This script activates the virtual environment and starts the FastAPI backend

Write-Host "🚀 Starting FactoryMind AI Backend..." -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists (supports both venv and fact-ai)
$venvPath = $null
if (Test-Path "fact-ai\Scripts\Activate.ps1") {
    $venvPath = "fact-ai\Scripts\Activate.ps1"
} elseif (Test-Path "venv\Scripts\Activate.ps1") {
    $venvPath = "venv\Scripts\Activate.ps1"
}

if (-Not $venvPath) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please run setup first:" -ForegroundColor Yellow
    Write-Host "  python -m venv fact-ai" -ForegroundColor Yellow
    Write-Host "  fact-ai\Scripts\activate" -ForegroundColor Yellow
    Write-Host "  pip install -r backend\requirements.txt" -ForegroundColor Yellow
    exit 1
}

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  Warning: .env file not found!" -ForegroundColor Yellow
    Write-Host "Please create .env from .env.example and add GROQ_API_KEY + HUGGINGFACE_API_KEY" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue anyway or Ctrl+C to exit"
}

# Activate virtual environment
Write-Host "📦 Activating virtual environment..." -ForegroundColor Green
& $venvPath

# Change to backend directory
Set-Location backend

# Start server
Write-Host ""
Write-Host "🌐 Starting FastAPI server on http://localhost:8000" -ForegroundColor Green
Write-Host "📚 API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

python main.py
