'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * useScreenWakeLock Hook
 * Keeps the screen awake during active calls
 * Uses Screen Wake Lock API (Chrome 84+, Edge 84+, Opera 70+)
 */
export function useScreenWakeLock() {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  let wakeLockSentinelRef: any = null;

  /**
   * Check if Screen Wake Lock API is supported
   */
  useEffect(() => {
    const supported = 'wakeLock' in navigator;
    setIsSupported(supported);
  }, []);

  /**
   * Request wake lock
   */
  const request = useCallback(async () => {
    if (!isSupported) {
      setError('Screen Wake Lock API not supported on this device');
      return false;
    }

    try {
      setError(null);
      wakeLockSentinelRef = await (navigator as any).wakeLock.request('screen');
      setIsActive(true);

      // Handle release events (user closes tab, etc)
      wakeLockSentinelRef.addEventListener('release', () => {
        console.log('[useScreenWakeLock] Wake lock released');
        setIsActive(false);
      });

      console.log('[useScreenWakeLock] Wake lock acquired');
      return true;
    } catch (err: any) {
      console.error('[useScreenWakeLock] Request failed:', err);
      setError(err.message || 'Failed to acquire wake lock');
      setIsActive(false);
      return false;
    }
  }, [isSupported]);

  /**
   * Release wake lock
   */
  const release = useCallback(async () => {
    if (!isActive || !wakeLockSentinelRef) {
      return true;
    }

    try {
      await wakeLockSentinelRef.release();
      setIsActive(false);
      wakeLockSentinelRef = null;
      console.log('[useScreenWakeLock] Wake lock released');
      return true;
    } catch (err: any) {
      console.error('[useScreenWakeLock] Release failed:', err);
      setError(err.message || 'Failed to release wake lock');
      return false;
    }
  }, [isActive]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isActive && wakeLockSentinelRef) {
        wakeLockSentinelRef.release().catch((err: any) => {
          console.error('[useScreenWakeLock] Cleanup release failed:', err);
        });
      }
    };
  }, [isActive]);

  return {
    isSupported,
    isActive,
    error,
    request,
    release,
  };
}

export default useScreenWakeLock;
