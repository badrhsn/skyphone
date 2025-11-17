# Vercel Environment Variables Setup

## 🚨 Current Issue
Your production app on Vercel is missing the Twilio environment variables. They're in your `.env` file locally but haven't been added to Vercel yet.

## ✅ Quick Fix (2 minutes)

### Step 1: Go to Vercel Dashboard
https://vercel.com/dashboard

### Step 2: Select Your Project
Click on `skyphone` project

### Step 3: Go to Settings
Settings → Environment Variables

### Step 4: Add These Variables

Copy the values from your `.env` file and paste into Vercel:

```
TWILIO_ACCOUNT_SID=(from your .env file)
TWILIO_API_KEY_SID=(from your .env file)
TWILIO_API_KEY_SECRET=(from your .env file)
TWIML_APP_SID=(from your .env file)
TWILIO_PHONE_NUMBER=(from your .env file)
NEXT_PUBLIC_APP_URL=https://skyphone-app.vercel.app
```

### Step 5: Redeploy
After adding variables:
1. Go to **Deployments** tab
2. Click the most recent deployment
3. Click **Redeploy**

Wait 30-60 seconds for deployment to complete.

## ✅ Verify It Works

Test the token endpoint:
```bash
curl https://skyphone-app.vercel.app/api/twilio/token
```

Should return:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLC...",
  "identity": "user_1234567890"
}
```

## 📱 Test in Production

1. Open: https://skyphone-app.vercel.app/debug
2. Click **"🚀 Full System Diagnostic"**
3. All tests should pass ✅

Then test calls:
1. Go to: https://skyphone-app.vercel.app/dashboard/dialer
2. Enter a phone number
3. Click CALL
4. Listen for dialing tone

## 🆘 If Still Not Working

### Check Current Variables
1. Go to: Settings → Environment Variables
2. Verify all 6 variables are there
3. Make sure values match exactly

### Recheck Vercel
1. Click the red "X" to redeploy if needed
2. Wait for build to complete
3. Test again

### View Logs
1. Go to Deployments
2. Click latest deployment
3. Scroll down to see build logs and runtime errors
4. Check for "not configured" errors

## 🔗 All Required Variables for Reference

| Variable | Value |
|----------|-------|
| TWILIO_ACCOUNT_SID | Get from `.env` file |
| TWILIO_API_KEY_SID | Get from `.env` file |
| TWILIO_API_KEY_SECRET | Get from `.env` file |
| TWIML_APP_SID | Get from `.env` file |
| TWILIO_PHONE_NUMBER | Get from `.env` file |
| NEXT_PUBLIC_APP_URL | https://skyphone-app.vercel.app |

## 📝 Alternative: Using Vercel CLI

If you prefer command line:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_API_KEY_SID
vercel env add TWILIO_API_KEY_SECRET
vercel env add TWIML_APP_SID
vercel env add TWILIO_PHONE_NUMBER
vercel env add NEXT_PUBLIC_APP_URL

# Redeploy
vercel --prod
```

---

Once variables are added and redeployed, your production WebRTC calling will be live! 🎉
