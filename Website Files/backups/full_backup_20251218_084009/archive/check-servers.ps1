# Server Status Checker for Vortex PCs
Write-Host "🔍 Checking server status..." -ForegroundColor Cyan
Write-Host ""

# Check React Dev Server (port 3000)
Write-Host "📱 React Development Server (Frontend):" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ RUNNING - http://localhost:3000" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor White
} catch {
    Write-Host "❌ NOT RUNNING - Start with: npm run dev" -ForegroundColor Red
}
Write-Host ""

# Check Strapi Server (port 1338)
Write-Host "🏗️ Strapi CMS Server (Backend):" -ForegroundColor Yellow
try {
    $strapiResponse = Invoke-WebRequest -Uri "http://localhost:1338" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ RUNNING - http://localhost:1338" -ForegroundColor Green
    Write-Host "   Admin: http://localhost:1338/admin" -ForegroundColor White
    Write-Host "   Status: $($strapiResponse.StatusCode)" -ForegroundColor White
} catch {
    Write-Host "❌ NOT RUNNING - Start with: cd vortex-cms && npm run develop" -ForegroundColor Red
}
Write-Host ""

Write-Host "🎯 Quick Actions:" -ForegroundColor Cyan
Write-Host "• Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "• Strapi Admin: http://localhost:1338/admin" -ForegroundColor White
Write-Host "• Press F12 in browser to see debug logs" -ForegroundColor White
Write-Host ""

Write-Host "🔧 If servers are not running:" -ForegroundColor Yellow
Write-Host "1. Terminal 1: npm run dev" -ForegroundColor White
Write-Host "2. Terminal 2: cd vortex-cms && npm run develop" -ForegroundColor White