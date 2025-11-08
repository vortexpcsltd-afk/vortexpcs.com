#!/bin/bash
# Server Status Checker for Vortex PCs

echo "🔍 Checking server status..."
echo ""

# Check React Dev Server (port 3000)
echo "📱 React Development Server (Frontend):"
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ RUNNING - http://localhost:3000"
else
    echo "❌ NOT RUNNING - Start with: npm run dev"
fi
echo ""

# Check Strapi Server (port 1338)
echo "🏗️ Strapi CMS Server (Backend):"
if curl -s http://localhost:1338 > /dev/null; then
    echo "✅ RUNNING - http://localhost:1338"
    echo "   Admin: http://localhost:1338/admin"
else
    echo "❌ NOT RUNNING - Start with: cd vortex-cms && npm run develop"
fi
echo ""

echo "🎯 Quick Actions:"
echo "• Frontend: http://localhost:3000"
echo "• Strapi Admin: http://localhost:1338/admin"
echo "• Press F12 in browser to see debug logs"