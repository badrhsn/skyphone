# Google OAuth Debugging Guide

## Current Issues Fixed

1. ✅ Added `secret` to NextAuth configuration
2. ✅ Added `allowDangerousEmailAccountLinking: true` to Google provider
3. ✅ Fixed password validation for OAuth users (check for null/undefined)
4. ✅ Removed duplicate auth configuration
5. ✅ Added debug mode for development

## Checklist to Debug Google OAuth

### 1. Verify Environment Variables in Vercel

Go to **Vercel Dashboard → Settings → Environment Variables** and confirm:

- [ ] `NEXTAUTH_URL` = `https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app`
- [ ] `NEXTAUTH_SECRET` = `[your-secret-here]`
- [ ] `GOOGLE_CLIENT_ID` = `[your-google-client-id].apps.googleusercontent.com`
- [ ] `GOOGLE_CLIENT_SECRET` = `GOCSPX-[your-secret]`
- [ ] `DATABASE_URL` = your Supabase connection string

**IMPORTANT:** Make sure these are set for "Production" environment!

### 2. Verify Google Cloud Console

1. Go to https://console.cloud.google.com/apis/credentials
2. Find OAuth Client: `[your-client-id]`
3. Check **Authorized redirect URIs** includes:
   ```
   https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/auth/callback/google
   ```

### 3. Common Issues & Solutions

#### Issue: Page stays on signin, URL changes to `?callbackUrl=...`

**Possible Causes:**
1. ❌ `NEXTAUTH_URL` doesn't match your actual deployment URL
2. ❌ `NEXTAUTH_SECRET` is not set
3. ❌ Google redirect URI not added to Google Console
4. ❌ Environment variables not set in Vercel

**Solution:**
- Double-check ALL environment variables in Vercel
- Redeploy after setting environment variables
- Clear browser cookies and try again

#### Issue: "Configuration" error

**Possible Causes:**
1. ❌ `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` incorrect
2. ❌ Missing `NEXTAUTH_SECRET`

**Solution:**
- Copy credentials directly from Google Console
- Generate new `NEXTAUTH_SECRET` if needed:
  ```bash
  openssl rand -base64 32
  ```

#### Issue: Database error

**Possible Causes:**
1. ❌ `DATABASE_URL` incorrect or inaccessible from Vercel
2. ❌ User table schema doesn't match Prisma schema

**Solution:**
- Test database connection from Vercel
- Make sure `password` field is nullable: `password String?`

### 4. Check Vercel Logs

1. Go to **Vercel Dashboard → Deployments**
2. Click on latest deployment
3. Go to **Runtime Logs**
4. Look for errors related to:
   - NextAuth
   - Google OAuth
   - Database connection
   - Missing environment variables

### 5. Test Locally First

Before testing in Vercel, test locally:

1. Update your `.env.local`:
   ```bash
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=[your-secret-here]
   GOOGLE_CLIENT_ID=[your-client-id].apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-[your-secret]
   DATABASE_URL=your-database-url
   ```

2. Add to Google Console redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

3. Run locally:
   ```bash
   npm run dev
   ```

4. Test Google sign-in at http://localhost:3000/auth/signin

If it works locally but not in Vercel, the issue is with Vercel environment variables!

### 6. Force Redeploy

After setting environment variables:

1. Go to **Vercel Dashboard → Deployments**
2. Click "..." on latest deployment
3. Click **Redeploy**
4. Select **Use existing build cache: No**

This ensures environment variables are picked up.

### 7. Debug API Route

Test the NextAuth configuration directly:

Visit: `https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/auth/providers`

You should see:
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

If you don't see "google", it means:
- `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is missing in Vercel

### 8. Clear Browser Data

Sometimes cached OAuth state causes issues:

1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Clear:
   - Cookies (especially for your domain)
   - Local Storage
   - Session Storage
4. Try signing in again

### 9. Check Account Linking

If you previously signed up with email/password using the same email as your Google account:

The fix added `allowDangerousEmailAccountLinking: true` which allows:
- Signing in with Google using email that already exists
- Linking Google account to existing email account

### 10. What to Look For in Logs

When debugging, look for these patterns in Vercel logs:

**Good signs:**
```
[next-auth][debug] Callback route started
[next-auth][debug] Provider: google
[next-auth][debug] Callback: success
```

**Bad signs:**
```
[next-auth][error] Missing NEXTAUTH_SECRET
[next-auth][error] Invalid credentials
Error: OAuthAccountNotLinked
```

---

## After Fixing

Once Google OAuth works:

1. ✅ Test sign-in flow completely
2. ✅ Verify user is created in database
3. ✅ Check redirect to dashboard works
4. ✅ Verify session persists after refresh

---

## Still Not Working?

If you've tried everything above and it still doesn't work:

1. Share the **Vercel Runtime Logs** (redact sensitive info)
2. Share a screenshot of your **Vercel Environment Variables** page (blur values)
3. Share a screenshot of your **Google Console Authorized Redirect URIs**

This will help identify the exact issue.
