'use client';

import { useEffect, useState, useMemo } from 'react';
import { DollarSign, TrendingDown, Clock } from 'lucide-react';

interface LiveCostTrackerProps {
  callDuration: number; // seconds
  ratePerMinute: number; // cost per minute
  isActive: boolean;
  userBalance?: number;
  onLowBalance?: (isLow: boolean) => void;
  lowBalanceThreshold?: number;
}

/**
 * Live Cost Tracker Component
 * Shows real-time per-second billing during active calls
 * Updates cost calculation as call duration increases
 */
export function LiveCostTracker({
  callDuration,
  ratePerMinute,
  isActive,
  userBalance = 0,
  onLowBalance,
  lowBalanceThreshold = 1.0,
}: LiveCostTrackerProps) {
  const [currentSecond, setCurrentSecond] = useState(0);
  const [costHistory, setCostHistory] = useState<number[]>([]);

  /**
   * Calculate cost based on duration and rate
   * Typically billed per minute (rounded up)
   */
  const calculateCost = (seconds: number, ratePerMin: number) => {
    const minutes = Math.ceil(seconds / 60);
    return minutes * ratePerMin;
  };

  const currentCost = useMemo(() => {
    return calculateCost(callDuration, ratePerMinute);
  }, [callDuration, ratePerMinute]);

  const remainingBalance = useMemo(() => {
    return userBalance - currentCost;
  }, [userBalance, currentCost]);

  const isBalanceLow = useMemo(() => {
    return remainingBalance < lowBalanceThreshold;
  }, [remainingBalance, lowBalanceThreshold]);

  /**
   * Update cost history for visualization
   */
  useEffect(() => {
    if (isActive && callDuration > 0 && callDuration !== currentSecond) {
      setCurrentSecond(callDuration);

      // Add to history every second
      if (callDuration % 60 === 0) {
        setCostHistory((prev) => [...prev, currentCost]);
      }
    }
  }, [callDuration, isActive, currentCost]);

  /**
   * Notify when balance is low
   */
  useEffect(() => {
    onLowBalance?.(isBalanceLow);
  }, [isBalanceLow, onLowBalance]);

  const costPerSecond = (ratePerMinute / 60).toFixed(6);
  const formattedCost = currentCost.toFixed(4);
  const formattedRemaining = Math.max(0, remainingBalance).toFixed(2);

  return (
    <div className={`rounded-xl p-4 transition-all duration-300 ${
      isActive
        ? isBalanceLow
          ? 'bg-red-50 border-2 border-red-300'
          : 'bg-green-50 border-2 border-green-300'
        : 'bg-gray-50 border border-gray-200'
    }`}>
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className={`w-5 h-5 ${
          isActive ? (isBalanceLow ? 'text-red-600' : 'text-green-600') : 'text-gray-600'
        }`} />
        <h3 className={`text-sm font-semibold ${
          isActive ? (isBalanceLow ? 'text-red-800' : 'text-green-800') : 'text-gray-800'
        }`}>
          Call Cost
        </h3>
      </div>

      {/* Main Cost Display */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Current Cost */}
        <div>
          <p className="text-xs text-gray-600 font-medium mb-1">Total Cost</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${
              isActive ? (isBalanceLow ? 'text-red-700' : 'text-green-700') : 'text-gray-700'
            }`}>
              ${formattedCost}
            </span>
            <span className="text-xs text-gray-500">USD</span>
          </div>
        </div>

        {/* Remaining Balance */}
        <div>
          <p className="text-xs text-gray-600 font-medium mb-1">Remaining</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${
              isBalanceLow ? 'text-red-700' : 'text-gray-700'
            }`}>
              ${formattedRemaining}
            </span>
            <span className="text-xs text-gray-500">USD</span>
          </div>
        </div>
      </div>

      {/* Per-Second Rate */}
      <div className="bg-white rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 font-medium">Rate</span>
          <span className="text-xs bg-[#e6fbff] text-[#00aff0] px-2 py-1 rounded">
            ${ratePerMinute.toFixed(3)}/min
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Per Second</span>
          <span className="text-xs text-gray-800 font-medium">${costPerSecond}</span>
        </div>
      </div>

      {/* Call Duration */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        <Clock className="w-4 h-4 text-gray-500" />
        <span className="text-gray-700 font-medium">
          {Math.floor(callDuration / 60)}m {callDuration % 60}s
        </span>
      </div>

      {/* Status Indicator */}
      {isActive && (
        <>
          {isBalanceLow ? (
            <div className="bg-red-100 text-red-700 text-xs p-2 rounded-lg font-semibold text-center animate-pulse">
              ⚠️ Low Balance - Call may be interrupted
            </div>
          ) : (
            <div className="bg-green-100 text-green-700 text-xs p-2 rounded-lg font-semibold text-center flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Call Active
            </div>
          )}
        </>
      )}

      {/* Cost Breakdown */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Billing Method:</span>
            <span className="font-medium">Per Minute (rounded up)</span>
          </div>
          <div className="flex justify-between">
            <span>Current Minutes:</span>
            <span className="font-medium">{Math.ceil(callDuration / 60)}</span>
          </div>
          <div className="flex justify-between">
            <span>Seconds This Minute:</span>
            <span className="font-medium">{callDuration % 60}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveCostTracker;
