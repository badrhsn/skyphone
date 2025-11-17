'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, RotateCcw, X, Copy, ExternalLink } from 'lucide-react';
import {
  categorizeError,
  getSuggestionText,
  getErrorIcon,
  CategorizedError,
  RecoverySuggestion,
} from '@/lib/errorCategorization';

interface CallFailureRecoveryProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  onAddCredits?: () => void;
  error?: Error | string;
  phoneNumber?: string;
  userBalance?: number;
}

/**
 * Call Failure Recovery Component
 * Shows failure reasons and offers contextual recovery options
 */
export function CallFailureRecovery({
  isOpen,
  onClose,
  onRetry,
  onAddCredits,
  error,
  phoneNumber,
  userBalance = 0,
}: CallFailureRecoveryProps) {
  const [categorized, setCategorized] = useState<CategorizedError | null>(null);
  const [copiedErrorId, setCopiedErrorId] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (error) {
      const cat = categorizeError(error);
      setCategorized(cat);
    }
  }, [error]);

  if (!isOpen || !categorized) return null;

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    onRetry?.();
  };

  const handleCopyError = () => {
    const errorText = `${categorized.title}\n${categorized.details}`;
    navigator.clipboard.writeText(errorText);
    setCopiedErrorId(true);
    setTimeout(() => setCopiedErrorId(false), 2000);
  };

  const shouldShowPhoneNumber = phoneNumber && categorized.category !== 'BALANCE';

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
          <div className="text-5xl text-center mb-4">
            {getErrorIcon(categorized.category)}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
            {categorized.title}
          </h2>

          {/* Message */}
          <p className="text-center text-gray-600 mb-6">
            {categorized.message}
          </p>

          {/* Call Details (if applicable) */}
          {shouldShowPhoneNumber && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
              <div className="text-xs text-gray-600 font-medium mb-1">Attempted Call:</div>
              <div className="text-sm font-mono text-gray-900">{phoneNumber}</div>
            </div>
          )}

          {/* Balance Info (if BALANCE error) */}
          {categorized.category === 'BALANCE' && (
            <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-lg">💳</span>
                <div>
                  <div className="text-xs text-purple-600 font-medium">Current Balance</div>
                  <div className="text-lg font-bold text-purple-900">${userBalance?.toFixed(2) || '0.00'}</div>
                </div>
              </div>
              <p className="text-xs text-purple-700">Add credits to continue making calls</p>
            </div>
          )}

          {/* Error Details (expandable) */}
          {categorized.details && (
            <details className="mb-6">
              <summary className="text-xs font-medium text-gray-600 cursor-pointer hover:text-gray-900 mb-2">
                Technical Details
              </summary>
              <div className="bg-gray-50 rounded p-3 text-xs text-gray-600 font-mono break-words max-h-32 overflow-y-auto border border-gray-200">
                {categorized.details}
              </div>
            </details>
          )}

          {/* Recovery Suggestions */}
          {categorized.suggestions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">What You Can Do:</h3>
              <div className="space-y-2">
                {categorized.suggestions.map((suggestion, idx) => {
                  const text = getSuggestionText(suggestion);
                  return (
                    <div key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                      <span className="text-lg leading-none">→</span>
                      <div>
                        <div className="font-medium">{text.label}</div>
                        <div className="text-xs text-blue-700">{text.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>

            {/* Conditional Action Button */}
            {categorized.category === 'BALANCE' ? (
              <button
                onClick={onAddCredits}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all font-medium flex items-center justify-center gap-2"
              >
                <span>💳</span>
                Add Credits
              </button>
            ) : categorized.retryable ? (
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white rounded-lg hover:from-[#0099d6] hover:to-[#0086c2] transition-all font-medium flex items-center justify-center gap-2"
              >
                <RotateCcw className={`w-4 h-4 ${retryCount > 0 ? 'animate-spin' : ''}`} />
                Try Again
              </button>
            ) : null}
          </div>

          {/* Retry Count */}
          {retryCount > 0 && (
            <p className="text-xs text-center text-gray-500 mb-3">
              Attempt {retryCount}
            </p>
          )}

          {/* Support Link */}
          <div className="border-t border-gray-200 pt-3">
            <button
              onClick={handleCopyError}
              className="w-full flex items-center justify-center gap-2 text-xs text-gray-600 hover:text-gray-900 py-2 rounded hover:bg-gray-50 transition-colors"
            >
              <Copy className={`w-3 h-3 ${copiedErrorId ? 'text-green-600' : ''}`} />
              <span>{copiedErrorId ? 'Copied to clipboard!' : 'Copy error details'}</span>
            </button>
            <a
              href="https://support.yadaphone.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 text-xs text-[#00aff0] hover:text-[#0099d6] py-2 rounded hover:bg-[#f3fbff] transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Contact Support</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CallFailureRecovery;
