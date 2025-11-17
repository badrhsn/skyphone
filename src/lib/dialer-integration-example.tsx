'use client';

/**
 * INTEGRATION EXAMPLE: Enhanced Dialer with Real-time Features
 * 
 * This shows how to integrate useEnhancedCall into your dialer
 * Copy the relevant sections into src/app/dashboard/dialer/page.tsx
 */

import { useEnhancedCall } from '@/lib/useEnhancedCall';
import { DollarSign, Phone, Info, AlertCircle } from 'lucide-react';

export function DialerEnhancements() {
  // Replace your current useCall hook with this:
  const {
    status,
    number,
    setNumber,
    callStatus,
    isMuted,
    handleCall,
    handleHangUp,
    toggleMute,
    error,
    
    // NEW: Real-time properties
    balance,
    contactInfo,
    estimatedCost,
    callStartTime,
    callHistory,
  } = useEnhancedCall({
    autoUpdateBalance: true,
    trackCallEvents: true,
    updateContactOnCall: true,
  });

  const isCalling = ['calling', 'connected'].includes(callStatus);

  // SECTION 1: Balance Display
  function renderBalanceSection() {
    return (
      <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-gray-600 font-medium">Balance:</span>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            ${balance.toFixed(2)}
          </p>
          {estimatedCost > 0 && (
            <p className="text-xs text-orange-600">
              Est: ${estimatedCost.toFixed(4)}/min
            </p>
          )}
        </div>
      </div>
    );
  }

  // SECTION 2: Contact Info Display
  function renderContactInfo() {
    if (!contactInfo) return null;

    return (
      <div className="p-3 mb-4 bg-blue-50 rounded-lg border border-blue-200 flex items-start space-x-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-600 font-medium">Calling</p>
          <p className="font-semibold text-gray-900 truncate">
            {contactInfo.name}
          </p>
          {contactInfo.email && (
            <p className="text-xs text-gray-500 truncate">
              {contactInfo.email}
            </p>
          )}
          {contactInfo.lastCalledAt && (
            <p className="text-xs text-gray-500">
              Last called:{' '}
              {new Date(contactInfo.lastCalledAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  // SECTION 3: Error Display with Balance Check
  function renderErrorAlert() {
    if (!error) return null;

    const isBalanceError = error.toLowerCase().includes('balance');

    return (
      <div
        className={`p-3 mb-4 rounded-lg border flex items-start space-x-3 ${
          isBalanceError
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}
      >
        <AlertCircle
          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            isBalanceError ? 'text-yellow-600' : 'text-red-600'
          }`}
        />
        <div className="flex-1">
          <p
            className={`text-sm font-medium ${
              isBalanceError ? 'text-yellow-800' : 'text-red-800'
            }`}
          >
            {error}
          </p>
          {isBalanceError && (
            <button className="text-xs text-yellow-600 hover:text-yellow-700 underline mt-1">
              Add Credits
            </button>
          )}
        </div>
      </div>
    );
  }

  // SECTION 4: Call Handler with Enhancements
  async function handleDialerCall(phoneNumber: string, countryCode: string) {
    try {
      // The enhanced hook handles:
      // 1. Contact lookup
      // 2. Cost estimation
      // 3. Balance check
      // 4. Call initiation
      // 5. Event tracking
      await handleCall(phoneNumber, countryCode);
    } catch (err) {
      console.error('Call failed:', err);
      // Error is automatically set in the hook
    }
  }

  // SECTION 5: Recent Calls Quick View
  function renderRecentCalls() {
    const recentThreeCalls = callHistory?.slice(0, 3) || [];
    if (recentThreeCalls.length === 0) return null;

    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Recent Calls
        </p>
        <div className="space-y-2">
          {recentThreeCalls.map((call) => (
            <div
              key={call.id}
              className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 hover:border-blue-200 cursor-pointer transition-colors"
              onClick={() => setNumber(call.toNumber)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {call.toNumber}
                </p>
                <p className="text-xs text-gray-500">
                  {call.country} • {call.duration}s • ${call.cost.toFixed(4)}
                </p>
              </div>
              <div
                className={`text-xs font-semibold px-2 py-1 rounded ${
                  call.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : call.status === 'FAILED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {call.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // SECTION 6: Call History Link
  function renderCallHistoryLink() {
    return (
      <a
        href="/dashboard/call-history"
        className="text-sm text-[#00aff0] hover:text-[#0099d6] underline"
      >
        View full call history & analytics →
      </a>
    );
  }

  // USAGE IN YOUR DIALER:
  return (
    <div className="p-6">
      {/* Add balance display at the top */}
      {renderBalanceSection()}

      {/* Show error if exists */}
      {renderErrorAlert()}

      {/* Show contact info if auto-detected */}
      {renderContactInfo()}

      {/* Your existing phone input and keypad go here */}
      <div className="mb-4">
        <input
          type="tel"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Enter phone number"
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
        />
      </div>

      {/* Your existing call button, updated to use enhanced handler */}
      <button
        onClick={() => handleDialerCall(number, 'US')}
        disabled={isCalling || !number || balance < estimatedCost}
        className="w-full py-3 bg-[#00aff0] text-white font-semibold rounded-lg hover:bg-[#0099d6] disabled:bg-gray-300 transition-colors"
      >
        {isCalling ? 'Call in Progress...' : 'Make Call'}
      </button>

      {/* Show recent calls */}
      {renderRecentCalls()}

      {/* Link to full history */}
      <div className="mt-4 text-center">
        {renderCallHistoryLink()}
      </div>
    </div>
  );
}

/**
 * QUICK INTEGRATION CHECKLIST:
 * 
 * 1. Replace useCall import:
 *    - Change: import { useCall } from '@/lib/useCall'
 *    - To: import { useEnhancedCall } from '@/lib/useEnhancedCall'
 * 
 * 2. Initialize hook:
 *    - Add: const { balance, contactInfo, estimatedCost, ... } = useEnhancedCall({...})
 * 
 * 3. Add balance display:
 *    - Copy renderBalanceSection() into your JSX
 * 
 * 4. Add contact info display:
 *    - Copy renderContactInfo() into your JSX
 * 
 * 5. Add error handling:
 *    - Copy renderErrorAlert() into your JSX
 * 
 * 6. Add call history:
 *    - Copy renderRecentCalls() into your JSX
 * 
 * 7. Add history link:
 *    - Add a link to /dashboard/call-history
 * 
 * 8. Test:
 *    - Make a call and verify real-time updates
 *    - Check balance deduction after call
 *    - View call history page
 */
