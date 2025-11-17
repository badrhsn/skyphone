'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Network Quality Levels
 */
export enum NetworkQuality {
  EXCELLENT = 'excellent',  // latency < 50ms, 4+ bars
  GOOD = 'good',           // latency 50-150ms, 3 bars
  FAIR = 'fair',           // latency 150-300ms, 2 bars
  POOR = 'poor',           // latency > 300ms, 1 bar
  OFFLINE = 'offline'      // no connection
}

/**
 * Network Type
 */
export enum NetworkType {
  WIFI = 'wifi',
  CELLULAR_5G = '5g',
  CELLULAR_4G = '4g',
  CELLULAR_3G = '3g',
  CELLULAR_2G = '2g',
  UNKNOWN = 'unknown',
  OFFLINE = 'offline'
}

/**
 * Network Status Interface
 */
export interface NetworkStatus {
  online: boolean;
  quality: NetworkQuality;
  type: NetworkType;
  latency: number | null;  // milliseconds
  downlink: number | null; // Mbps
  effectiveType: string;   // 4g, 3g, 2g, slow-2g
  rtt: number | null;      // Round trip time in ms
  saveData: boolean;       // Data saver mode enabled
}

/**
 * useNetworkStatus Hook
 * Detects network quality, type, and connection status
 * Provides real-time updates on network changes
 */
export function useNetworkStatus(): NetworkStatus & {
  isSlowNetwork: boolean;
  isUnstable: boolean;
  refetch: () => Promise<void>;
  subscribe: (callback: (status: NetworkStatus) => void) => () => void;
} {
  const [status, setStatus] = useState<NetworkStatus>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    quality: NetworkQuality.GOOD,
    type: NetworkType.UNKNOWN,
    latency: null,
    downlink: null,
    effectiveType: '4g',
    rtt: null,
    saveData: false,
  });

  const subscriptionsRef = useRef<Set<(status: NetworkStatus) => void>>(new Set());

  /**
   * Get network connection information
   */
  const getNetworkInfo = useCallback(async (): Promise<NetworkStatus> => {
    if (typeof navigator === 'undefined') {
      return status;
    }

    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    // Get effective type
    const effectiveType = connection?.effectiveType || '4g';
    
    // Get RTT and downlink
    const rtt = connection?.rtt || null;
    const downlink = connection?.downlink || null;
    const saveData = connection?.saveData || false;

    // Determine network type
    let networkType = NetworkType.UNKNOWN;
    if (!navigator.onLine) {
      networkType = NetworkType.OFFLINE;
    } else if (connection) {
      if (connection.type === 'wifi') {
        networkType = NetworkType.WIFI;
      } else if (connection.type === 'cellular') {
        const generation = connection.effectiveType || '4g';
        networkType = (
          generation === '5g' ? NetworkType.CELLULAR_5G :
          generation === '4g' ? NetworkType.CELLULAR_4G :
          generation === '3g' ? NetworkType.CELLULAR_3G :
          NetworkType.CELLULAR_2G
        );
      }
    }

    // Calculate latency estimate from RTT
    const latency = rtt ? Math.round(rtt / 2) : null;

    // Determine network quality
    let quality = NetworkQuality.GOOD;
    if (!navigator.onLine) {
      quality = NetworkQuality.OFFLINE;
    } else if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      quality = NetworkQuality.POOR;
    } else if (effectiveType === '3g') {
      quality = latency && latency > 300 ? NetworkQuality.FAIR : NetworkQuality.GOOD;
    } else if (effectiveType === '4g') {
      quality = latency && latency < 50 ? NetworkQuality.EXCELLENT : NetworkQuality.GOOD;
    } else if (connection?.type === 'wifi') {
      quality = latency && latency < 50 ? NetworkQuality.EXCELLENT : 
                latency && latency < 150 ? NetworkQuality.GOOD :
                NetworkQuality.FAIR;
    }

    return {
      online: navigator.onLine,
      quality,
      type: networkType,
      latency,
      downlink,
      effectiveType,
      rtt,
      saveData,
    };
  }, [status]);

  /**
   * Measure latency by pinging a fast endpoint
   */
  const measureLatency = useCallback(async (): Promise<number | null> => {
    try {
      const start = performance.now();
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache',
      });
      
      if (response.ok) {
        const latency = Math.round(performance.now() - start);
        return latency;
      }
      return null;
    } catch (error) {
      console.error('[useNetworkStatus] Latency measurement failed:', error);
      return null;
    }
  }, []);

  /**
   * Refetch network information
   */
  const refetch = useCallback(async () => {
    const newStatus = await getNetworkInfo();
    
    // Optionally measure actual latency
    const measuredLatency = await measureLatency();
    if (measuredLatency !== null) {
      newStatus.latency = measuredLatency;
    }

    setStatus(newStatus);
    
    // Notify all subscribers
    subscriptionsRef.current.forEach(callback => callback(newStatus));
  }, [getNetworkInfo, measureLatency]);

  /**
   * Subscribe to network status changes
   */
  const subscribe = useCallback(
    (callback: (status: NetworkStatus) => void): (() => void) => {
      subscriptionsRef.current.add(callback);
      return () => {
        subscriptionsRef.current.delete(callback);
      };
    },
    []
  );

  /**
   * Listen for online/offline changes
   */
  useEffect(() => {
    const handleOnline = async () => {
      await refetch();
    };

    const handleOffline = async () => {
      await refetch();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refetch]);

  /**
   * Listen for network connection changes
   */
  useEffect(() => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (!connection) return;

    const handleChange = async () => {
      await refetch();
    };

    connection.addEventListener('change', handleChange);

    return () => {
      connection.removeEventListener('change', handleChange);
    };
  }, [refetch]);

  /**
   * Initial fetch
   */
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    ...status,
    isSlowNetwork: [NetworkQuality.POOR, NetworkQuality.OFFLINE].includes(status.quality),
    isUnstable: [NetworkQuality.FAIR, NetworkQuality.POOR, NetworkQuality.OFFLINE].includes(status.quality),
    refetch,
    subscribe,
  };
}

export default useNetworkStatus;
