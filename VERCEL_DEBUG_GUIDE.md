# Vercel Debugging Guide - Auth Not Working

## Current Situation
✅ Auth works **locally**  
❌ Auth fails on **Vercel**

This means the code is correct but there's an environment/configuration issue.

---

## Step 1: Check Environment Variables on Vercel

### 1.1 Go to Vercel Dashboard
https://vercel.com/badrhsn96-8179s-projects/skyphone/settings/environment-variables

### 1.2 Verify ALL These Variables Exist

**CRITICAL - Must have exact values:**

```bash
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=[your-nextauth-secret-44-chars]
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production

DATABASE_URL=postgresql://[your-supabase-connection-string]

GOOGLE_CLIENT_ID=[your-google-client-id].apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-[your-google-client-secret]

TWILIO_ACCOUNT_SID=AC[your-twilio-account-sid]
TWILIO_AUTH_TOKEN=[your-actual-twilio-auth-token]
```

### 1.3 Common Mistakes to Check
- ❌ Variables have placeholder text like `[your-google-client-id]`
- ❌ NEXTAUTH_URL is missing or wrong
- ❌ Extra spaces before/after values
- ❌ Variables not set for "Production" environment

**Fix:** Make sure all variables are set for **Production, Preview, and Development**

---

## Step 2: Use Debug Endpoints

I've created debug endpoints. Visit these URLs to see what's wrong:

### 2.1 Check Environment Variables
```
https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/debug/env
```

**Expected Response:**
```json
{
  "hasNextAuthUrl": true,
  "nextAuthUrl": "https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app",
  "hasNextAuthSecret": true,
  "nextAuthSecretLength": 44,
  "hasGoogleClientId": true,
  "googleClientIdPreview": "[your-client-id-numbers]...",
  "hasGoogleClientSecret": true,
  "hasDatabaseUrl": true,
  "databaseUrlPreview": "postgresql://postgres.talrdr..."
}
```

**If any are `false`** → That environment variable is missing in Vercel!

### 2.2 Check Database Connection
```
https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/debug/db
```

**Expected Response:**
```json
{
  "status": "success",
  "dbConnected": true,
  "userCount": 0
}
```

**If error** → Database connection is failing. Check:
- DATABASE_URL is correct
- Supabase project is active
- Connection pooling is enabled (pgbouncer=true)

### 2.3 Check Auth Configuration
```
https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/debug/auth-config
```

**Expected Response:**
```json
{
  "hasSecret": true,
  "secretLength": 44,
  "providersCount": 2,
  "providers": [
    {"id": "google", "name": "Google", "type": "oauth"},
    {"id": "credentials", "name": "credentials", "type": "credentials"}
  ],
  "sessionStrategy": "jwt"
}
```

**If providersCount is 1** → Google provider wasn't added (env vars missing)

---

## Step 3: Check Vercel Build Logs

### 3.1 Go to Deployments
https://vercel.com/badrhsn96-8179s-projects/skyphone/deployments

### 3.2 Click Latest Deployment

### 3.3 Look for "Building" Section
Search for:
```
✔ Generated Prisma Client
```

**If you DON'T see this** → Prisma isn't being generated. Check:
- `package.json` has `"postinstall": "prisma generate"`
- `package.json` has `"build": "prisma generate && next build --turbopack"`

---

## Step 4: Check Runtime Logs

### 4.1 Go to Deployment → Runtime Logs
https://vercel.com/badrhsn96-8179s-projects/skyphone/deployments

### 4.2 Try to Sign In/Register
While logs are visible, try authentication.

### 4.3 Look for Errors
Common errors:
```
PrismaClientInitializationError: Can't reach database server
→ DATABASE_URL is wrong or Supabase is down

Error: No "secret" option provided
→ NEXTAUTH_SECRET not set in Vercel

Error: client_id is invalid
→ GOOGLE_CLIENT_ID is wrong or placeholder value
```

---

## Step 5: Verify Google OAuth Callback

### 5.1 Check Google Cloud Console
https://console.cloud.google.com/apis/credentials

Find your OAuth Client ID and check the Authorized Redirect URIs.

### 5.2 Authorized Redirect URIs Must Include
```
https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/auth/callback/google
```

**Exact match** - no trailing slash, must be HTTPS, correct domain.

---

## Step 6: Force Redeploy with Fresh Build

If all variables are correct but still failing:

### 6.1 Clear Build Cache
1. Vercel Dashboard → Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"
4. **UNCHECK** "Use existing build cache"
5. Click "Redeploy"

This forces fresh:
- `npm install`
- `prisma generate`
- `next build`

---

## Step 7: Check NEXTAUTH_URL Matches Deployment URL

### Common Issue:
Your Vercel URL might be different from NEXTAUTH_URL.

**Check actual deployment URL:**
- Look at Vercel deployment domains
- Could be: `skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app`
- Or: `skyphone.vercel.app` (custom domain)

**NEXTAUTH_URL must EXACTLY match** the URL you're accessing.

---

## Step 8: Test Providers Endpoint

Visit:
```
https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/auth/providers
```

**Expected:**
```json
{
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oauth"
  },
  "credentials": {
    "id": "credentials",
    "name": "credentials", 
    "type": "credentials"
  }
}
```

**If this fails** → NextAuth itself isn't configured correctly

---

## Quick Checklist

Run through this checklist:

- [ ] All env vars set in Vercel Dashboard (Production environment)
- [ ] NEXTAUTH_URL exactly matches deployment URL
- [ ] NEXTAUTH_SECRET is 44 characters, not placeholder
- [ ] GOOGLE_CLIENT_ID starts with actual number, not `[your-`
- [ ] DATABASE_URL is the full Supabase connection string with `?pgbouncer=true`
- [ ] Google Console has correct callback URL
- [ ] Latest deployment shows "✔ Generated Prisma Client" in build logs
- [ ] `/api/debug/env` shows all `true` values
- [ ] `/api/debug/db` shows `"dbConnected": true`
- [ ] `/api/debug/auth-config` shows `"providersCount": 2`
- [ ] `/api/auth/providers` returns Google and credentials

---

## Most Likely Issues (Based on Symptoms)

### If Registration Fails:
1. Database not accessible → Check `/api/debug/db`
2. Prisma not generated → Check build logs

### If Google OAuth Fails:
1. GOOGLE_CLIENT_ID/SECRET are placeholders → Check Vercel env vars
2. Callback URL not in Google Console → Add it
3. NEXTAUTH_URL doesn't match → Update to match deployment URL

### If Both Fail:
1. NEXTAUTH_SECRET missing → Check `/api/debug/env`
2. Database connection failing → Check `/api/debug/db`
3. NextAuth not initializing → Check `/api/debug/auth-config`

---

## After Fixing

1. Update environment variables in Vercel
2. Redeploy (clear cache)
3. Wait 2-3 minutes
4. Test debug endpoints first
5. Then test actual auth

---

## Need More Help?

Share the output of:
1. `/api/debug/env`
2. `/api/debug/db`
3. `/api/debug/auth-config`
4. Vercel runtime logs (screenshots)
