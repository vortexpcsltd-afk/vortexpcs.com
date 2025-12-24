# Vortex PCs - Development Server Startup Script

Write-Host "🚀 Starting Vortex PCs Development Environment" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Check if React dev server is running
Write-Host "📱 Checking React Development Server (port 3000)..." -ForegroundColor Yellow
if (Test-Port 3000) {
    Write-Host "✅ React server already running on http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "🚀 Starting React development server..." -ForegroundColor Yellow
    Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal
    Write-Host "✅ React server starting..." -ForegroundColor Green
    Start-Sleep 3
}

# Check if Strapi is running
Write-Host "🏗️ Checking Strapi CMS Server (port 1338)..." -ForegroundColor Yellow
if (Test-Port 1338) {
    Write-Host "✅ Strapi server already running on http://localhost:1338" -ForegroundColor Green
} else {
    Write-Host "🚀 Starting Strapi CMS server..." -ForegroundColor Yellow
    Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$PWD\vortex-cms'; npm run develop" -WindowStyle Normal
    Write-Host "✅ Strapi server starting..." -ForegroundColor Green
    Write-Host "⏱️ Please wait 30-60 seconds for Strapi to fully start" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Development Environment Starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "🏗️ Strapi Admin: http://localhost:1338/admin" -ForegroundColor White
Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Wait for both servers to fully start (watch the new terminal windows)" -ForegroundColor White
Write-Host "2. Visit http://localhost:3000 to see your site" -ForegroundColor White
Write-Host "3. Press F12 in browser to check console for Strapi connection logs" -ForegroundColor White
Write-Host "4. If Strapi content doesn't load, visit http://localhost:1338/admin to check content" -ForegroundColor White