# WebRTC Debugging Guide

Complete troubleshooting guide for diagnosing issues with Twilio WebRTC calling.

## Quick Start

### Access the Debug Dashboard
Navigate to: **`https://skyphone-app.vercel.app/debug`**

This interactive page provides:
- 🔗 **Test Token** - Verify token endpoint works
- 🔐 **Test API Key** - Check API key permissions
- 🌐 **Test Webhook** - Verify webhook reachability
- 🚀 **Full Diagnostic** - Run all tests at once

### Expected Results
If everything is configured correctly, you should see:
```
✅ Token Endpoint        - Working
✅ API Key               - Valid permissions
✅ Webhook               - Reachable
✅ Microphone            - Permission granted
```

---

## Debug Endpoints

### 1. Token Generation: `/api/twilio/token`

**What it does**: Issues a JWT AccessToken for browser WebRTC authentication

**Test it**:
```bash
curl https://skyphone-app.vercel.app/api/twilio/token | jq
```

**Expected Response**:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "identity": "user_1234567890"
}
```

**Troubleshooting**:
| Error | Cause | Fix |
|-------|-------|-----|
| `TWILIO_ACCOUNT_SID not configured` | Missing env var | Add to .env: `TWILIO_ACCOUNT_SID=ACxxxxxxxxx` |
| `TWILIO_API_KEY_SID not configured` | Missing env var | Add to .env: `TWILIO_API_KEY_SID=SKxxxxxxxxx` |
| `TWILIO_API_KEY_SECRET not configured` | Missing env var | Add to .env: `TWILIO_API_KEY_SECRET=xxxx` |
| `TWIML_APP_SID not configured` | Missing env var | Add to .env: `TWIML_APP_SID=APxxxxxxxxx` |
| `Invalid API Key` | API Key invalid or expired | Go to twilio.com/console/account/keys and create new |

**Server Logs** (if deployed):
Watch server logs in Vercel to see detailed token generation logs:
```
🔷 [Token] Token endpoint called
🔷 [Token] All env vars found
🔷 [Token] Twilio module imported successfully
✅ [Token] Token generated
```

---

### 2. API Key Permissions: `/api/twilio/debug/verify-api-key`

**What it does**: Verifies the Twilio API Key has Voice grant permissions

**Test it**:
```bash
curl https://skyphone-app.vercel.app/api/twilio/debug/verify-api-key | jq
```

**Expected Response** (Valid):
```json
{
  "valid": true,
  "status": "API Key has proper Voice permissions",
  "details": {
    "accountSid": "AC***",
    "apiKeySid": "SK***",
    "twimlAppSid": "configured",
    "canCreateTokens": true,
    "voiceGrantSupported": true
  },
  "recommendations": [
    "✅ API Key is configured correctly for WebRTC calls",
    "✅ VoiceGrant permissions are available",
    "✅ Token generation should work"
  ]
}
```

**Expected Response** (Invalid):
```json
{
  "valid": false,
  "error": "Invalid API Key",
  "recommendations": [
    "❌ Invalid API Key SID or Secret",
    "→ Verify TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET in .env",
    "→ Go to https://www.twilio.com/console/account/keys"
  ]
}
```

**Troubleshooting**:
| Problem | Solution |
|---------|----------|
| API Key rejected | 1. Copy fresh API Key from twilio.com/console/account/keys<br/>2. Update .env with new SID and Secret<br/>3. Redeploy to Vercel |
| Says "no Voice permissions" | 1. Delete old API Key<br/>2. Create new API Key<br/>3. Ensure Voice capability is enabled |
| Still failing | Try with your Account SID/Auth Token (less secure) |

---

### 3. Webhook Reachability: `/api/twilio/debug/webhook-reachability`

**What it does**: Verifies Twilio can reach your voice webhook endpoint

**Test it**:
```bash
curl https://skyphone-app.vercel.app/api/twilio/debug/webhook-reachability | jq
```

**Expected Response** (Reachable):
```json
{
  "reachable": true,
  "status": "Voice webhook is properly configured and reachable",
  "details": {
    "webhookUrl": "https://skyphone-app.vercel.app/api/twilio/voice",
    "twimlAppSid": "APxxxxxxxxx",
    "voiceMethod": "POST",
    "configurationStatus": "ready"
  },
  "recommendations": [
    "✅ Webhook URL is configured in TwiML App",
    "✅ URL is publicly accessible",
    "✅ Twilio can reach your server"
  ]
}
```

**Expected Response** (Not Reachable):
```json
{
  "reachable": false,
  "error": "Voice webhook not configured in TwiML App",
  "steps": [
    "1. Go to Twilio Console → Phone Numbers → Manage → Active Numbers",
    "2. Click your phone number",
    "3. Under 'Call comes in', set Request URL to:",
    "   https://skyphone-app.vercel.app/api/twilio/voice",
    "4. Set Method to POST",
    "5. Save"
  ]
}
```

**Troubleshooting**:

#### ❌ "Voice webhook not configured"
**Fix**:
1. Go to [Twilio Console - Phone Numbers](https://www.twilio.com/console/phone-numbers/incoming)
2. Click your phone number
3. Under "A Call Comes In", set:
   - **Request URL**: `https://skyphone-app.vercel.app/api/twilio/voice`
   - **Method**: POST
4. Save and wait 30 seconds for changes to propagate

#### ❌ "Webhook is not reachable"
**Fix**:
1. Verify app is deployed to Vercel (not localhost):
   ```bash
   # Check deployment
   git status
   git push origin main
   # Wait for Vercel to deploy (check https://vercel.com)
   ```

2. Verify HTTPS endpoint (not HTTP):
   ```bash
   # Test webhook directly
   curl -v https://skyphone-app.vercel.app/api/twilio/voice
   # Should return 400 (no params) not error
   ```

3. Check firewall rules don't block Twilio IPs

#### ❌ "Unexpected error during webhook test"
**Fix**:
1. Check `/api/twilio/voice` endpoint exists:
   ```bash
   curl https://skyphone-app.vercel.app/api/twilio/voice
   ```
   Should return something like: `Missing parameters`

2. Check server logs in Vercel for errors

3. Verify TwiML App SID is correct:
   ```bash
   echo $TWIML_APP_SID  # Should output APxxxxxxxxx
   ```

---

## Complete Diagnostic Flow

### Step 1: Token Generation
```
Browser requests /api/twilio/token
   ↓
Server loads env vars (ACCOUNT_SID, API_KEY_SID, API_KEY_SECRET, TWIML_APP_SID)
   ↓
Server creates Twilio AccessToken with VoiceGrant
   ↓
Server returns JWT token
   ↓
Browser stores token for Device initialization
```

**If fails**: Check env vars in Vercel settings

### Step 2: API Key Validation
```
Test creates AccessToken using API Key
   ↓
Tries to add VoiceGrant
   ↓
If grant added successfully → API Key is valid
   ↓
If error → API Key missing Voice permissions
```

**If fails**: Recreate API Key with proper permissions

### Step 3: Webhook Configuration
```
Twilio dials → Calls POST /api/twilio/voice
   ↓
Server receives call params (To, From, etc.)
   ↓
Server returns TwiML with <Dial> command
   ↓
Twilio executes TwiML (connects call)
```

**If fails**: Check TwiML App webhook URL configuration

### Step 4: Device Initialization
```
Browser calls fetch('/api/twilio/token')
   ↓
Browser receives JWT
   ↓
Browser creates Twilio.Device(token)
   ↓
Device connects to Twilio → device.on('ready')
   ↓
Device ready to make calls
```

**If fails**: Check token validity and SDK installation

---

## Common Issues & Solutions

### ❌ "No audio during calls"

**Symptoms**: Call connects but no sound.

**Checklist**:
1. Microphone permission granted?
   - Test at `/debug` page → click "Test Mic"
   - Should see "Permission granted"

2. Browser volume not muted?
   - Check System Preferences → Sound
   - Check browser audio settings

3. Microphone actually working?
   - Test with other app (Zoom, FaceTime)
   - Try different microphone/headset

4. Speaker not muted?
   - Check dialer UI for "Speaker" button status
   - Check system volume is > 0

5. Check call logs in Twilio:
   - Go to [Twilio Console - Logs](https://www.twilio.com/console/voice/logs)
   - Find your call, check media properties

---

### ❌ "Call doesn't connect"

**Symptoms**: Call dials but never connects.

**Checklist**:
1. **Webhook reachable?**
   - Test: `/api/twilio/debug/webhook-reachability`
   - Should return `reachable: true`

2. **TwiML App configured?**
   - Go to [Twilio Console - TwiML Apps](https://www.twilio.com/console/twiml-apps)
   - Find your app, verify Voice URL is set
   - URL should be: `https://skyphone-app.vercel.app/api/twilio/voice`

3. **Destination number valid?**
   - Should start with + and country code
   - Example: `+212626110866` ✅ vs `0626110866` ❌

4. **Account balance sufficient?**
   - Go to [Twilio Console - Billing](https://www.twilio.com/console/billing/usage/costs)
   - Check balance > $0

5. **Check Twilio logs**:
   - Go to [Twilio Console - Voice Logs](https://www.twilio.com/console/voice/logs)
   - Look for your call
   - Check error message for clue

---

### ❌ "Token endpoint returns 500 error"

**Symptoms**: `/api/twilio/token` returns HTTP 500

**Solution**:
```bash
# 1. Check env vars are set in Vercel
cd /Users/badr/yadaphone-app
cat .env | grep TWILIO

# Should see:
# TWILIO_ACCOUNT_SID=ACxxxxxxxxx
# TWILIO_API_KEY_SID=SKxxxxxxxxx
# TWILIO_API_KEY_SECRET=xxxxxx
# TWIML_APP_SID=APxxxxxxxxx

# 2. If any are empty, add them to .env

# 3. Verify in Vercel dashboard
# Go to Settings → Environment Variables
# Verify all Twilio vars are there

# 4. Redeploy
git push origin main
# Wait for Vercel deployment to complete

# 5. Test endpoint
curl https://skyphone-app.vercel.app/api/twilio/token
```

---

### ❌ "Device initialization timeout"

**Symptoms**: Device doesn't reach `ready` state after 10 seconds

**Solution**:
1. Check token is valid:
   - Fetch `/api/twilio/token`
   - Copy token value
   - Go to [jwt.io](https://jwt.io)
   - Paste token, should show Twilio claims

2. Check SDK installed:
   ```bash
   npm list twilio-client
   # Should show: twilio-client@1.15.1
   ```

3. Check browser console for errors:
   - Open DevTools (F12)
   - Watch Console tab during device init
   - Look for error messages

4. Try in different browser:
   - Chrome/Firefox/Safari have different WebRTC support
   - Check [caniuse.com](https://caniuse.com) for WebRTC support

---

### ❌ "Microphone permission denied"

**Symptoms**: Browser doesn't ask for mic permission or user denies it

**Solution**:
1. **Grant permission**:
   - Chrome: Settings → Privacy & Security → Microphone → Add site
   - Safari: System Preferences → Security & Privacy → Microphone
   - Firefox: about:preferences → Privacy → Permissions → Microphone

2. **Use HTTPS**:
   - Mic access requires secure context
   - Localhost is exception, but production must be HTTPS

3. **Try incognito mode**:
   - Open Dev Tools → 3 dots → More Tools → New incognito window
   - Try accessing app in incognito
   - This bypasses site-specific permissions

4. **Check OS permissions**:
   - System Preferences → Security & Privacy → Microphone
   - Ensure browser app is listed

---

## Quick Reference: Env Vars

Required environment variables in `.env`:

```bash
# Core Twilio Account
TWILIO_ACCOUNT_SID=ACxxxxxxxxx        # Your account SID
TWILIO_API_KEY_SID=SKxxxxxxxxx        # API Key SID (not auth token)
TWILIO_API_KEY_SECRET=xxxxx           # API Key Secret
TWIML_APP_SID=APxxxxxxxxx             # TwiML App SID for outgoing calls

# App Configuration
NEXT_PUBLIC_APP_URL=https://skyphone-app.vercel.app  # Public URL (must be HTTPS)

# Database
DATABASE_URL=mysql://user:pass@host/db

# Auth
NEXTAUTH_SECRET=xxxxx
NEXTAUTH_URL=https://skyphone-app.vercel.app

# Other services (Stripe, etc.)
STRIPE_SECRET_KEY=sk_live_xxxxx
```

**How to find each**:

| Var | Location |
|-----|----------|
| TWILIO_ACCOUNT_SID | [Console → Account](https://www.twilio.com/console) → Account SID |
| TWILIO_API_KEY_SID | [Console → Keys](https://www.twilio.com/console/account/keys) → Create new or use existing |
| TWILIO_API_KEY_SECRET | [Console → Keys](https://www.twilio.com/console/account/keys) → (shown when created) |
| TWIML_APP_SID | [Console → TwiML Apps](https://www.twilio.com/console/twiml-apps) → Create or find existing |
| NEXT_PUBLIC_APP_URL | Your app deployment URL (Vercel) |

---

## Testing Workflow

Use this step-by-step workflow to isolate issues:

```
1. Access /debug page
   ↓
2. Click "🔗 Test Token"
   ↓ (if fails, fix env vars)
   ↓
3. Click "🔐 Test API Key"
   ↓ (if fails, recreate API Key)
   ↓
4. Click "🌐 Test Webhook"
   ↓ (if fails, configure TwiML App)
   ↓
5. Click "🎤 Test Mic"
   ↓ (grant permission when prompted)
   ↓
6. Make test call in /dashboard/dialer
   ↓
7. Watch console logs for 🔔/✅/❌ indicators
```

---

## Monitor Calls in Twilio

Real-time monitoring of calls:

1. **Active Calls**: [Twilio Console → Voice → Active Calls](https://www.twilio.com/console/voice/calls)

2. **Call Logs**: [Twilio Console → Voice → Logs](https://www.twilio.com/console/voice/logs)
   - Filter by date/time
   - Click call SID for details
   - Check "Media" tab for audio properties

3. **Phone Numbers**: [Twilio Console → Phone Numbers](https://www.twilio.com/console/phone-numbers/incoming)
   - Click number
   - View call logs for that specific number

4. **Error Messages**: Check the "Duration" and "Error" columns for failures

---

## Performance Tips

To ensure best performance:

1. **Use HTTPS only** (required for WebRTC)
2. **Keep tokens fresh** (1-hour TTL, refresh periodically)
3. **Close connections properly** (use hangUp button)
4. **Monitor call quality** (check audio bitrate in Twilio logs)
5. **Test from different networks** (mobile, WiFi, 4G)

---

## When All Else Fails

1. **Check Twilio Status**: [status.twilio.com](https://status.twilio.com)
2. **Review API Documentation**: [Twilio Voice API](https://www.twilio.com/docs/voice)
3. **Contact Twilio Support**: [console.twilio.com/support](https://console.twilio.com/support)
4. **Check Server Logs**: Vercel dashboard → Function Logs
5. **Enable Debug Mode**: Twilio SDK debug flag in console

---

## Support Resources

- 📚 [Twilio Voice Documentation](https://www.twilio.com/docs/voice)
- 🔧 [Twilio Console](https://www.twilio.com/console)
- 💬 [Twilio Community](https://support.twilio.com)
- 🐛 [GitHub Issues](https://github.com/badrhsn/skyphone/issues)

