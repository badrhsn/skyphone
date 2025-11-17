# WebRTC Testing Guide

This guide walks you through verifying that the Twilio WebRTC implementation is working correctly.

## Prerequisites

1. **Install dependencies**: Run `npm install` to install `@twilio/voice-sdk`
   ```bash
   npm install
   ```

2. **Verify .env file has all Twilio credentials**:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxx
   TWILIO_API_KEY_SID=SKxxxxxxxxx
   TWILIO_API_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
   TWILIO_TWIML_APP_SID=APxxxxxxxxx
   NEXT_PUBLIC_APP_URL=https://skyphone-app.vercel.app
   ```

3. **Deploy to Vercel** (or use local ngrok tunnel):
   ```bash
   git push origin main
   # Vercel auto-deploys
   ```

## Testing Steps

### Step 1: Verify Diagnostic Endpoint (GET)
Confirms all Twilio credentials are loaded.

**URL**: `https://skyphone-app.vercel.app/api/twilio/voice`  
**Method**: GET

**Expected Response**:
```json
{
  "status": "configured",
  "webhookUrl": "https://skyphone-app.vercel.app/api/twilio/voice",
  "twimlAppSid": "APxxxxxxxxx",
  "accountSid": "ACxxxxxxxxx"
}
```

**What to check**:
- ✅ All fields are present (not null/undefined)
- ✅ `status` = "configured"
- ✅ `twimlAppSid` matches env `TWILIO_TWIML_APP_SID`

---

### Step 2: Run Interactive Diagnostic Test
Tests token generation, microphone access, and Device initialization.

**URL**: `https://skyphone-app.vercel.app/test/twilio`  
**Steps**:
1. Open in browser (mobile or desktop)
2. Click **"🚀 Full Diagnostic"** button
3. Watch the real-time log output
4. When prompted by browser, **grant microphone access**

**Expected Log Output** (in order):
```
🔔 Starting full diagnostic...
🔔 [Token Test] Fetching from /api/twilio/token...
✅ Token Test: SUCCESS
   - Token: eyJ0eXAiOiJKV1QiLC...
   - Identity: user_1234567890

🔔 [Microphone Test] Requesting getUserMedia...
🎤 Permission granted
✅ Microphone Test: SUCCESS

🔔 [Device Test] Initializing Twilio Device...
✅ Device ready event received
✅ Device Test: SUCCESS

🏆 READY FOR CALLS - All systems operational!
```

**What to check**:
- ✅ Token test shows valid JWT (starts with `eyJ`)
- ✅ Mic permission prompt appears
- ✅ Microphone test shows "Permission granted"
- ✅ Device test completes successfully (ready event)
- ✅ Final message says "READY FOR CALLS"

**If something fails**:
- See **Troubleshooting** section below

---

### Step 3: Test Token Endpoint
Verify the `/api/twilio/token` endpoint works directly.

**From test page**: Click **"🔗 Test Token"** button

**Or manually**: Open `https://skyphone-app.vercel.app/api/twilio/token`

**Expected Response**:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "identity": "user_1234567890"
}
```

**What to check**:
- ✅ `token` is a valid JWT (3 base64 parts separated by dots)
- ✅ `identity` starts with `user_` followed by timestamp
- ✅ No 500 errors

---

### Step 4: Test Microphone Access
Verify the browser can access your microphone.

**From test page**: Click **"🎤 Test Mic"** button

**Expected**:
- Browser prompts: "skyphone-app.vercel.app wants to use your microphone"
- You click "Allow"
- Log shows: `✅ Microphone Test: SUCCESS`
- Microphone status shows: "Permission granted"

**If denied**:
- Check browser Settings → Privacy → Microphone (should be "Allow for skyphone-app.vercel.app")
- Try in incognito mode
- Check if another app is using the microphone

---

### Step 5: Make a Test Call
Test end-to-end WebRTC calling.

**URL**: `https://skyphone-app.vercel.app/dashboard/dialer`

**Steps**:
1. Open browser DevTools (F12) → Console tab (to watch logs)
2. Enter a test phone number (e.g., `+212626110866`)
3. Select country and caller ID if needed
4. Click **"CALL"** button
5. Watch the console for logs with emoji indicators:
   - 🔔 = Incoming event
   - ✅ = Success
   - ❌ = Error
   - 📤 = Response sent

**Expected Call Flow** (watch console logs):

```
🔔 Initiating call...
✅ Call initiated to +212626110866
🔔 Ringing...
✅ Connected! Call SID: CA...
```

**Audio indicators**:
- 🔊 You should hear a ringing tone (or answering service)
- 🎤 Microphone LED should be on
- 🔴 "Call in progress" status should show

**To end call**:
- Click **"HANG UP"** button
- Should see: `✅ Call disconnected`

**If call doesn't connect**:
- Check console for ❌ errors
- See **Troubleshooting** section

---

## Troubleshooting

### ❌ Token endpoint returns 500 error

**Possible causes**:
1. Env variables missing or incorrect
2. Twilio API Key SID/Secret invalid

**Fix**:
```bash
# Verify env vars are set
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_API_KEY_SID
echo $TWILIO_API_KEY_SECRET

# If empty, update .env file and redeploy
npm run build
# Then deploy to Vercel
```

### ❌ Microphone permission denied

**Possible causes**:
1. Browser doesn't have permission for this site
2. Another app is using the microphone
3. Site is not HTTPS

**Fix**:
1. Check browser settings:
   - Chrome: Settings → Privacy → Microphone → find skyphone-app.vercel.app
   - Safari: System Preferences → Security & Privacy → Microphone
2. Try different browser (Chrome/Safari/Firefox)
3. Verify site URL starts with `https://` (not `http://`)

### ❌ Device initialization fails (no "ready" event)

**Possible causes**:
1. Token is invalid/expired
2. Twilio SDK not installed
3. Browser doesn't support WebRTC (very rare)

**Fix**:
```bash
# 1. Reinstall SDK
npm install @twilio/voice-sdk

# 2. Verify token is valid:
# Open /api/twilio/token endpoint and copy the JWT
# Visit jwt.io and paste it - should show Twilio payload

# 3. Check browser WebRTC support:
# Open DevTools Console and run:
# navigator.mediaDevices && console.log("WebRTC supported")
```

### ❌ Calls don't connect / No answer

**Possible causes**:
1. TwiML App webhook not reachable
2. Webhook returning invalid TwiML
3. Destination phone number invalid
4. Account balance too low

**Fix**:
```bash
# 1. Verify webhook URL reachable:
curl -X GET https://skyphone-app.vercel.app/api/twilio/voice

# Should return JSON with status="configured"

# 2. Check Twilio console for errors:
# - Go to Twilio Console → Phone Numbers → Your number
# - Click on number, find "Call logs" or "Recent calls"
# - Look for failed calls and error messages

# 3. Verify destination number format:
# Should start with + and country code (e.g., +212626110866)

# 4. Check account balance:
# Twilio Console → Billing → Current Balance
```

### 🔊 No audio during call (call connects but silent)

**Possible causes**:
1. Microphone not selected correctly
2. Browser audio output muted
3. Speaker not connected/enabled

**Fix**:
1. Check OS audio settings (System Preferences → Sound)
2. Check browser audio permissions in settings
3. Try different speakers/headphones
4. Check mute button in dialer UI (should not be active)
5. Verify mic is working with /test/twilio → "Test Mic" button

### 📞 Can't hear incoming calls

**Possible causes**:
1. No incoming TwiML configured
2. Browser volume muted
3. Notification permission denied

**Fix**:
1. Check incoming call banner appears when call comes in
2. Verify system audio is on
3. Grant notification permission if prompted

---

## Advanced Debugging

### View Twilio Logs

1. Go to [Twilio Console](https://www.twilio.com/console)
2. Left sidebar → Voice → Logs
3. Filter by date/time of your test call
4. Click on call SID to see full details

**Look for**:
- ✅ Call initiated to correct number
- ✅ Webhook called and returned 200 OK
- ✅ TwiML parsed successfully
- ✅ Connected to destination

### Enable Browser DevTools Logging

Open DevTools (F12) and watch Console tab during call:

**Expected logs from useCall hook**:
```
✅ Token fetched: eyJ...
✅ Microphone access granted
✅ Twilio Device initialized
🔔 Device ready event
🔔 Outgoing call to +212626110866
✅ Call connected (SID: CA...)
🔔 Call ended
```

### Check Network Requests

1. Open DevTools → Network tab
2. Filter by "XHR" or "Fetch"
3. Make a call and watch requests:

**Expected requests**:
- GET `/api/twilio/token` → 200 with JWT
- POST `/api/twilio/voice` (from Twilio webhook) → 200 with TwiML
- POST `/api/twilio/recording/start` (if recording enabled) → 200

---

## Success Checklist

Before considering WebRTC ready for production:

- [ ] Full Diagnostic test passes (token + mic + device)
- [ ] Token endpoint returns valid JWT
- [ ] Microphone permission prompt appears and can be granted
- [ ] Device initialization completes without errors
- [ ] Can make at least one successful call to a real number
- [ ] Audio flows both ways (can hear caller, caller can hear you)
- [ ] Hang Up button disconnects cleanly
- [ ] Keypad sends DTMF tones during active call
- [ ] Incoming calls show banner and can be accepted/rejected
- [ ] No console errors (except pre-install warnings about Twilio SDK location)

---

## Next Steps

1. **Integrate with production calling system**:
   - Replace server PSTN calls with WebRTC
   - Update routing logic if needed

2. **Implement fallback**:
   - If WebRTC fails, fall back to server-side PSTN
   - Or show user-friendly error message

3. **Monitor in production**:
   - Track call success rates
   - Log errors to analytics
   - Alert on widespread failures

4. **Optimize**:
   - Implement call quality metrics
   - Add bandwidth detection
   - Implement jitter buffer optimization

---

## Quick Reference

| Component | Status | Test Page | Endpoint |
|-----------|--------|-----------|----------|
| Token Generation | ✅ Ready | Click "🔗 Test Token" | `GET /api/twilio/token` |
| Microphone Access | ✅ Ready | Click "🎤 Test Mic" | Browser `getUserMedia()` |
| Device Init | ✅ Ready | Part of "🚀 Full Diagnostic" | `@twilio/voice-sdk` |
| Call Initiation | ✅ Ready | Use /dashboard/dialer | `POST device.connect()` |
| Voice Webhook | ✅ Ready | Click "🚀 Full Diagnostic" → Logs | `POST /api/twilio/voice` |
| Recording | ✅ Ready | Click "Record" in dialer | `POST /api/twilio/recording/*` |
| Incoming Calls | ✅ Ready | Have someone call your TwiML number | Device event listener |
| DTMF Support | ✅ Ready | Use keypad during active call | `connection.sendDigits()` |

---

**Questions or issues?** Check the error logs in Twilio Console or open DevTools to see detailed error messages.
