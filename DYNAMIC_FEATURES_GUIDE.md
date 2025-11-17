# Dynamic Features Implementation Guide

Complete implementation of real-time call tracking, balance management, contact integration, and call analytics using your Supabase database structure.

## 🎯 Overview

This implementation adds four major features dynamically integrated with your existing system:

1. **Call Status Webhooks** - Track call lifecycle with real-time updates
2. **Real-time Balance** - Monitor balance changes during and after calls
3. **Contact Integration** - Auto-detect and link calls to contacts
4. **Call History & Analytics** - Comprehensive call tracking with insights

## 📁 New Files Created

### Backend APIs

#### `/api/twilio/status` (POST/GET)
- Receives call status updates from Twilio webhooks
- Updates call records with status, duration, cost
- Deducts balance from user account
- Links calls to contacts
- **Webhook URL for Twilio:** `{APP_URL}/api/twilio/status`

#### `/api/twilio/events` (GET/POST)
- Returns recent call events for authenticated user
- Provides real-time call status data to frontend
- Used by `useCallListener` hook for live updates

#### `/api/user/transactions` (GET/POST)
- Tracks all balance changes (calls, topups, refunds)
- Provides transaction history with breakdown
- Supports filtering by type

#### `/api/user/contacts/lookup` (GET/POST)
- Auto-detect contact info from phone number
- Update `last_called_at` on contact completion
- Link calls to contacts in database

#### `/api/user/call-analytics` (GET)
- Comprehensive call statistics and analytics
- Top countries, top numbers, daily trends
- Cost analysis and success rates
- Parameterized by day range (7/30/90/365 days)

### Frontend Hooks

#### `useCallListener.ts`
Subscribes to real-time call status updates via polling.

```typescript
const { 
  calls,              // Array of recent calls
  currentCall,        // Currently active call
  isLoading,
  error,
  refetch,           // Manual refresh
  subscribeToCallUpdates  // Subscribe to updates
} = useCallListener();
```

#### `useBalanceListener.ts`
Real-time balance monitoring with update events.

```typescript
const { 
  balance,                      // Current balance
  isLoading,
  error,
  recentUpdates,               // Array of recent balance changes
  subscribeToBalanceUpdates    // Subscribe to updates
} = useBalanceListener();
```

#### `useEnhancedCall.ts`
Enhanced call hook combining core calling with real-time features.

```typescript
const {
  // Original useCall properties
  status, number, callStatus, isMuted, device, connection, call, error,
  handleCall, handleHangUp, toggleMute, acceptIncomingCall, rejectIncomingCall,
  
  // Enhanced properties
  balance,            // Current user balance
  callHistory,        // Recent calls
  currentCall,        // Active call from listener
  contactInfo,        // Auto-detected contact
  estimatedCost,      // Cost estimate before call
  callStartTime,      // When current call started
  
  // Enhanced methods
  lookupContact,      // Manually lookup contact
  estimateCallCost,   // Manually estimate cost
} = useEnhancedCall({
  autoUpdateBalance: true,
  trackCallEvents: true,
  updateContactOnCall: true
});
```

### UI Components

#### `/dashboard/call-history/page.tsx`
Complete call history and analytics dashboard with:
- Summary statistics (total calls, duration, cost, success rate)
- Top countries called
- Top numbers called
- Daily trends
- Recent calls table
- CSV export functionality
- Time period filtering (7/30/90/365 days)

## 🔗 Integration Steps

### Step 1: Configure Twilio Webhook

1. Go to Twilio Console → TwiML Apps
2. Find your app configuration
3. Set **Status Callback URL** to:
   ```
   {NEXT_PUBLIC_APP_URL}/api/twilio/status
   ```
4. Set callback method to **POST**
5. Enable recording callback

### Step 2: Update Dialer to Use Enhanced Hook

**Before:**
```typescript
const { handleCall, handleHangUp, ... } = useCall();
```

**After:**
```typescript
const { 
  handleCall, 
  handleHangUp, 
  balance, 
  contactInfo,
  estimatedCost,
  ... 
} = useEnhancedCall({
  autoUpdateBalance: true,
  trackCallEvents: true,
  updateContactOnCall: true
});
```

### Step 3: Display Real-time Balance

```typescript
<div className="flex items-center space-x-2">
  <span className="text-gray-600">Balance:</span>
  <span className="text-lg font-bold text-gray-900">
    ${balance.toFixed(2)}
  </span>
  <span className="text-sm text-orange-600">
    {estimatedCost > 0 && `Est: $${estimatedCost.toFixed(4)}/min`}
  </span>
</div>
```

### Step 4: Show Contact Info

```typescript
{contactInfo && (
  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
    <p className="text-sm text-gray-600">Calling</p>
    <p className="font-semibold text-gray-900">{contactInfo.name}</p>
    <p className="text-xs text-gray-500">{contactInfo.email}</p>
  </div>
)}
```

### Step 5: Add Call History Link

```typescript
<Link href="/dashboard/call-history">
  <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
    Call History
  </button>
</Link>
```

## 📊 Real-time Data Flow

```
User Makes Call
    ↓
[useEnhancedCall] Estimates Cost, Checks Balance
    ↓
[handleCall] Initiates WebRTC via Twilio
    ↓
[Twilio SDK] Connects Call
    ↓
Twilio Sends Status Updates
    ↓
[/api/twilio/status] Webhook Receives Update
    ↓
Updates Call Record + Deducts Balance + Links Contact
    ↓
[/api/twilio/events] Returns Call Event
    ↓
[useCallListener] Polls for Updates (every 3 seconds)
    ↓
[useBalanceListener] Polls for Balance Changes (every 2 seconds)
    ↓
UI Re-renders with Real-time Data
```

## 🔄 Polling vs Real-time

Currently uses **polling** for simplicity and reliability. To upgrade to true Supabase Realtime:

```typescript
// Install Supabase client
npm install @supabase/supabase-js

// Update useCallListener.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Subscribe to calls changes
supabase
  .from('calls')
  .on('*', (payload) => {
    // Update state with real-time changes
  })
  .subscribe();
```

## 💾 Database Changes

No schema changes needed! Uses existing tables:

- **calls** - Stores call records with status, duration, cost
- **users** - Tracks balance deductions
- **contacts** - Updated with last_called_at
- **payments** - Stores topup transactions

Transaction history is computed on-the-fly from calls + payments.

## 🧪 Testing

### Test Call Status Webhook

```bash
curl -X POST http://localhost:3000/api/twilio/status \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=CA1234567890&CallStatus=completed&CallDuration=120&To=%2B447911123456&From=%2B14155552671"
```

### Test Call Events

```bash
curl http://localhost:3000/api/twilio/events
```

### Test Call Analytics

```bash
curl http://localhost:3000/api/user/call-analytics?days=30
```

### Test Contact Lookup

```bash
curl "http://localhost:3000/api/user/contacts/lookup?phone=%2B447911123456"
```

## 📈 Analytics Available

The call analytics endpoint provides:

```javascript
{
  period: { start, end, days },
  callStats: { total, completed, failed, cancelled },
  timeStats: { totalDuration, averageDuration, maxDuration },
  costStats: { totalCost, averageCost, minCost, maxCost },
  topCountries: [{ country, count, cost, duration }],
  topNumbers: [{ number, count, cost, country }],
  dailyStats: [{ date, count, duration, cost, successRate }],
  recentCalls: [...]
}
```

## 🎯 Next Steps for Production

1. **Add Supabase Realtime** for true real-time instead of polling
2. **Implement Call Recordings** storage and management
3. **Add Call Notifications** with toast/email alerts
4. **Create Admin Dashboard** for monitoring all user calls
5. **Implement Call Retry Logic** for failed calls
6. **Add Call Recording Playback** in call history
7. **Create Monthly Usage Reports** with analytics export
8. **Implement Cost Alerts** when approaching balance threshold

## 🚀 Performance Optimization

- Polling intervals: 3s for calls, 2s for balance (adjust based on needs)
- Cache call history in localStorage
- Batch update operations
- Implement incremental loading for large datasets
- Add request debouncing for API calls

## ⚠️ Important Notes

1. **Webhook URL Configuration**: Must be set in Twilio app settings
2. **Time Zone Handling**: All timestamps in UTC
3. **Cost Calculation**: Based on actual rates in database
4. **Balance Deduction**: Happens immediately on call completion
5. **Contact Linking**: Only updates if contact exists with exact phone number

## 📞 Support

For issues or questions:
1. Check webhook logs in `/api/twilio/status`
2. Verify Twilio credentials in environment variables
3. Ensure database connection is working
4. Check browser console for client-side errors
