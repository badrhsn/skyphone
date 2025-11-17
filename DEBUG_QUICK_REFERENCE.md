# 🔧 WebRTC Debugging Quick Reference

## 📊 Status Check (1 minute)

**Navigate to**: `https://skyphone-app.vercel.app/debug`

### What You'll See
- **Token Endpoint** - Green ✅ if working
- **API Key** - Green ✅ if has Voice permissions  
- **Webhook** - Green ✅ if Twilio can reach it
- **Microphone** - Green ✅ if permission granted

**Goal**: All four should be green ✅

---

## 🚨 If Something Is Red ❌

### ❌ Token Endpoint Failed

**Root Cause**: Missing environment variables

**Quick Fix**:
```bash
# Check your .env file has:
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxx  
TWILIO_API_KEY_SECRET=xxxxxx
TWIML_APP_SID=APxxxxxxxxx

# If empty, get from:
# - Account SID: https://www.twilio.com/console
# - API Key: https://www.twilio.com/console/account/keys
# - TwiML App: https://www.twilio.com/console/twiml-apps
```

**Then**: 
- Update .env locally
- Push to GitHub: `git push origin main`
- Wait for Vercel deployment

---

### ❌ API Key Failed

**Root Cause**: API Key doesn't have Voice permissions or is invalid

**Quick Fix**:
1. Go to https://www.twilio.com/console/account/keys
2. Delete the current API Key
3. Create a NEW API Key (Voice permissions should be automatic)
4. Copy the new SID and Secret
5. Update `.env`
6. Run: `git push origin main`

---

### ❌ Webhook Failed

**Root Cause**: Twilio can't reach your server or webhook not configured

**Quick Fix**:

**Step 1**: Verify app is deployed
```bash
# Is it on Vercel?
curl https://skyphone-app.vercel.app/api/twilio/voice
# Should return: Missing parameters (not error)
```

**Step 2**: Configure TwiML App
1. Go to https://www.twilio.com/console/twiml-apps
2. Find your TwiML App
3. Set **Voice URL** to: `https://skyphone-app.vercel.app/api/twilio/voice`
4. Set **Method** to: `POST`
5. Click Save
6. Wait 30 seconds for propagation

---

### ❌ Microphone Failed

**Root Cause**: Browser permission denied or no microphone

**Quick Fix**:

**Option 1**: Grant permission
- Chrome: Settings → Privacy → Microphone → Allow skyphone-app.vercel.app
- Safari: System Preferences → Microphone → Check browser is listed
- Firefox: about:preferences → Privacy → Permissions → Microphone

**Option 2**: Use different browser
- Try Chrome if using Safari
- Try Firefox if Chrome doesn't work

**Option 3**: Check system
- System Preferences → Security & Privacy → Microphone
- Ensure app has permission

---

## 📋 Test Checklist

Run these in order:

```
□ Access /debug page
  └─ All 4 tests green ✅?

□ Make a test call in /dashboard/dialer  
  └─ Can you hear ringing? ✅

□ Open DevTools (F12) → Console
  └─ See green ✅ logs? ✅

□ During call: Can the other person hear you?
  └─ Both directions working? ✅

□ Try: Mute button, DTMF (keypad), Hangup
  └─ All functions working? ✅
```

---

## 🔗 Direct API Tests

### Token (Should return JWT)
```bash
curl https://skyphone-app.vercel.app/api/twilio/token | jq
```

### API Key Validation
```bash
curl https://skyphone-app.vercel.app/api/twilio/debug/verify-api-key | jq
```

### Webhook Reachability  
```bash
curl https://skyphone-app.vercel.app/api/twilio/debug/webhook-reachability | jq
```

### Voice Webhook Test
```bash
curl https://skyphone-app.vercel.app/api/twilio/voice
# Should say: Missing parameters
```

---

## 🐛 Console Logs During Call

Open DevTools (F12) → Console tab and watch during a call.

**Expected logs** (green = ✅ success):
```
✅ [Token] Token fetched successfully
✅ [useCall] Microphone permission granted
✅ [useCall] Twilio Device initialized
🔔 [useCall] Initiating call to +212626110866
✅ [useCall] Call connected (SID: CA...)
```

**Bad logs** (red = ❌ error):
```
❌ [Token] TWILIO_ACCOUNT_SID not configured
❌ [useCall] Device initialization failed
❌ [useCall] Call failed: Webhook unreachable
```

---

## 💾 Env Vars Location

**Local Development** (create/update):
```bash
# /Users/badr/yadaphone-app/.env
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxx
TWILIO_API_KEY_SECRET=xxxxxx
TWIML_APP_SID=APxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://skyphone-app.vercel.app
```

**Vercel Production**:
1. Go to https://vercel.com/skyphone/skyphone
2. Settings → Environment Variables
3. Update all TWILIO_* vars
4. Redeploy (or auto-redeploy triggers)

---

## 📱 Common Scenarios

| Scenario | Check | Fix |
|----------|-------|-----|
| No sound heard | Mic permission at /debug | Grant in browser settings |
| Call won't dial | Webhook status at /debug | Configure TwiML App |
| Token returns 500 | Env vars in .env | Add missing vars |
| Device won't init | Console logs (F12) | Check token validity |
| Can't hear caller | Speaker not muted | Check system volume |
| Caller can't hear you | Check mute button | Verify not active |

---

## 🔗 Helpful Links

- **Twilio Console**: https://www.twilio.com/console
- **Phone Numbers**: https://www.twilio.com/console/phone-numbers
- **TwiML Apps**: https://www.twilio.com/console/twiml-apps
- **API Keys**: https://www.twilio.com/console/account/keys
- **Voice Logs**: https://www.twilio.com/console/voice/logs
- **Status Page**: https://status.twilio.com

---

## 🆘 Still Stuck?

1. **Check Twilio Status**: Is Twilio down? https://status.twilio.com

2. **Review Logs**: 
   - Twilio Console → Voice → Logs
   - Look for your call, check error message

3. **Check Balance**:
   - Twilio Console → Billing
   - Do you have credits?

4. **Try Minimum Example**:
   - Use /test/twilio page
   - Test each component individually

5. **Check Deployment**:
   - Is code pushed to GitHub?
   - Did Vercel finish deploying?
   - Check https://vercel.com for deployment status

---

## ✅ Success Indicators

You're ready for production when:
- ✅ All 4 tests green at `/debug`
- ✅ Can make test call that connects
- ✅ Audio flows both directions
- ✅ Mute/hangup/keypad all work
- ✅ No errors in console (F12)
- ✅ No errors in Twilio logs

---

**Last Updated**: Nov 17, 2025  
**Version**: 2.0 (With Comprehensive Debugging)
