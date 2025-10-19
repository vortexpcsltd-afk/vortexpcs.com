# ⚡ COPY & PASTE COMMANDS

## 🚀 Deploy Now (5 Minutes)

### 1. Git Commands
```bash
git add .
git commit -m "v20251019-04: PCFinder cache bust + blue theme + custom assets"
git push origin main
```

### 2. Vercel Dashboard Actions
```
1. Open: https://vercel.com/dashboard
2. Click: vortexpcs project
3. Settings → General → Scroll to bottom
4. Click: "Clear Build Cache" → Confirm
5. Deployments tab → Wait for new deployment
6. Click: ⋮ (three dots) → "Redeploy"
7. UNCHECK: "Use existing Build Cache"
8. Click: "Redeploy" button
9. Wait: 3-5 minutes
```

### 3. Verification
```bash
# Check version
curl https://www.vortexpcs.com/version.json

# Should return:
# "version": "2025-10-19-04"
# "PCFinder": "blue-glassmorphism-v4-CACHE-BUST"
```

### 4. Browser Test
```
1. Press: Ctrl+Shift+N (Chrome Incognito)
2. Go to: https://www.vortexpcs.com/
3. Click: "Find Your Perfect PC"
4. Verify: Blue gradient buttons (not rainbow)
5. Close Incognito
6. Press: Ctrl+Shift+R (Hard refresh normal browser)
```

---

## 🆘 If Still Not Working

### Option A: Purge Edge Cache via CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Purge cache
vercel --prod --force
```

### Option B: Local Clean Build
```bash
# Clear local node modules
rm -rf node_modules
rm package-lock.json
npm install

# Force rebuild
npm run build

# Test locally
npm run dev
# Open: http://localhost:5173
```

### Option C: Contact Vercel
```
1. Go to: https://vercel.com/support
2. Subject: "Request CDN cache purge for vortexpcs.com"
3. Message:

Hello,

Please purge all CDN/Edge cache for www.vortexpcs.com

Project: vortexpcs
Issue: PCFinder component showing cached old version
Deployment Version: 2025-10-19-04

Actions already taken:
- Cleared build cache
- Redeployed without cache
- Updated cache bust version

Please manually purge edge cache.

Thank you!
```

---

## 📋 Quick Checks

### Check Git Status
```bash
git status
git log --oneline -5
```

### Check Version Locally
```bash
cat public/version.json
cat index.html | grep "cache-version"
```

### Check What's Deployed
```bash
curl -I https://www.vortexpcs.com/ | grep -i cache
curl https://www.vortexpcs.com/version.json
```

### Check Component
```bash
head -20 components/PCFinder.tsx
# Should show version comment: v20251019-04
```

---

## 🔧 Debug Commands

### See Recent Changes
```bash
git diff HEAD~1 components/PCFinder.tsx
git diff HEAD~1 public/version.json
git diff HEAD~1 index.html
```

### Check Build Locally
```bash
npm run build
ls -lh dist/
```

### Test Production Build Locally
```bash
npm run build
npm run preview
# Open: http://localhost:4173
```

---

## 📱 Browser Testing Commands

### Chrome DevTools
```
F12 → Console → Paste:
console.log(document.querySelector('meta[name="cache-version"]').content);

Should show: 20251019-04
```

### Clear Browser Cache
```
Chrome:
Ctrl+Shift+Delete → Time range: All time → Cached images → Clear

Firefox:
Ctrl+Shift+Delete → Time range: Everything → Cache → Clear

Edge:
Ctrl+Shift+Delete → Time range: All time → Cached data → Clear
```

---

## ✅ Success Commands

### Verify Everything
```bash
# 1. Version check
curl -s https://www.vortexpcs.com/version.json | grep version

# 2. Cache headers check
curl -I https://www.vortexpcs.com/ | grep -i "cache\|age"

# 3. Asset loading check
curl -I https://www.vortexpcs.com/ | head -20

# 4. DNS check
nslookup www.vortexpcs.com

# 5. Connectivity check
ping www.vortexpcs.com -c 4
```

### Check Deployment Status
```bash
# Using Vercel CLI
vercel ls
vercel inspect vortexpcs
```

---

## 📦 Complete Rebuild (Nuclear)

If absolutely nothing works:

```bash
# 1. Clean everything
rm -rf node_modules
rm -rf dist
rm -rf .vercel
rm package-lock.json

# 2. Fresh install
npm install

# 3. Test local build
npm run build
npm run preview

# 4. If local works, commit
git add .
git commit -m "Force rebuild: $(date +%Y%m%d-%H%M%S)"
git push origin main

# 5. In Vercel Dashboard:
# - Settings → Delete deployment protection
# - Settings → Clear build cache  
# - Deployments → Redeploy (NO CACHE)
```

---

## 🎯 Expected Output

### After Git Push
```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
Delta compression using up to Y threads
Compressing objects: 100% (X/X), done.
Writing objects: 100% (X/X), Z KiB | Z MiB/s, done.
Total X (delta X), reused X (delta X), pack-reused 0
To github.com:yourusername/vortexpcs.git
   abc1234..def5678  main -> main
```

### After Vercel Build
```
Build started
Installing dependencies
Building application
Build completed successfully
Deployment ready
```

### After version.json Check
```json
{
  "version": "2025-10-19-04",
  "timestamp": "2025-10-19T18:00:00Z",
  "build": "pcfinder-cache-bust-blue-theme",
  "components": {
    "PCFinder": "blue-glassmorphism-v4-CACHE-BUST"
  }
}
```

---

## 📞 Emergency Contacts

### Vercel
- Support: https://vercel.com/support
- Discord: https://vercel.com/discord
- Docs: https://vercel.com/docs

### GitHub
- Status: https://www.githubstatus.com/
- Support: https://support.github.com/

---

**Version:** v20251019-04  
**Status:** ✅ Commands ready  
**Use:** Copy entire code blocks
