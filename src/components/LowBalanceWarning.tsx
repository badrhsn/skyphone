'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface LowBalanceWarningProps {
  balance: number;
  threshold?: number;
  onClose?: () => void;
  isDuringCall?: boolean;
}

/**
 * Low Balance Warning Component
 * Shows warning when balance is low or about to run out
 * Can appear as modal or inline warning
 */
export function LowBalanceWarning({
  balance,
  threshold = 1.0,
  onClose,
  isDuringCall = false,
}: LowBalanceWarningProps) {
  const [isVisible, setIsVisible] = useState(balance < threshold);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setIsVisible(balance < threshold);
    setIsClosing(false);
  }, [balance, threshold]);

  if (!isVisible) {
    return null;
  }

  const handleClose = () => {
    setIsClosing(true);
    // Close immediately for snappy UX
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 150);
  };

  const isVeryLow = balance < 0.5;
  const isEmpty = balance <= 0;

  return (
    <div className={`fixed inset-0 ${isDuringCall ? 'z-30' : 'z-50'} flex items-center justify-center p-4 transition-opacity duration-150 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`relative bg-white rounded-2xl shadow-2xl max-w-sm w-full transition-all duration-150 ${isClosing ? 'scale-95' : 'scale-100'}`}>
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isEmpty ? 'bg-red-100' : isVeryLow ? 'bg-orange-100' : 'bg-yellow-100'
          }`}>
            <AlertTriangle className={`w-8 h-8 ${
              isEmpty ? 'text-red-600' : isVeryLow ? 'text-orange-600' : 'text-yellow-600'
            }`} />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-2">
            {isEmpty ? 'No Balance' : isVeryLow ? 'Very Low Balance' : 'Low Balance'}
          </h2>

          {/* Message */}
          <p className={`text-center mb-6 ${
            isEmpty ? 'text-red-600' : isVeryLow ? 'text-orange-600' : 'text-yellow-600'
          }`}>
            {isEmpty
              ? 'You have no credits available. Add funds to make calls.'
              : isVeryLow
              ? `You have only $${balance.toFixed(2)} left. Add funds soon.`
              : `Your balance is running low: $${balance.toFixed(2)}`}
          </p>

          {/* Call Impact */}
          {isDuringCall && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">
                  {isEmpty
                    ? 'Your current call will be disconnected unless you add credits.'
                    : 'Your current call may be interrupted if your balance runs out.'}
                </p>
              </div>
            </div>
          )}

          {/* Balance Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Balance:</span>
                <span className="text-lg font-bold text-gray-900">${balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Minimum to Call:</span>
                <span className="text-sm font-medium text-gray-700">$0.01</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Amount Needed:</span>
                <span className={`text-lg font-bold ${
                  isEmpty ? 'text-red-600' : 'text-orange-600'
                }`}>
                  ${(threshold - balance).toFixed(2)}+
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/dashboard/add-credits"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white font-semibold py-3 px-4 rounded-lg hover:from-[#0099d6] hover:to-[#0086c2] transition-all active:scale-95"
            >
              <CreditCard className="w-5 h-5" />
              <span>Add Credits Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {!isEmpty && (
              <button
                onClick={handleClose}
                className="w-full text-gray-700 font-semibold py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                I'll Add Later
              </button>
            )}
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-500 text-center mt-4">
            {isEmpty
              ? 'Your account has been suspended. Please add funds to resume calling.'
              : 'Calls are billed per minute. Exact costs depend on destination.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default LowBalanceWarning;
