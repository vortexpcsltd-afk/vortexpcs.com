# Vortex PCs - Strapi Production Deployment Guide
# PowerShell script for Windows

Write-Host "🚀 Vortex PCs - Strapi Production Deployment Setup" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Current Local Setup:" -ForegroundColor Green
Write-Host "✅ Local Strapi running on: http://localhost:1338" -ForegroundColor White
Write-Host "✅ API Token configured: 5477f8f2..." -ForegroundColor White
Write-Host "✅ Content created with 'PERFORMANCE THAT DOESN'T WAIT'" -ForegroundColor White
Write-Host ""

Write-Host "🎯 Production Deployment Options:" -ForegroundColor Yellow
Write-Host ""

Write-Host "Option 1: Quick Test with ngrok (5 minutes)" -ForegroundColor Magenta
Write-Host "   1. Download ngrok: https://ngrok.com/download" -ForegroundColor White
Write-Host "   2. Extract and add to PATH" -ForegroundColor White
Write-Host "   3. Start Strapi in vortex-cms: cd vortex-cms && npm run develop" -ForegroundColor White
Write-Host "   4. Run: ngrok http 1338" -ForegroundColor White
Write-Host "   5. Copy the https URL (e.g., https://abc123.ngrok.io)" -ForegroundColor White
Write-Host ""

Write-Host "Option 2: Railway Deployment (Free, Permanent)" -ForegroundColor Magenta  
Write-Host "   1. Sign up: https://railway.app" -ForegroundColor White
Write-Host "   2. Install CLI: npm install -g @railway/cli" -ForegroundColor White
Write-Host "   3. Login: railway login" -ForegroundColor White
Write-Host "   4. Deploy: cd vortex-cms && railway up" -ForegroundColor White
Write-Host ""

Write-Host "Option 3: Strapi Cloud (Managed Hosting)" -ForegroundColor Magenta
Write-Host "   1. Sign up: https://cloud.strapi.io" -ForegroundColor White
Write-Host "   2. Create new project" -ForegroundColor White
Write-Host "   3. Import your content types" -ForegroundColor White
Write-Host ""

Write-Host "🔧 After Deployment:" -ForegroundColor Yellow
Write-Host "1. Get your production URL" -ForegroundColor White
Write-Host "2. Create production API token in Strapi admin" -ForegroundColor White
Write-Host "3. Configure Vercel environment variables:" -ForegroundColor White
Write-Host "   • Go to: https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host "   • Select your project: vortexpcs" -ForegroundColor Gray
Write-Host "   • Go to Settings > Environment Variables" -ForegroundColor Gray
Write-Host "   • Add: VITE_STRAPI_URL = https://your-strapi-url" -ForegroundColor Gray
Write-Host "   • Add: VITE_STRAPI_API_TOKEN = your-production-token" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 Recommended: Start with ngrok for immediate testing!" -ForegroundColor Green
Write-Host ""

# Check if user wants to proceed with ngrok setup
Write-Host "Would you like help setting up ngrok? (y/n): " -ForegroundColor Cyan -NoNewline
$response = Read-Host

if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host ""
    Write-Host "🔧 Setting up ngrok..." -ForegroundColor Green
    Write-Host ""
    Write-Host "1. First, make sure your Strapi is running:" -ForegroundColor Yellow
    Write-Host "   cd vortex-cms" -ForegroundColor White
    Write-Host "   npm run develop" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Then in a new terminal, run ngrok:" -ForegroundColor Yellow
    Write-Host "   ngrok http 1338" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Copy the https forwarding URL from ngrok" -ForegroundColor Yellow
    Write-Host "4. I'll help you configure Vercel with that URL" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "Manual deployment guides saved to:" -ForegroundColor Green
    Write-Host "• .env.production (production environment variables)" -ForegroundColor White
    Write-Host "• strapi-deployment-guide.sh (detailed deployment steps)" -ForegroundColor White
}

Write-Host ""
Write-Host "📚 Need help? Check the deployment guides created in your project!" -ForegroundColor Cyan