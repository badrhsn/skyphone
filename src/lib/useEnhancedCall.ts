'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCall } from '@/lib/useCall';
import { useCallListener, CallEvent } from '@/lib/useCallListener';
import { useBalanceListener } from '@/lib/useBalanceListener';

/**
 * Enhanced Call Hook
 * Combines useCall with real-time listeners for balance and call status
 */

export interface EnhancedCallOptions {
  autoUpdateBalance?: boolean;
  trackCallEvents?: boolean;
  updateContactOnCall?: boolean;
}

export function useEnhancedCall(options: EnhancedCallOptions = {}) {
  const {
    autoUpdateBalance = true,
    trackCallEvents = true,
    updateContactOnCall = true,
  } = options;

  // Core call hook
  const callHook = useCall();

  // Real-time listeners
  const { balance, refetch: refetchBalance, subscribeToBalanceUpdates } = useBalanceListener();
  const {
    calls: callHistory,
    currentCall,
    refetch: refetchCalls,
    subscribeToCallUpdates,
  } = useCallListener();

  // Enhanced state
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);

  /**
   * Look up contact information by phone number
   */
  const lookupContact = useCallback(async (phoneNumber: string) => {
    try {
      const response = await fetch(`/api/user/contacts/lookup?phone=${encodeURIComponent(phoneNumber)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.found) {
          setContactInfo(data.contact);
          return data.contact;
        }
      }
    } catch (err) {
      console.error('[useEnhancedCall] Error looking up contact:', err);
    }
    setContactInfo(null);
    return null;
  }, []);

  /**
   * Estimate call cost based on country
   */
  const estimateCallCost = useCallback(async (phoneNumber: string, countryCode: string) => {
    try {
      const response = await fetch(
        `/api/rates?country=${encodeURIComponent(countryCode)}`
      );
      if (response.ok) {
        const rates = await response.json();
        if (rates.length > 0) {
          const rate = rates[0];
          // Estimate for 1 minute
          setEstimatedCost(rate.rate);
          return rate.rate;
        }
      }
    } catch (err) {
      console.error('[useEnhancedCall] Error estimating cost:', err);
    }
    setEstimatedCost(0);
    return 0;
  }, []);

  /**
   * Enhanced call handler
   */
  const handleEnhancedCall = useCallback(
    async (phoneNumber: string, countryCode: string) => {
      try {
        // 1. Look up contact
        if (updateContactOnCall) {
          await lookupContact(phoneNumber);
        }

        // 2. Estimate cost
        const cost = await estimateCallCost(phoneNumber, countryCode);

        // 3. Check balance
        if (autoUpdateBalance && balance < cost) {
          throw new Error(
            `Insufficient balance. Need $${cost.toFixed(2)}, have $${balance.toFixed(2)}`
          );
        }

        // 4. Start call
        setCallStartTime(new Date());
        const result = await callHook.handleCall({
          To: phoneNumber,
        });

        // 5. Track call event
        if (trackCallEvents) {
          refetchCalls();
        }

        return result;
      } catch (err) {
        console.error('[useEnhancedCall] Call failed:', err);
        throw err;
      }
    },
    [
      lookupContact,
      estimateCallCost,
      balance,
      autoUpdateBalance,
      trackCallEvents,
      callHook,
      refetchCalls,
      updateContactOnCall,
    ]
  );

  /**
   * Enhanced hang up with cleanup
   */
  const handleEnhancedHangUp = useCallback(async () => {
    try {
      await callHook.handleHangUp();

      // Update contact last called time
      if (contactInfo && updateContactOnCall) {
        try {
          await fetch('/api/user/contacts/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactId: contactInfo.id }),
          });
        } catch (err) {
          console.error('[useEnhancedCall] Error updating contact:', err);
        }
      }

      // Refresh balance and calls
      if (autoUpdateBalance) {
        await refetchBalance();
      }
      if (trackCallEvents) {
        await refetchCalls();
      }

      setCallStartTime(null);
      setContactInfo(null);
    } catch (err) {
      console.error('[useEnhancedCall] Hang up failed:', err);
    }
  }, [
    callHook,
    contactInfo,
    autoUpdateBalance,
    trackCallEvents,
    refetchBalance,
    refetchCalls,
    updateContactOnCall,
  ]);

  /**
   * Subscribe to balance updates during call
   */
  useEffect(() => {
    const unsubscribe = subscribeToBalanceUpdates((update) => {
      console.log('[useEnhancedCall] Balance updated:', update);
      // Could trigger UI notification here
    });

    return unsubscribe;
  }, [subscribeToBalanceUpdates]);

  /**
   * Subscribe to call updates
   */
  useEffect(() => {
    const unsubscribe = subscribeToCallUpdates((event: CallEvent) => {
      console.log('[useEnhancedCall] Call event:', event);
      // Could trigger UI notification here
    });

    return unsubscribe;
  }, [subscribeToCallUpdates]);

  return {
    ...callHook,
    // Real-time data
    balance,
    callHistory,
    currentCall,
    contactInfo,
    estimatedCost,
    callStartTime,
    // Enhanced methods
    handleCall: handleEnhancedCall,
    handleHangUp: handleEnhancedHangUp,
    lookupContact,
    estimateCallCost,
    // Refresh methods
    refetchBalance,
    refetchCalls,
  };
}

export default useEnhancedCall;
