# Google OAuth Setup Instructions

## To enable Google Sign-In/Sign-Up:

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API

### 2. Create OAuth 2.0 Credentials
1. Go to "Credentials" in the sidebar
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### 3. Update Environment Variables
Replace the placeholder values in `.env.local`:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="your-actual-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-actual-google-client-secret-here"
```

### 4. Test Google Authentication
1. Restart your development server: `npm run dev`
2. Go to `/auth/signin` or `/auth/signup`
3. Click "Continue with Google"
4. New Google users will automatically get $5.00 starting balance!

## Current Status
- ✅ Google OAuth is properly configured in the code
- ✅ Automatic user creation for new Google sign-ups
- ✅ Graceful fallback when Google OAuth isn't configured
- ❌ Google OAuth credentials need to be added to `.env.local`

## Test Without Google OAuth
You can still test the app using the credential-based auth:
- **Test User:** `test@yadaphone.com` / `password123`
- **Admin User:** `admin@yadaphone.com` / `password123`