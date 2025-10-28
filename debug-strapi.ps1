# Strapi Debug and Restart Script

Write-Host "🔍 Vortex PCs - Strapi Debugging Guide" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Strapi directory exists
if (Test-Path "vortex-cms") {
    Write-Host "✅ Strapi directory found: vortex-cms" -ForegroundColor Green
} else {
    Write-Host "❌ Strapi directory not found!" -ForegroundColor Red
    exit 1
}

# Check if Strapi is running
Write-Host "🌐 Testing Strapi connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:1338/admin" -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "✅ Strapi is running on port 1338" -ForegroundColor Green
    Write-Host "Admin panel: http://localhost:1338/admin" -ForegroundColor White
} catch {
    Write-Host "❌ Strapi is not running or not accessible" -ForegroundColor Red
    Write-Host "Starting Strapi..." -ForegroundColor Yellow
    
    # Start Strapi
    Set-Location "vortex-cms"
    Write-Host "📁 Changed to vortex-cms directory" -ForegroundColor White
    Write-Host "🚀 Starting Strapi development server..." -ForegroundColor Yellow
    
    # Start Strapi in a new window
    Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "npm run develop"
    Write-Host "✅ Strapi starting in new window..." -ForegroundColor Green
    Write-Host "⏱️ Please wait 30-60 seconds for Strapi to fully start" -ForegroundColor Yellow
    
    Set-Location ".."
}

Write-Host ""
Write-Host "🔧 Debug Steps:" -ForegroundColor Cyan
Write-Host "1. Ensure Strapi is running: http://localhost:1338/admin" -ForegroundColor White
Write-Host "2. Check browser console at: http://localhost:3000" -ForegroundColor White
Write-Host "3. Look for Strapi API debug logs" -ForegroundColor White
Write-Host "4. Run debug script: node debug-strapi-connection.js" -ForegroundColor White
Write-Host ""

Write-Host "📋 Common Issues:" -ForegroundColor Yellow
Write-Host "• Port 1338 already in use" -ForegroundColor White
Write-Host "• Strapi database not initialized" -ForegroundColor White
Write-Host "• Missing page content with slug 'home'" -ForegroundColor White
Write-Host "• API token mismatch" -ForegroundColor White
Write-Host ""

Write-Host "💡 Next Steps:" -ForegroundColor Green
Write-Host "1. Wait for Strapi to start completely" -ForegroundColor White
Write-Host "2. Visit http://localhost:1338/admin to verify content exists" -ForegroundColor White
Write-Host "3. Refresh your frontend at http://localhost:3000" -ForegroundColor White
Write-Host "4. Check browser console for detailed logs" -ForegroundColor White