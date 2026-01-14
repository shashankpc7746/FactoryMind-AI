# FactoryMind AI - Start Frontend Development Server
# This script starts the Vite development server

Write-Host "🚀 Starting FactoryMind AI Frontend..." -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "❌ node_modules not found!" -ForegroundColor Red
    Write-Host "Please run: npm install" -ForegroundColor Yellow
    exit 1
}

# Check if backend is running
Write-Host "🔍 Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✅ Backend is running!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend not detected on http://localhost:8000" -ForegroundColor Yellow
    Write-Host "Make sure to start the backend first using start-backend.ps1" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue anyway or Ctrl+C to exit"
}

# Start frontend
Write-Host ""
Write-Host "🌐 Starting Vite development server..." -ForegroundColor Green
Write-Host "Frontend will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev
