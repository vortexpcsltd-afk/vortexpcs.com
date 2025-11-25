# Address Lookup Diagnostic Report

**Date:** November 3, 2025  
**Component:** Postcode Address Finder  
**Status:** ⚠️ CRITICAL - Only Showing Fallback Addresses

---

## 🔴 ROOT CAUSE IDENTIFIED

The postcode address finder is **only showing fallback addresses** because:

### **PRIMARY ISSUE: Invalid/Expired getaddress.io API Key**

The API key stored in `.env.local` (`1To5H00ABEGpjJqGdFmfFw48513`) is **INVALID or EXPIRED**.

**Evidence:**

- Direct API test to `https://api.getaddress.io/find/M11AA?api-key=...` returns **404 Not Found**
- This causes all three lookup methods to fail:
  1. ❌ Client-side direct lookup (fails)
  2. ❌ Backend proxy via Vercel function (fails)
  3. ❌ Same-origin backend proxy (fails)
- System falls back to `postcodes.io` synthetic addresses (the "fallback" addresses you're seeing)

---

## 📊 System Analysis

### Current Configuration

**Environment Variables:**

```
✅ VITE_GETADDRESS_IO_API_KEY found in .env.local
❌ API key is invalid/expired (returns 404)
```

**Address Lookup Flow:**

```
User enters postcode
    ↓
services/address.ts → lookupAddresses()
    ↓
1. Try: Client-side getaddress.io (FAILS - 404)
    ↓
2. Try: Backend proxy via VITE_STRIPE_BACKEND_URL (FAILS - no key/404)
    ↓
3. Try: Same-origin /api/address/find (FAILS - no key/404)
    ↓
4. FALLBACK: postcodes.io synthetic addresses (CURRENTLY HAPPENING)
```

### File Structure Analysis

**✅ Code Structure:** All files properly configured

- `config/address.ts` - Properly loads env var
- `services/address.ts` - Complete waterfall logic with 3 providers + fallback
- `api/address/find.ts` - Backend proxy correctly configured
- `components/RepairService.tsx` - UI properly integrated

**❌ API Credentials:** Invalid/expired key

---

## 🔍 Detailed Findings

### 1. Environment Variable Loading

**Status:** ✅ WORKING

- `.env.local` exists with `VITE_GETADDRESS_IO_API_KEY="1To5H00ABEGpjJqGdFmfFw48513"`
- Key is loaded via `import.meta.env.VITE_GETADDRESS_IO_API_KEY`
- Dev console shows: "📬 Address Provider Key: FOUND 1To5H0..."

### 2. API Key Validation

**Status:** ❌ FAILED

```powershell
# Test command executed:
Invoke-WebRequest "https://api.getaddress.io/find/M11AA?api-key=1To5H00ABEGpjJqGdFmfFw48513&expand=true"

# Response: 404 Not Found
# Message: { "Message": "Not Found" }
```

**This indicates:**

- API key does not exist in getaddress.io system
- API key may have expired
- API key may have been revoked
- Possible typo in the key value

### 3. Backend Proxy Configuration

**Status:** ✅ CONFIGURED (but fails due to invalid key)

- `/api/address/find.ts` properly configured as Vercel serverless function
- Reads from `process.env.GETADDRESS_IO_API_KEY` or `process.env.VITE_GETADDRESS_IO_API_KEY`
- Returns graceful empty response when key missing
- CORS headers properly configured

### 4. Fallback Mechanism

**Status:** ✅ WORKING AS DESIGNED

- When all providers fail, system uses `postcodes.io` to generate synthetic addresses
- Example fallback addresses:
  ```
  1 Main Street, Westminster, London, SW1A 1AA
  2 Main Street, Westminster, London, SW1A 1AA
  Flat A, 3 Main Street, Westminster, SW1A 1AA
  Unit 4, High Street, Westminster, SW1A 1AA
  ```
- Sets `lastAddressProvider = "postcodes.io (fallback)"`
- Sets `lastAddressError = "fallback synthetic"`

---

## 🎯 Why Only Fallback Addresses Show

The system's waterfall approach tries multiple providers in order:

1. **Client-side getaddress.io** (PRIORITY)

   - Checks if `GETADDRESS_IO_API_KEY` exists ✅
   - Makes request to `https://api.getaddress.io/find/{postcode}?api-key=...`
   - **FAILS:** Returns 404 (invalid key) ❌
   - Logs: "getaddress.io responded 404"

2. **Backend proxy (Vercel function)**

   - Tries `${VITE_STRIPE_BACKEND_URL}/api/address/find?postcode=...`
   - Backend function loads same invalid key
   - **FAILS:** Backend also gets 404 from getaddress.io ❌
   - Returns empty `{ addresses: [] }`

3. **Same-origin proxy**

   - Tries `/api/address/find?postcode=...`
   - Same as #2, but relative path
   - **FAILS:** Same invalid key issue ❌

4. **Fallback to postcodes.io** (CURRENTLY ACTIVE)
   - Uses free `https://api.postcodes.io/postcodes/{postcode}` API
   - Generates synthetic/placeholder addresses based on geographic data
   - **SUCCEEDS:** Returns 4 synthetic addresses ✅
   - This is what users currently see

---

## 🛠️ SOLUTIONS (Prioritized)

### ⭐ IMMEDIATE FIX (Recommended)

**Option 1: Get Valid getaddress.io API Key**

1. **Create/Access getaddress.io Account:**

   - Visit: https://getaddress.io/
   - Sign up or log in to existing account
   - Navigate to "API Keys" section

2. **Generate New API Key:**

   - Click "Create New Key" or use existing valid key
   - Copy the API key (format: `your-api-key-here`)

3. **Update Environment Variable:**

   ```env
   # In .env.local
   VITE_GETADDRESS_IO_API_KEY="your-new-valid-api-key"
   ```

4. **Restart Dev Server:**

   ```bash
   npm run dev
   ```

5. **Test Immediately:**
   - Navigate to Repair Service page
   - Enter postcode (e.g., "SW1A 1AA")
   - Click "Find Address"
   - Should now see REAL addresses, not synthetic ones

**Expected Result:**

- Console: "📫 Trying getaddress.io (client) first"
- Console: "📦 Using backend address proxy" OR success from client
- Real addresses displayed in dropdown
- `lastAddressProvider` = "getaddress.io (client)" or "backend proxy"

---

### 🔧 ALTERNATIVE SOLUTIONS

**Option 2: Use Different Address Provider**

If getaddress.io is too expensive or unavailable, consider alternatives:

1. **Ideal Postcodes** (https://ideal-postcodes.co.uk/)
   - Free tier: 1000 lookups/month
   - More generous than getaddress.io
2. **Postcodes.io** (Already used as fallback)

   - FREE but doesn't provide actual addresses
   - Only provides synthetic addresses based on geography
   - Current fallback behavior

3. **Royal Mail PAF** (Postcode Address File)
   - Official UK address database
   - Requires license and setup
   - Most accurate but complex

**Implementation:** Update `services/address.ts` to call different API

---

**Option 3: Accept Fallback Behavior**

If real addresses aren't critical:

1. **Enhance synthetic address quality:**

   - Improve fallback logic in `services/address.ts`
   - Add more realistic street names
   - Use additional postcodes.io data

2. **Update UI messaging:**

   - Change "Find Address" to "Find Area"
   - Add note: "Showing example addresses for this postcode"
   - Encourage manual entry

3. **Remove address lookup entirely:**
   - Just use manual address entry form
   - Simpler UX, no API dependencies

---

## 🧪 Testing Checklist

After implementing fix:

- [ ] Environment variable updated with valid key
- [ ] Dev server restarted (`npm run dev`)
- [ ] Browser console shows: "📬 Address Provider Key: FOUND [key]..."
- [ ] Test with valid postcode (e.g., "SW1A 1AA", "M1 1AA", "B1 1BB")
- [ ] Verify REAL addresses appear (not "1 Main Street" synthetic ones)
- [ ] Check console for "getaddress.io (client)" or "backend proxy" success message
- [ ] Verify `lastAddressProvider` !== "postcodes.io (fallback)"
- [ ] Test with invalid postcode - should show error, not crash
- [ ] Test production deployment (Vercel env vars set)

---

## 📝 Production Deployment Notes

When deploying to Vercel:

1. **Set Environment Variable in Vercel Dashboard:**

   - Go to: Project Settings → Environment Variables
   - Add: `VITE_GETADDRESS_IO_API_KEY` (for frontend)
   - Add: `GETADDRESS_IO_API_KEY` (for backend functions)
   - Use same valid key for both

2. **Verify Backend Function Has Access:**

   - `/api/address/find.ts` needs server-side env var
   - Vercel automatically provides to serverless functions
   - Check Vercel logs if backend returns empty addresses

3. **Test Production:**
   ```bash
   # After deployment
   curl "https://vortexpcs.com/api/address/find?postcode=SW1A1AA"
   # Should return: { "addresses": [...real addresses...], "provider": "getaddress.io (server)" }
   ```

---

## 🎓 Understanding the Code Flow

### Complete Request Flow (When Working)

```typescript
// 1. USER ENTERS POSTCODE
RepairService.tsx: handlePostcodeLookup()
  → postcode = "SW1A 1AA"

// 2. CALLS SERVICE LAYER
services/address.ts: lookupAddresses("SW1A 1AA")

// 3. TRY CLIENT-SIDE FIRST (if key exists)
if (GETADDRESS_IO_API_KEY) {
  fetch("https://api.getaddress.io/find/SW1A 1AA?api-key=...")

  ✅ SUCCESS (200):
    → Parse addresses from response.addresses[]
    → Set lastAddressProvider = "getaddress.io (client)"
    → RETURN addresses immediately

  ❌ FAIL (404/error):
    → Log warning
    → Set lastAddressError
    → CONTINUE to backend attempts
}

// 4. TRY BACKEND PROXY (if client failed)
fetch(`${VITE_STRIPE_BACKEND_URL}/api/address/find?postcode=...`)

  ✅ SUCCESS (200 with addresses):
    → Set lastAddressProvider = "backend proxy"
    → RETURN addresses

  ❌ FAIL (no addresses or error):
    → CONTINUE to same-origin attempt

// 5. TRY SAME-ORIGIN BACKEND
fetch(`/api/address/find?postcode=...`)

  ✅ SUCCESS (200 with addresses):
    → Set lastAddressProvider = "backend proxy (same-origin)"
    → RETURN addresses

  ❌ FAIL:
    → CONTINUE to fallback

// 6. FALLBACK TO SYNTHETIC
fetch("https://api.postcodes.io/postcodes/SW1A1AA")
  → Get geographic data (region, district, etc.)
  → Generate 4 synthetic addresses
  → Set lastAddressProvider = "postcodes.io (fallback)"
  → RETURN synthetic addresses ← **THIS IS HAPPENING NOW**
```

---

## 🔐 Security Considerations

**Current Setup:**

- ⚠️ API key exposed in client-side code (`.env.local` → browser bundle)
- Anyone can inspect Network tab and extract the key
- Recommended for development only

**Best Practice for Production:**

1. **Remove client-side key** from `VITE_GETADDRESS_IO_API_KEY`
2. **Only use backend proxy** (`/api/address/find.ts`)
3. **Backend stores key** in server environment (`GETADDRESS_IO_API_KEY`)
4. **Client calls backend**, backend calls getaddress.io
5. **Key never exposed** to browser

**To implement:**

```typescript
// services/address.ts - REMOVE client-side attempt
// Comment out or delete the "TEMPORARY PRIORITY" section
// Keep only backend proxy attempts
```

---

## 📞 Support Resources

**getaddress.io Documentation:**

- API Docs: https://documentation.getaddress.io/
- Support: support@getaddress.io
- Pricing: https://getaddress.io/pricing (check if subscription expired)

**Alternative Providers:**

- Ideal Postcodes: https://ideal-postcodes.co.uk/
- Postcodes.io: https://postcodes.io/ (free, no registration)

**Vercel Serverless Functions:**

- Docs: https://vercel.com/docs/functions
- Environment Variables: https://vercel.com/docs/projects/environment-variables

---

## ✅ Summary

**Current State:**

- ❌ Real address lookup: **NOT WORKING**
- ✅ Fallback addresses: **WORKING** (but not real addresses)
- ❌ API Key: **INVALID/EXPIRED**

**Root Cause:**

- getaddress.io API key `1To5H00ABEGpjJqGdFmfFw48513` returns 404 Not Found

**Immediate Action Required:**

1. Obtain valid getaddress.io API key
2. Update `.env.local` with new key
3. Restart development server
4. Test with real postcode
5. Update Vercel environment variables for production

**Expected Time to Fix:**

- With valid API key: **5 minutes**
- Creating new getaddress.io account: **10-15 minutes**

---

**Report Generated:** November 3, 2025  
**Next Steps:** Obtain valid API key and test
