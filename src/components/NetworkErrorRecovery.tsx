'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Wifi, WifiOff, Zap, RefreshCw, X } from 'lucide-react';
import { useNetworkStatus, NetworkQuality } from '@/lib/useNetworkStatus';

interface NetworkErrorRecoveryProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  errorMessage?: string;
}

/**
 * Network Error Recovery Component
 * Provides diagnostics and recovery options for network connection issues
 */
export function NetworkErrorRecovery({
  isOpen,
  onClose,
  onRetry,
  errorMessage = 'Connection was lost',
}: NetworkErrorRecoveryProps) {
  const { online, quality, type, latency, downlink, isUnstable } = useNetworkStatus();
  const [diagnosticsRun, setDiagnosticsRun] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Auto-run diagnostics when opened
  useEffect(() => {
    if (isOpen) {
      setDiagnosticsRun(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    onRetry?.();
  };

  const getStatusColor = () => {
    if (!online) return 'text-red-600 bg-red-50';
    switch (quality) {
      case NetworkQuality.EXCELLENT:
        return 'text-green-600 bg-green-50';
      case NetworkQuality.GOOD:
        return 'text-blue-600 bg-blue-50';
      case NetworkQuality.FAIR:
        return 'text-yellow-600 bg-yellow-50';
      case NetworkQuality.POOR:
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const qualityLabel = () => {
    if (!online) return 'Offline';
    switch (quality) {
      case NetworkQuality.EXCELLENT:
        return 'Excellent';
      case NetworkQuality.GOOD:
        return 'Good';
      case NetworkQuality.FAIR:
        return 'Fair';
      case NetworkQuality.POOR:
        return 'Poor';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
            Connection Problem
          </h2>

          {/* Message */}
          <p className="text-center text-gray-600 mb-6">
            {errorMessage}
          </p>

          {/* Diagnostics Section */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                Connection Diagnostics
              </h3>
              <button
                onClick={() => setDiagnosticsRun(true)}
                className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-200 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>

            {/* Diagnostics Grid */}
            <div className="space-y-3">
              {/* Online Status */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                <div className="flex items-center gap-2">
                  {online ? (
                    <Wifi className="w-4 h-4 text-green-600" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm text-gray-600">Status</span>
                </div>
                <span className={`text-sm font-semibold ${online ? 'text-green-600' : 'text-red-600'}`}>
                  {online ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Network Quality */}
              {online && (
                <>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">Quality</span>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusColor()}`}>
                      {qualityLabel()}
                    </span>
                  </div>

                  {/* Network Type */}
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">Type</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {type || 'Unknown'}
                    </span>
                  </div>

                  {/* Latency */}
                  {latency !== null && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <span className="text-sm text-gray-600">Latency</span>
                      <span className={`text-sm font-semibold ${latency > 100 ? 'text-orange-600' : 'text-green-600'}`}>
                        {latency}ms
                      </span>
                    </div>
                  )}

                  {/* Download Speed */}
                  {downlink !== null && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <span className="text-sm text-gray-600">Speed</span>
                      <span className={`text-sm font-semibold ${downlink < 1 ? 'text-red-600' : downlink < 5 ? 'text-orange-600' : 'text-green-600'}`}>
                        {downlink.toFixed(1)} Mbps
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Recovery Suggestions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">What You Can Do:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-lg leading-none">✓</span>
                <span>Check if you're connected to WiFi or cellular data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lg leading-none">✓</span>
                <span>Restart your router or move closer to it</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lg leading-none">✓</span>
                <span>Switch between WiFi and mobile data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lg leading-none">✓</span>
                <span>Close other apps using network bandwidth</span>
              </li>
            </ul>
          </div>

          {/* Status Alert */}
          {!online && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ You are currently offline. Please restore your connection to retry.
              </p>
            </div>
          )}

          {isUnstable && online && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-700 font-medium">
                ⚠️ Your connection is unstable. The call may be affected.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
            <button
              onClick={handleRetry}
              disabled={!online}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white rounded-lg hover:from-[#0099d6] hover:to-[#0086c2] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${retryCount > 0 ? 'animate-spin' : ''}`} />
              Retry Call
            </button>
          </div>

          {/* Retry Info */}
          {retryCount > 0 && (
            <p className="text-xs text-center text-gray-500 mt-3">
              Attempt {retryCount}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default NetworkErrorRecovery;
