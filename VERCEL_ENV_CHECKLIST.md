# Vercel Environment Variables Checklist

## ✅ Required Environment Variables for Google OAuth

### Current Deployment URL
```
https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app
```

### Environment Variables to Set in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

#### 1. NextAuth Configuration
```bash
NEXTAUTH_URL=https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app
NEXTAUTH_SECRET=generate-a-secure-random-string-at-least-32-characters
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

#### 2. Google OAuth
```bash
GOOGLE_CLIENT_ID=your-google-client-id-from-console
GOOGLE_CLIENT_SECRET=your-google-client-secret-from-console
```

#### 3. Database
```bash
DATABASE_URL=your-postgresql-connection-string
```

#### 4. Twilio
```bash
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

#### 5. Stripe
```bash
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

#### 6. App URLs
```bash
NEXT_PUBLIC_APP_URL=https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app
```

---

## 🔧 Google Cloud Console Setup

### 1. Go to Google Cloud Console
https://console.cloud.google.com/

### 2. Navigate to OAuth Settings
1. Click **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID
3. Click **Edit**

### 3. Add Authorized Redirect URIs
Add this URL to **Authorized redirect URIs**:
```
https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/api/auth/callback/google
```

### 4. Also Add (if using custom domain later)
```
https://yourdomain.com/api/auth/callback/google
```

---

## 🚀 After Setting Environment Variables

1. **Redeploy** your Vercel app or wait for automatic deployment
2. **Test Google Sign-In** at:
   ```
   https://skyphone-51qw2kmof-badrhsn96-8179s-projects.vercel.app/auth/signin
   ```

---

## 🐛 Troubleshooting

### If Google Sign-In Still Doesn't Work:

1. **Check Vercel Logs**
   - Go to Vercel Dashboard → Deployments → Select latest → Runtime Logs
   - Look for NextAuth or Google OAuth errors

2. **Verify Environment Variables Are Set**
   ```bash
   # All variables should show in Vercel dashboard
   # Make sure they're set for "Production" environment
   ```

3. **Common Issues:**
   - ❌ `NEXTAUTH_URL` doesn't match actual deployment URL
   - ❌ Google redirect URI not added to Google Console
   - ❌ `NEXTAUTH_SECRET` not set or too short
   - ❌ `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` incorrect

4. **Test Database Connection**
   - Make sure `DATABASE_URL` is correct
   - User table should exist (check Prisma schema is pushed)

---

## 📝 Quick Command Reference

### Generate NEXTAUTH_SECRET locally
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Test environment variables (in Vercel CLI)
```bash
vercel env ls
```

### Pull environment variables locally
```bash
vercel env pull .env.local
```

---

## ✨ Production Deployment (Custom Domain)

When you add a custom domain to Vercel:

1. Update `NEXTAUTH_URL` to your custom domain:
   ```bash
   NEXTAUTH_URL=https://yourdomain.com
   ```

2. Update Google redirect URI:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

3. Update `NEXT_PUBLIC_APP_URL`:
   ```bash
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

4. Redeploy after changes
