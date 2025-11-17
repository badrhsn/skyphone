# Twilio WebRTC Setup Guide

## ⚠️ Missing Configuration: TWIML_APP_SID

Your WebRTC integration needs one more credential to work: **TWIML_APP_SID**

## Quick Setup (5 minutes)

### Step 1: Get Your TwiML App SID

1. Go to [Twilio Console](https://www.twilio.com/console)
2. Sign in with your account
3. Navigate to: **Voice → Manage → TwiML Apps**
4. Click **Create new TwiML App** (or use existing one)
5. Fill in:
   - **Friendly Name**: `SkyPhone WebRTC App`
   - **Voice URL**: `https://your-app-url.vercel.app/api/twilio/voice`
   - **Voice Method**: POST
   - Click **Create**
6. **Copy the SID** (starts with `AP`)

### Step 2: Update Environment Variables

**For Local Development (.env.local):**
```env
TWIML_APP_SID="APxxxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**For Production (Vercel):**
```
TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Step 3: Restart Your Application

```bash
# Kill any running dev server
npm run dev
```

### Step 4: Verify Configuration

Open `/debug` page to run diagnostics:
```
http://localhost:3000/debug
```

Or test the token endpoint directly:
```bash
curl http://localhost:3000/api/twilio/token
```

## All Required Environment Variables

```env
# Required for WebRTC
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_API_KEY_SID="SKxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_API_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
TWIML_APP_SID="APxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_PHONE_NUMBER="+1234567890"

# Required for app
NEXT_PUBLIC_APP_URL="https://your-app-url.vercel.app"
NEXTAUTH_URL="https://your-app-url.vercel.app"
NEXTAUTH_SECRET="your-secret-key"

# Database
DATABASE_URL="postgresql://user:password@host/dbname"

# Google OAuth
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxxxx"
```

## Where to Find Each Value

| Variable | How to Find |
|----------|------------|
| `TWILIO_ACCOUNT_SID` | Twilio Console → Account Info (starts with AC) |
| `TWILIO_API_KEY_SID` | Twilio Console → Account → Keys & Credentials → API Keys (starts with SK) |
| `TWILIO_API_KEY_SECRET` | Twilio Console → Account → Keys & Credentials → API Keys (secret) |
| `TWIML_APP_SID` | Twilio Console → Voice → Manage → TwiML Apps (starts with AP) |
| `TWILIO_PHONE_NUMBER` | Twilio Console → Phone Numbers → Active Numbers |

## Testing the Setup

### 1. Test Token Endpoint

```bash
# Should return a valid JWT token
curl http://localhost:3000/api/twilio/token
```

**Success Response:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLC...",
  "identity": "user_1234567890"
}
```

### 2. Test Diagnostic Page

Open: `http://localhost:3000/debug`

Click **"🚀 Full System Diagnostic"** to verify all components:
- ✅ Token endpoint working
- ✅ API Key permissions valid
- ✅ Webhook reachable by Twilio
- ✅ Microphone access available

### 3. Make a Test Call

1. Navigate to `/dashboard/dialer`
2. Enter a test phone number
3. Click **CALL**
4. Listen for dialing tone
5. Hang up with **END CALL**

## Troubleshooting

### ❌ "TWIML_APP_SID not configured"

**Solution:** Add `TWIML_APP_SID` to `.env.local`:
```env
TWIML_APP_SID="APxxxxxxxxxxxxxxxxxxxxxxxx"
```

### ❌ Token endpoint returns 500 error

**Check:**
1. All Twilio env vars are set correctly
2. API Key has Voice grant enabled
3. Restart the dev server after updating `.env.local`

```bash
# Restart dev server
npm run dev
```

### ❌ "Webhook not reachable"

**Check:**
1. TWIML_APP_SID Voice URL is set to: `https://your-app.vercel.app/api/twilio/voice`
2. App is deployed to Vercel (localhost won't work)
3. URL uses HTTPS (required by Twilio)

### ❌ Call fails with "Application error"

**Check:**
1. Voice URL in TwiML App is correct
2. `/api/twilio/voice` endpoint exists and responds
3. Twilio can reach your server (check firewall)

## Getting Help

1. **Check logs**: Open browser DevTools → Console
2. **Run diagnostics**: Go to `/debug` page
3. **Review documentation**: Check `WEBRTC_TESTING_GUIDE.md`
4. **API Key issues?** Go to: https://www.twilio.com/console/account/keys

## Next Steps

Once configuration is complete:
1. ✅ Make test calls in `/dashboard/dialer`
2. ✅ Verify balance updates in real-time
3. ✅ Check calls appear in `/dashboard/history`
4. ✅ Deploy to production

---

**Need more help?** Check these files:
- `DELIVERY_SUMMARY.md` - Implementation overview
- `WEBRTC_TESTING_GUIDE.md` - Detailed testing guide
- `DOCUMENTATION_INDEX.md` - All documentation index
