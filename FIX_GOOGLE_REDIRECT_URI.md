# Fix Google OAuth redirect_uri_mismatch Error

## ✅ Good News!
Vercel protection is now disabled and we can see the real error.

## ❌ The Problem
```
Error 400: redirect_uri_mismatch
```

This means Google is rejecting the sign-in because the **redirect URI** (callback URL) in your Google Cloud Console doesn't match what NextAuth is sending.

---

## 🔧 Fix: Add Correct Redirect URI to Google Console

### Step 1: Go to Google Cloud Console
https://console.cloud.google.com/apis/credentials

### Step 2: Find Your OAuth 2.0 Client ID
Look for: `585140322735-8nhnejk0ciasa9hhej7mb4ntq7tf9ele`

Click on it to edit.

### Step 3: Add Authorized Redirect URI

Scroll down to **"Authorized redirect URIs"**

**Add this EXACT URL:**
```
https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/auth/callback/google
```

⚠️ **CRITICAL:**
- Must be **HTTPS** (not http)
- Must be **EXACT match** - no trailing slash
- Must include `/api/auth/callback/google` path

### Step 4: Click SAVE

Wait 1-2 minutes for Google to propagate the changes.

---

## 📋 Current vs Required

### What Google Currently Has
You probably have something like:
- `http://localhost:3000/api/auth/callback/google` ✅ (for local dev)
- Maybe some old URL ❌

### What You Need to ADD
```
https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/auth/callback/google
```

**Keep BOTH** - one for local, one for Vercel!

---

## 🎯 Complete List of Redirect URIs You Should Have

In Google Console, you should have:

```
http://localhost:3000/api/auth/callback/google
https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/auth/callback/google
```

First one = local development
Second one = Vercel deployment

---

## ✅ Verify Environment Variable

While you're at it, double-check Vercel has:

**In Vercel Dashboard → Settings → Environment Variables:**

```
NEXTAUTH_URL=https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app
```

Must match EXACTLY with the redirect URI.

---

## 🧪 After Fixing

### 1. Wait 2 minutes for Google to update

### 2. Test Google Sign-In
Go to: https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/auth/signin

Click "Continue with Google"

Should redirect to Google, then back successfully!

### 3. If Still Fails

Check the error message:
- Still `redirect_uri_mismatch`? → Check for typos in Google Console
- Different error? → Share it and we'll debug

---

## 📸 Screenshot Guide

In Google Cloud Console, it should look like:

```
Authorized redirect URIs
┌─────────────────────────────────────────────────────────────┐
│ http://localhost:3000/api/auth/callback/google        [DEL] │
│ https://skyphone-51qw2kmof-badrhsn96-8179s-proje...  [DEL] │
│   (full URL: /api/auth/callback/google)                     │
└─────────────────────────────────────────────────────────────┘
[+ ADD URI]
```

---

## Common Mistakes to Avoid

❌ `https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/` (missing path)
❌ `https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/auth/callback/google/` (trailing slash)
❌ `http://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/auth/callback/google` (http instead of https)
❌ Using a different Vercel URL than what's in NEXTAUTH_URL

✅ `https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/auth/callback/google`

---

## Quick Checklist

- [ ] Go to https://console.cloud.google.com/apis/credentials
- [ ] Click on OAuth 2.0 Client ID (585140322735-8nhnejk0ciasa9hhej7mb4ntq7tf9ele)
- [ ] Scroll to "Authorized redirect URIs"
- [ ] Add: `https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/auth/callback/google`
- [ ] Click SAVE
- [ ] Wait 2 minutes
- [ ] Test Google sign-in again

---

## 🎉 Expected Result

After adding the redirect URI, Google OAuth should work:

1. Click "Continue with Google"
2. Redirect to Google sign-in
3. Choose account (badr.hsn96@gmail.com)
4. Redirect back to your app
5. Successfully signed in to dashboard

---

**Add the redirect URI to Google Console now, wait 2 minutes, then test again!**
