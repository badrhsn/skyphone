'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Call Status Type
 */
export interface CallEvent {
  id: string;
  callSid: string;
  fromNumber: string;
  toNumber: string;
  country: string;
  status: 'INITIATED' | 'RINGING' | 'ANSWERED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  duration: number;
  cost: number;
  startTime: Date;
  endTime?: Date;
  userBalance: number;
  recordingUrl?: string;
  recordingSid?: string;
}

export interface UseCallListenerReturn {
  calls: CallEvent[];
  currentCall: CallEvent | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  subscribeToCallUpdates: (callback: (event: CallEvent) => void) => () => void;
}

/**
 * useCallListener Hook
 * Subscribes to call status updates via polling and optional Supabase Realtime
 * Returns current calls and provides real-time updates to UI
 */
export function useCallListener(): UseCallListenerReturn {
  const { data: session } = useSession();
  const [calls, setCalls] = useState<CallEvent[]>([]);
  const [currentCall, setCurrentCall] = useState<CallEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef<Set<(event: CallEvent) => void>>(new Set());

  /**
   * Fetch recent calls from API
   */
  const refetch = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setError(null);
      const response = await fetch('/api/twilio/events?limit=50');

      if (!response.ok) {
        throw new Error(`Failed to fetch call events: ${response.status}`);
      }

      const data = await response.json();
      const callEvents = data.events || [];

      // Transform API response to CallEvent objects
      const transformedCalls = callEvents.map((event: any) => ({
        ...event,
        startTime: new Date(event.startTime),
        endTime: event.endTime ? new Date(event.endTime) : undefined,
      }));

      setCalls(transformedCalls);

      // Set current call (most recent active call)
      const activeCall = transformedCalls.find((call: CallEvent) =>
        ['RINGING', 'ANSWERED'].includes(call.status)
      );
      if (activeCall) {
        setCurrentCall(activeCall);
      }

      // Notify all subscribers
      transformedCalls.forEach((call: CallEvent) => {
        callbacksRef.current.forEach((callback) => callback(call));
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching calls';
      setError(message);
      console.error('[useCallListener] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  /**
   * Set up polling for call updates (fallback for real-time)
   */
  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    // Fetch immediately
    refetch();

    // Poll every 3 seconds for updates
    pollingIntervalRef.current = setInterval(() => {
      refetch();
    }, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [session?.user?.id, refetch]);

  /**
   * Subscribe to call updates
   * Returns unsubscribe function
   */
  const subscribeToCallUpdates = useCallback(
    (callback: (event: CallEvent) => void): (() => void) => {
      callbacksRef.current.add(callback);

      return () => {
        callbacksRef.current.delete(callback);
      };
    },
    []
  );

  return {
    calls,
    currentCall,
    isLoading,
    error,
    refetch,
    subscribeToCallUpdates,
  };
}

export default useCallListener;
