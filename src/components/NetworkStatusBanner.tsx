'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, AlertTriangle, Zap } from 'lucide-react';
import { useNetworkStatus, NetworkQuality, NetworkType } from '@/lib/useNetworkStatus';

/**
 * Network Status Banner Component
 * Displays network quality and connection status
 * Shows warning for poor connections
 */
export function NetworkStatusBanner() {
  const { online, quality, type, latency, downlink, isSlowNetwork, isUnstable } = useNetworkStatus();
  const [isVisible, setIsVisible] = useState(false);

  // Auto-hide when connection is good
  useEffect(() => {
    if (quality === NetworkQuality.EXCELLENT || quality === NetworkQuality.GOOD) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [quality]);

  if (!isVisible || (online && quality === NetworkQuality.GOOD)) {
    return null;
  }

  const getStatusColor = () => {
    switch (quality) {
      case NetworkQuality.EXCELLENT:
        return 'bg-green-50 border-green-200';
      case NetworkQuality.GOOD:
        return 'bg-blue-50 border-blue-200';
      case NetworkQuality.FAIR:
        return 'bg-yellow-50 border-yellow-200';
      case NetworkQuality.POOR:
        return 'bg-orange-50 border-orange-200';
      case NetworkQuality.OFFLINE:
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = () => {
    switch (quality) {
      case NetworkQuality.EXCELLENT:
        return 'text-green-700';
      case NetworkQuality.GOOD:
        return 'text-blue-700';
      case NetworkQuality.FAIR:
        return 'text-yellow-700';
      case NetworkQuality.POOR:
        return 'text-orange-700';
      case NetworkQuality.OFFLINE:
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  const getIcon = () => {
    if (!online) {
      return <WifiOff className="w-4 h-4" />;
    }

    switch (quality) {
      case NetworkQuality.EXCELLENT:
      case NetworkQuality.GOOD:
        return <Wifi className="w-4 h-4" />;
      case NetworkQuality.FAIR:
      case NetworkQuality.POOR:
        return <AlertTriangle className="w-4 h-4" />;
      case NetworkQuality.OFFLINE:
        return <WifiOff className="w-4 h-4" />;
      default:
        return <Wifi className="w-4 h-4" />;
    }
  };

  const getNetworkTypeLabel = () => {
    switch (type) {
      case NetworkType.WIFI:
        return 'WiFi';
      case NetworkType.CELLULAR_5G:
        return '5G';
      case NetworkType.CELLULAR_4G:
        return '4G LTE';
      case NetworkType.CELLULAR_3G:
        return '3G';
      case NetworkType.CELLULAR_2G:
        return '2G';
      case NetworkType.OFFLINE:
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getQualityLabel = () => {
    switch (quality) {
      case NetworkQuality.EXCELLENT:
        return 'Excellent';
      case NetworkQuality.GOOD:
        return 'Good';
      case NetworkQuality.FAIR:
        return 'Fair';
      case NetworkQuality.POOR:
        return 'Poor';
      case NetworkQuality.OFFLINE:
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`fixed top-16 left-0 right-0 z-40 border-b ${getStatusColor()}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={getTextColor()}>
              {getIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-semibold ${getTextColor()}`}>
                  {getQualityLabel()} Connection
                </p>
                <span className="text-xs px-2 py-1 bg-white rounded-full border">
                  {getNetworkTypeLabel()}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {latency !== null && (
                  <span className={getTextColor()}>
                    Latency: {latency}ms
                  </span>
                )}
                {downlink !== null && (
                  <span className={getTextColor()}>
                    {downlink.toFixed(1)} Mbps
                  </span>
                )}
              </div>
            </div>
          </div>

          {isSlowNetwork && (
            <div className="flex items-center gap-2 text-xs bg-white px-3 py-2 rounded-lg border">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-gray-700">
                {quality === NetworkQuality.OFFLINE 
                  ? 'You are offline' 
                  : 'Calls may be affected'}
              </span>
            </div>
          )}

          <button
            onClick={() => setIsVisible(false)}
            className={`text-lg ${getTextColor()} hover:opacity-70 transition-opacity`}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export default NetworkStatusBanner;
