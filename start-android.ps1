# XHere Android Development Quick Start Script
# Run this script to start mobile development

Write-Host "🚀 Starting XHere Android Development..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "frontend\package.json")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Check if backend is running
Write-Host "🔍 Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend not detected. Make sure to start the backend server first:" -ForegroundColor Yellow
    Write-Host "   cd backend && npm start" -ForegroundColor Cyan
    Write-Host ""
}

# Navigate to frontend and start mobile development
Write-Host "📱 Starting mobile development..." -ForegroundColor Yellow
Set-Location frontend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start mobile development
Write-Host "🚀 Starting mobile development with live reload..." -ForegroundColor Green
Write-Host "💡 This will build the app and start it on your Android device/emulator" -ForegroundColor Cyan
Write-Host ""

npm run mobile:dev
