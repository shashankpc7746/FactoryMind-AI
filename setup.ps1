# FactoryMind AI - Complete Setup Script
# This script sets up both backend and frontend

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     FactoryMind AI - Installation & Setup Script      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Python
Write-Host "📋 Step 1: Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found! Please install Python 3.9 or higher" -ForegroundColor Red
    exit 1
}

# Step 2: Check Node.js
Write-Host ""
Write-Host "📋 Step 2: Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js 16 or higher" -ForegroundColor Red
    exit 1
}

# Step 3: Create .env file
Write-Host ""
Write-Host "📋 Step 3: Setting up environment configuration..." -ForegroundColor Yellow
if (-Not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Created .env file from template" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANT: Edit .env and add your OPENAI_API_KEY!" -ForegroundColor Yellow
        Write-Host "   Open .env in a text editor and replace 'your_openai_api_key_here'" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  .env.example not found, skipping..." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Step 4: Create frontend .env.local
if (-Not (Test-Path ".env.local")) {
    if (Test-Path ".env.local.example") {
        Copy-Item ".env.local.example" ".env.local"
        Write-Host "✅ Created .env.local file for frontend" -ForegroundColor Green
    }
}

# Step 5: Create virtual environment
Write-Host ""
Write-Host "📋 Step 4: Setting up Python virtual environment..." -ForegroundColor Yellow
if (-Not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "✅ Virtual environment already exists" -ForegroundColor Green
}

# Step 6: Install Python dependencies
Write-Host ""
Write-Host "📋 Step 5: Installing Python dependencies..." -ForegroundColor Yellow
Write-Host "This may take 2-3 minutes..." -ForegroundColor Cyan

& "venv\Scripts\Activate.ps1"
pip install --upgrade pip
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Python dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Error installing Python dependencies" -ForegroundColor Red
    exit 1
}

# Step 7: Install Node dependencies
Write-Host ""
Write-Host "📋 Step 6: Installing Node.js dependencies..." -ForegroundColor Yellow
Write-Host "This may take 1-2 minutes..." -ForegroundColor Cyan

npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Error installing Node.js dependencies" -ForegroundColor Red
    exit 1
}

# Step 8: Create data directories
Write-Host ""
Write-Host "📋 Step 7: Creating data directories..." -ForegroundColor Yellow

$directories = @("data\docs", "data\csv", "vector_store")
foreach ($dir in $directories) {
    if (-Not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
        Write-Host "✅ Created $dir" -ForegroundColor Green
    } else {
        Write-Host "✅ $dir already exists" -ForegroundColor Green
    }
}

# Summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              🎉 Setup Complete! 🎉                     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ⚠️  REQUIRED: Edit .env file and add your OpenAI API key" -ForegroundColor Yellow
Write-Host "   Open .env in a text editor and set:" -ForegroundColor White
Write-Host "   OPENAI_API_KEY=your_actual_api_key_here" -ForegroundColor White
Write-Host ""
Write-Host "2. Start the backend server:" -ForegroundColor Cyan
Write-Host "   .\start-backend.ps1" -ForegroundColor White
Write-Host "   OR manually:" -ForegroundColor Gray
Write-Host "   cd backend && python main.py" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start the frontend (in a new terminal):" -ForegroundColor Cyan
Write-Host "   .\start-frontend.ps1" -ForegroundColor White
Write-Host "   OR manually:" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Open your browser to: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - Quick Start: QUICKSTART.md" -ForegroundColor White
Write-Host "   - Full Docs: SETUP_README.md" -ForegroundColor White
Write-Host "   - API Docs: http://localhost:8000/docs (after starting backend)" -ForegroundColor White
Write-Host ""
Write-Host "Happy building! 🚀" -ForegroundColor Green
Write-Host ""
