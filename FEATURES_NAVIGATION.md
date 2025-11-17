# Dynamic Features - Quick Navigation Guide

Complete reference for all new files, APIs, and integration points.

## 📁 New Files Organization

### Backend APIs
```
src/app/api/
├── twilio/
│   ├── status/route.ts          ← Call status webhook
│   └── events/route.ts          ← Call events endpoint
├── user/
│   ├── transactions/route.ts    ← Transaction history
│   ├── contacts/
│   │   └── lookup/route.ts      ← Contact lookup & update
│   └── call-analytics/route.ts  ← Analytics & statistics
```

### Frontend Hooks
```
src/lib/
├── useCallListener.ts           ← Real-time call status (polling)
├── useBalanceListener.ts        ← Real-time balance updates (polling)
├── useEnhancedCall.ts           ← Combined hook for dialer
└── dialer-integration-example.tsx   ← Integration examples
```

### UI Components
```
src/app/
└── dashboard/
    └── call-history/
        └── page.tsx             ← Analytics dashboard
```

## 🔗 API Endpoints

### 1. Call Status Webhook
**URL:** `POST /api/twilio/status`
**Called by:** Twilio (webhook callback)
**Purpose:** Receive call updates, deduct balance, link contacts
**Response:**
```json
{
  "success": true,
  "callId": "...",
  "status": "completed",
  "cost": 0.05
}
```

### 2. Call Events
**URL:** `GET /api/twilio/events?limit=50`
**Called by:** useCallListener hook
**Purpose:** Get recent call events
**Response:**
```json
{
  "success": true,
  "count": 5,
  "events": [...]
}
```

### 3. Transactions
**URL:** `GET /api/user/transactions?limit=100&type=call`
**Called by:** Call history UI
**Purpose:** Get transaction history
**Response:**
```json
{
  "success": true,
  "transactions": [...],
  "summary": {
    "totalDebits": -50.25,
    "totalCredits": 100,
    "netChange": 49.75
  }
}
```

### 4. Contact Lookup
**URL:** `GET /api/user/contacts/lookup?phone=%2B447911123456`
**Called by:** useEnhancedCall hook
**Purpose:** Find contact by phone number
**Response:**
```json
{
  "success": true,
  "found": true,
  "contact": {
    "id": "...",
    "name": "John Doe",
    "phoneNumber": "+44 79 1112 3456",
    "email": "john@example.com",
    "lastCalledAt": "2025-11-17..."
  }
}
```

### 5. Call Analytics
**URL:** `GET /api/user/call-analytics?days=30`
**Called by:** Call history UI
**Purpose:** Get analytics and statistics
**Response:**
```json
{
  "success": true,
  "analytics": {
    "callStats": { "total": 15, "completed": 14, "failed": 1 },
    "costStats": { "totalCost": 8.95, "averageCost": 0.64 },
    "topCountries": [...],
    "dailyStats": [...]
  }
}
```

## 🪝 React Hooks Reference

### useCallListener
```typescript
import { useCallListener } from '@/lib/useCallListener';

const {
  calls,                      // Recent calls array
  currentCall,                // Active call (if any)
  isLoading,
  error,
  refetch,                    // Manual refresh
  subscribeToCallUpdates      // Subscribe to changes
} = useCallListener();
```

### useBalanceListener
```typescript
import { useBalanceListener } from '@/lib/useBalanceListener';

const {
  balance,                    // Current balance in USD
  isLoading,
  error,
  recentUpdates,              // Last 20 balance changes
  subscribeToBalanceUpdates   // Subscribe to changes
} = useBalanceListener();
```

### useEnhancedCall
```typescript
import { useEnhancedCall } from '@/lib/useEnhancedCall';

const {
  // From useCall
  status, number, setNumber, callStatus, isMuted,
  handleCall, handleHangUp, toggleMute, error, call,
  
  // Enhanced properties
  balance,                    // Real-time balance
  callHistory,                // Recent calls
  currentCall,                // Active call
  contactInfo,                // Auto-detected contact
  estimatedCost,              // Cost estimate
  callStartTime,              // Call start time
  
  // Enhanced methods
  lookupContact,              // Manual contact lookup
  estimateCallCost,           // Manual cost estimate
  refetchBalance,
  refetchCalls
} = useEnhancedCall({
  autoUpdateBalance: true,
  trackCallEvents: true,
  updateContactOnCall: true
});
```

## 📊 Data Models

### Call Event
```typescript
{
  id: string;
  callSid: string;
  fromNumber: string;
  toNumber: string;
  country: string;
  status: 'INITIATED' | 'RINGING' | 'ANSWERED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  duration: number;           // in seconds
  cost: number;               // in USD
  startTime: Date;
  endTime?: Date;
  userBalance: number;
  recordingUrl?: string;
  recordingSid?: string;
}
```

### Balance Update
```typescript
{
  previousBalance: number;
  newBalance: number;
  changeAmount: number;
  reason: 'call' | 'topup' | 'refund' | 'admin' | 'other';
  callId?: string;
  timestamp: Date;
}
```

### Contact Info
```typescript
{
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  country?: string;
  notes?: string;
  lastCalledAt: Date;
}
```

## 🎯 Integration Checklist

- [ ] **Twilio Setup** (5 min)
  - [ ] Set webhook URL in Twilio app settings
  - [ ] Verify webhook receives POST requests
  
- [ ] **Dialer Update** (10 min)
  - [ ] Replace useCall with useEnhancedCall
  - [ ] Add balance display
  - [ ] Add contact info display
  - [ ] Add error handling

- [ ] **Analytics Setup** (5 min)
  - [ ] Add navigation link to /dashboard/call-history
  - [ ] Verify analytics page loads
  - [ ] Test CSV export

- [ ] **Testing** (10 min)
  - [ ] Make test call
  - [ ] Verify balance update
  - [ ] Check call history
  - [ ] Test contact detection

## 🧪 Testing Commands

### Test Webhook
```bash
curl -X POST http://localhost:3000/api/twilio/status \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=CA1234&CallStatus=completed&CallDuration=120&To=%2B447911123456&From=%2B14155552671"
```

### Test Call Events
```bash
curl http://localhost:3000/api/twilio/events
```

### Test Analytics
```bash
curl "http://localhost:3000/api/user/call-analytics?days=30"
```

### Test Contact Lookup
```bash
curl "http://localhost:3000/api/user/contacts/lookup?phone=%2B447911123456"
```

### Test Transactions
```bash
curl "http://localhost:3000/api/user/transactions?limit=50&type=call"
```

## 📚 Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| DYNAMIC_FEATURES_GUIDE.md | Complete technical reference | Developers |
| DYNAMIC_FEATURES_COMPLETE.md | Implementation summary | Quick reference |
| dialer-integration-example.tsx | Code examples | Developers |
| This file | Navigation guide | Everyone |

## 🔧 Configuration

No configuration needed! Uses existing:
- Environment variables from `.env.local`
- Database connection from `DATABASE_URL`
- Authentication from NextAuth
- Twilio credentials from `TWILIO_*` vars

## ⚙️ Performance Settings

### Polling Intervals
Located in hook files, adjustable:
- **Call updates:** 3 seconds (useCallListener.ts:113)
- **Balance updates:** 2 seconds (useBalanceListener.ts:107)

### Adjust for production
```typescript
// Slower polling to reduce API load
setInterval(() => refetch(), 5000);  // Every 5 seconds

// Faster for real-time feel
setInterval(() => refetch(), 1000);  // Every 1 second
```

## 🚀 Next Steps

1. **Today:** Configure Twilio webhook
2. **Tomorrow:** Update dialer component
3. **This week:** Test with real calls
4. **Future:** Upgrade to Supabase Realtime for true real-time

## 📞 Support

For issues:
1. Check `/api/twilio/status` logs for webhook errors
2. Verify environment variables are set
3. Check database connection
4. Review browser console for client-side errors

## 🎉 Summary

**What was delivered:**
- 5 production-ready APIs
- 3 reusable React hooks
- 1 complete analytics dashboard
- Complete integration documentation

**Ready to integrate in:** 30-45 minutes
**No breaking changes:** All existing code compatible
**Database changes:** None required

---

For detailed information, see DYNAMIC_FEATURES_GUIDE.md
