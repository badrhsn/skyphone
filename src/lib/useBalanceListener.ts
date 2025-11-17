'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Balance Update Event
 */
export interface BalanceUpdate {
  previousBalance: number;
  newBalance: number;
  changeAmount: number;
  reason: 'call' | 'topup' | 'refund' | 'admin' | 'other';
  callId?: string;
  timestamp: Date;
}

export interface UseBalanceListenerReturn {
  balance: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  subscribeToBalanceUpdates: (callback: (update: BalanceUpdate) => void) => () => void;
  recentUpdates: BalanceUpdate[];
}

/**
 * useBalanceListener Hook
 * Real-time balance monitoring with updates during calls
 * Polls user profile API to get latest balance
 */
export function useBalanceListener(): UseBalanceListenerReturn {
  const { data: session } = useSession();
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<BalanceUpdate[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef<Set<(update: BalanceUpdate) => void>>(new Set());
  const previousBalanceRef = useRef<number>(0);

  /**
   * Fetch current user balance
   */
  const refetch = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setError(null);
      const response = await fetch('/api/user/profile');

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.status}`);
      }

      const data = await response.json();
      const newBalance = data.balance || 0;

      // Detect balance change and create update event
      if (previousBalanceRef.current !== newBalance) {
        const changeAmount = newBalance - previousBalanceRef.current;
        const reason: 'call' | 'topup' | 'refund' | 'admin' | 'other' =
          changeAmount > 0 ? 'topup' : changeAmount < 0 ? 'call' : 'other';

        const update: BalanceUpdate = {
          previousBalance: previousBalanceRef.current,
          newBalance,
          changeAmount,
          reason,
          timestamp: new Date(),
        };

        // Add to recent updates (keep last 20)
        setRecentUpdates((prev) => {
          const updated = [update, ...prev].slice(0, 20);
          return updated;
        });

        // Notify all subscribers
        callbacksRef.current.forEach((callback) => callback(update));

        previousBalanceRef.current = newBalance;
      }

      setBalance(newBalance);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error fetching balance';
      setError(message);
      console.error('[useBalanceListener] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  /**
   * Set up polling for balance updates
   */
  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    // Fetch immediately
    refetch();

    // Poll every 2 seconds for balance changes
    pollingIntervalRef.current = setInterval(() => {
      refetch();
    }, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [session?.user?.id, refetch]);

  /**
   * Subscribe to balance updates
   * Returns unsubscribe function
   */
  const subscribeToBalanceUpdates = useCallback(
    (callback: (update: BalanceUpdate) => void): (() => void) => {
      callbacksRef.current.add(callback);

      return () => {
        callbacksRef.current.delete(callback);
      };
    },
    []
  );

  return {
    balance,
    isLoading,
    error,
    refetch,
    subscribeToBalanceUpdates,
    recentUpdates,
  };
}

export default useBalanceListener;
