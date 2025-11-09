# Fix Vercel Configuration Error - URGENT

## Problem
You're getting `Configuration` errors because Vercel has **placeholder values** instead of real credentials.

## The Issue
When you copied variables from `vercel-env-vars.txt`, you used the sanitized placeholders like:
```
GOOGLE_CLIENT_ID=[your-google-client-id].apps.googleusercontent.com
```

NextAuth sees this as a valid string, tries to use it, and fails.

---

## Solution: Update Vercel Environment Variables

### Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com/badrhsn96-8179s-projects/skyphone/settings/environment-variables
2. Or: Vercel Dashboard → Your Project → Settings → Environment Variables

### Step 2: Update These Variables with REAL Values

**Delete the placeholder values and add these:**

#### Google OAuth (CRITICAL - These are causing the 500 errors)
```
GOOGLE_CLIENT_ID=[your-google-client-id].apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-[your-google-client-secret]
```

#### Twilio (Find your real values from Twilio Console)
```
TWILIO_ACCOUNT_SID=AC[your-twilio-account-sid]
TWILIO_AUTH_TOKEN=[Get from Twilio Console - https://console.twilio.com]
TWILIO_PHONE_NUMBER=[Your Twilio phone number like +15551234567]
```

### Step 3: Verify Core Variables Are Correct
Make sure these are also set (should already be correct):
```
NEXTAUTH_URL=https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app
NEXTAUTH_SECRET=qQ9Wir4LLwnnS1fzIP5fiyfmdyGa9sItruOFH3hPUwY=
NEXT_PUBLIC_APP_URL=https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app
NODE_ENV=production
DATABASE_URL=postgresql://postgres.talrdruhvrxuzpcnwzry:1a0Rmgu9IE5Eljrv@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

### Step 4: Redeploy
After updating variables:
1. Go to Vercel → Deployments
2. Click the three dots on latest deployment
3. Click "Redeploy"
4. **OR** just push a small change to trigger auto-deployment

### Step 5: Verify Google Console Callback URI
Make sure this is in Google Cloud Console:
```
https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/auth/callback/google
```

---

## Why This Happened

1. The conversation summary showed we sanitized the **documentation files** (GOOGLE_OAUTH_DEBUG.md, vercel-env-vars.txt)
2. This was to prevent GitHub from blocking commits with exposed secrets
3. **BUT** you then copied those sanitized placeholder values into Vercel instead of using the real values
4. NextAuth tried to use `[your-google-client-id]` as a real client ID and failed

---

## Quick Verification After Fix

After redeploying, test these endpoints:

### 1. Check Providers
```
https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/auth/providers
```
Should show:
```json
{
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oauth",
    "signinUrl": "...",
    "callbackUrl": "..."
  },
  "credentials": {
    "id": "credentials",
    "name": "credentials",
    "type": "credentials"
  }
}
```

### 2. Test Sign-In Page
```
https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/auth/signin
```
Should load without 500 errors.

---

## Reference File Created
I've created `.env.production.local` with your real values for reference.
- ⚠️ This file is in `.gitignore` and won't be committed
- Use it to copy values into Vercel Dashboard
- **DO NOT** commit this file to GitHub

---

## Expected Timeline
1. Update Vercel variables: 2 minutes
2. Redeploy: 2-3 minutes
3. Test: 1 minute

**Total: ~5 minutes to fix**
