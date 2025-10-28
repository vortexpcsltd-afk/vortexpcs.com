# 🔍 Strapi Content Not Showing - Troubleshooting Guide

## Current Status Analysis

### ✅ What's Working

- Frontend React app runs on http://localhost:3000
- Strapi project exists in `vortex-cms/` directory
- Environment variables configured for localhost:1338
- Fallback content displays ("PERFORMANCE THAT DOESN'T WAIT")

### ❌ What's Not Working

- Strapi content not loading from API
- Browser showing fallback instead of real CMS content

## 🔧 Step-by-Step Diagnosis

### Step 1: Verify Strapi is Running

1. **Open Terminal and start Strapi**:

   ```bash
   cd vortex-cms
   npm run develop
   ```

2. **Wait for this message**:

   ```
   Strapi started successfully
   To access the server ⚡️, go to:
   http://localhost:1338
   ```

3. **Test admin access**: http://localhost:1338/admin

### Step 2: Check Browser Console (F12)

1. **Open your site**: http://localhost:3000
2. **Press F12** to open DevTools
3. **Go to Console tab**
4. **Look for these logs**:
   ```
   🚀 Loading Strapi CMS content...
   📊 Strapi API Results: {...}
   ✅ Strapi page content loaded: {...}
   ```

### Step 3: Verify Content Exists in Strapi

1. **Login to Strapi Admin**: http://localhost:1338/admin
2. **Navigate to**: Content Manager > Collection Types > Page Contents
3. **Check for entry** with:
   - Page Slug: "home"
   - Hero Title: "PERFORMANCE THAT DOESN'T WAIT"
4. **Ensure it's Published** (not Draft)

### Step 4: Test API Directly

1. **Run debug script**:
   ```bash
   node debug-strapi-connection.js
   ```
2. **Check output** for connection status

## 🐛 Common Issues & Solutions

### Issue 1: Strapi Not Starting

**Symptoms**: Can't access http://localhost:1338/admin
**Solutions**:

- Check if port 1338 is already in use
- Restart the terminal and try again
- Check for error messages in Strapi terminal

### Issue 2: No Content in Strapi

**Symptoms**: Strapi admin is empty or no "home" page content
**Solutions**:

- Create new Page Content entry
- Set Page Slug to "home"
- Add Hero Title: "PERFORMANCE THAT DOESN'T WAIT"
- **IMPORTANT**: Click "Publish" (not Save as Draft)

### Issue 3: API Token Mismatch

**Symptoms**: 401 Unauthorized errors in console
**Solutions**:

- Go to Strapi Admin > Settings > API Tokens
- Verify token matches your .env file
- Generate new token if needed

### Issue 4: CORS Issues

**Symptoms**: Network errors or blocked requests
**Solutions**:

- Check Strapi CORS settings in `config/middlewares.js`
- Ensure localhost:3000 is allowed

## 🚀 Quick Fix Commands

### Restart Everything

```bash
# Terminal 1: Stop everything with Ctrl+C
# Then restart Strapi
cd vortex-cms
npm run develop

# Terminal 2: Restart React app
cd ..
npm run dev
```

### Test API Connection

```bash
node debug-strapi-connection.js
```

### Check if Content Exists

1. Visit: http://localhost:1338/admin
2. Login with your admin credentials
3. Go to: Content Manager > Page Contents
4. Look for entry with slug "home"

## 🔍 Debug Checklist

- [ ] Strapi server running on port 1338
- [ ] Can access http://localhost:1338/admin
- [ ] Page Content with slug "home" exists and is Published
- [ ] API token in .env matches Strapi settings
- [ ] No CORS errors in browser console
- [ ] React app can connect to Strapi API

## 📱 Expected Browser Console Output

When working correctly, you should see:

```
🚀 Loading Strapi CMS content...
📊 Strapi API Results: {pageContent: "fulfilled", ...}
✅ Strapi page content loaded: {heroTitle: "PERFORMANCE THAT DOESN'T WAIT", ...}
🎉 Hero title from Strapi: PERFORMANCE THAT DOESN'T WAIT
```

When failing, you'll see:

```
🚀 Loading Strapi CMS content...
📊 Strapi API Results: {pageContent: "rejected", ...}
⚠️ FALLBACK: Using hardcoded hero content
```

## 💡 Next Steps

1. **Start with Step 1** (verify Strapi is running)
2. **Check browser console** for specific error messages
3. **Verify content exists** in Strapi admin
4. **Test API connection** with debug script

If you're still having issues, check:

- What specific error messages appear in browser console?
- Can you access the Strapi admin panel?
- Is there content in the Page Contents collection?
