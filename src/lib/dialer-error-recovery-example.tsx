/**
 * Dialer Integration Example - Error Recovery Components
 * Shows how to integrate all three error recovery components into the dialer
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Import error recovery components
import NetworkErrorRecovery from '@/components/NetworkErrorRecovery';
import PermissionRecovery from '@/components/PermissionRecovery';
import CallFailureRecovery from '@/components/CallFailureRecovery';

// Import error categorization
import { categorizeError, ErrorCategory } from '@/lib/errorCategorization';

export default function DialerWithErrorRecovery() {
  const router = useRouter();
  const { data: session } = useSession();

  // Error state management
  const [networkError, setNetworkError] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [callError, setCallError] = useState<Error | null>(null);

  // Call state
  const [isCalling, setIsCalling] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [user, setUser] = useState<{ balance: number } | null>(null);

  /**
   * Handle any error that occurs during call setup or execution
   */
  const handleCallError = (error: Error | unknown) => {
    const err = error instanceof Error ? error : new Error(String(error));
    const categorized = categorizeError(err);

    console.log('📍 Error caught:', {
      title: categorized.title,
      category: categorized.category,
      retryable: categorized.retryable,
    });

    // Route to specific error handler based on category
    switch (categorized.category) {
      case ErrorCategory.PERMISSION:
        setPermissionError(true);
        break;

      case ErrorCategory.NETWORK:
        setNetworkError(true);
        break;

      case ErrorCategory.BALANCE:
      case ErrorCategory.CALL_SETUP:
      case ErrorCategory.CALL_ACTIVE:
      case ErrorCategory.BROWSER:
      case ErrorCategory.UNKNOWN:
      default:
        setCallError(err);
        break;
    }
  };

  /**
   * Attempt to make a call with error handling
   */
  const initiateCall = async () => {
    if (!phoneNumber || !user) {
      setCallError(new Error('Please enter a phone number'));
      return;
    }

    setIsCalling(true);

    try {
      // Example: Check balance first
      if (user.balance < 0.1) {
        throw new Error('Insufficient balance to make this call');
      }

      // Example: Check microphone permission
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (micPermission.state === 'denied') {
        throw new Error('Microphone permission denied by user');
      }

      // Example: Simulate WebRTC call setup
      // In real code, this would call your Twilio setup
      // const call = await setupWebRTCCall(phoneNumber);

      console.log('✅ Call initiated successfully');
    } catch (error) {
      handleCallError(error);
    } finally {
      setIsCalling(false);
    }
  };

  /**
   * Retry the call
   */
  const handleRetryCall = async () => {
    // Clear previous errors
    setNetworkError(false);
    setPermissionError(false);
    setCallError(null);

    // Retry call
    await initiateCall();
  };

  /**
   * Handle successful permission grant
   */
  const handlePermissionGranted = async () => {
    console.log('✅ Permission granted, retrying call...');
    await initiateCall();
  };

  /**
   * Navigate to add credits page
   */
  const handleAddCredits = () => {
    router.push('/dashboard/add-credits');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3fbff] to-white">
      {/* Dialer UI */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Dialer</h1>

          {/* Phone Input */}
          <div className="mb-6">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
            />
          </div>

          {/* Balance Display */}
          {user && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-sm text-gray-600">Balance</div>
              <div className="text-2xl font-bold text-[#00aff0]">
                ${user.balance.toFixed(2)}
              </div>
            </div>
          )}

          {/* Call Button */}
          <button
            onClick={initiateCall}
            disabled={isCalling || !phoneNumber}
            className="w-full bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white py-3 rounded-lg font-semibold hover:from-[#0099d6] hover:to-[#0086c2] disabled:opacity-50 transition-all"
          >
            {isCalling ? 'Calling...' : 'Make Call'}
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* ERROR RECOVERY COMPONENTS - MAIN FEATURE */}
      {/* ============================================ */}

      {/* Network Error Recovery */}
      <NetworkErrorRecovery
        isOpen={networkError}
        onClose={() => setNetworkError(false)}
        onRetry={handleRetryCall}
        errorMessage="Your internet connection was lost. Please restore it and try again."
      />

      {/* Permission Error Recovery */}
      <PermissionRecovery
        isOpen={permissionError}
        onClose={() => setPermissionError(false)}
        onPermissionGranted={handlePermissionGranted}
        permissionType="microphone"
      />

      {/* Call Failure Recovery */}
      <CallFailureRecovery
        isOpen={!!callError}
        onClose={() => setCallError(null)}
        onRetry={handleRetryCall}
        onAddCredits={handleAddCredits}
        error={callError || undefined}
        phoneNumber={phoneNumber}
        userBalance={user?.balance}
      />
    </div>
  );
}

/**
 * ERROR SCENARIOS FOR TESTING
 *
 * 1. Network Error:
 *    - Disconnect internet
 *    - Click "Make Call"
 *    - Should show: NetworkErrorRecovery with diagnostics
 *
 * 2. Permission Error:
 *    - Don't grant microphone permission
 *    - Try to call
 *    - Should show: PermissionRecovery with browser instructions
 *
 * 3. Balance Error:
 *    - Set user.balance = 0
 *    - Click "Make Call"
 *    - Should show: CallFailureRecovery with "Add Credits" button
 *
 * 4. Connection Unstable:
 *    - Use poor network (throttle in dev tools)
 *    - Should show: NetworkErrorRecovery with quality metrics
 *
 * 5. Browser Not Supported:
 *    - Test on older browser
 *    - Should show: CallFailureRecovery with browser error
 */

/**
 * INTEGRATION CHECKLIST
 *
 * [ ] Import error recovery components
 * [ ] Set up error state variables
 * [ ] Add handleCallError function
 * [ ] Wrap API calls in try-catch
 * [ ] Pass errors to handleCallError
 * [ ] Render three error recovery components
 * [ ] Test each error scenario
 * [ ] Verify retry logic works
 * [ ] Check mobile responsiveness
 * [ ] Test permission flow on multiple browsers
 * [ ] Verify analytics tracking (if needed)
 */
