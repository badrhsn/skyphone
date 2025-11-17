'use client';

import React, { useState } from 'react';
import { Mic, CheckCircle, AlertCircle, X } from 'lucide-react';
import { usePermissions } from '@/lib/usePermissions';

interface PermissionRecoveryProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
  permissionType?: 'microphone' | 'camera' | 'notifications';
}

/**
 * Permission Recovery Component
 * Guides users through granting required browser permissions
 * Includes browser-specific instructions
 */
export function PermissionRecovery({
  isOpen,
  onClose,
  onPermissionGranted,
  permissionType = 'microphone',
}: PermissionRecoveryProps) {
  const permissions = usePermissions();
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [currentBrowser, setCurrentBrowser] = useState(detectBrowser());

  function detectBrowser(): string {
    if (typeof navigator === 'undefined') return 'Unknown';
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('firefox')) return 'Firefox';
    return 'Unknown';
  }

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const result =
        permissionType === 'microphone'
          ? await permissions.requestMicrophone()
          : permissionType === 'camera'
          ? await permissions.requestCamera()
          : false;

      if (result) {
        setPermissionStatus('granted');
        onPermissionGranted?.();
        // Auto close after 2 seconds
        setTimeout(onClose, 2000);
      } else {
        setPermissionStatus('denied');
      }
    } catch (error) {
      console.error('Permission request error:', error);
      setPermissionStatus('denied');
    } finally {
      setIsRequesting(false);
    }
  };

  if (!isOpen) return null;

  const getBrowserInstructions = () => {
    const instructions: Record<
      string,
      { title: string; steps: string[]; settingsPath: string }
    > = {
      Chrome: {
        title: 'Allow Microphone on Chrome',
        steps: [
          'Click the lock icon 🔒 in the address bar',
          'Find "Microphone" in the permissions list',
          'Select "Allow"',
          'Refresh the page and try again',
        ],
        settingsPath: 'chrome://settings/content/microphone',
      },
      Edge: {
        title: 'Allow Microphone on Microsoft Edge',
        steps: [
          'Click the lock icon 🔒 in the address bar',
          'Find "Microphone" in the permissions list',
          'Select "Allow"',
          'Refresh the page and try again',
        ],
        settingsPath: 'edge://settings/content/microphone',
      },
      Safari: {
        title: 'Allow Microphone on Safari',
        steps: [
          'Open Safari Preferences (⌘,)',
          'Go to "Websites" tab',
          'Select "Microphone" from left sidebar',
          'Set permissions for this site to "Allow"',
          'Refresh the page and try again',
        ],
        settingsPath: 'safari-settings',
      },
      Firefox: {
        title: 'Allow Microphone on Firefox',
        steps: [
          'Click the microphone icon 🎤 in the address bar',
          'Select "Allow" when prompted',
          'Refresh the page and try again',
        ],
        settingsPath: 'about:preferences#privacy',
      },
    };

    return instructions[currentBrowser] || instructions.Chrome;
  };

  const instructions = getBrowserInstructions();

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
          {permissionStatus === 'granted' ? (
            <>
              {/* Success State */}
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
                Permission Granted! ✓
              </h2>

              <p className="text-center text-gray-600 mb-6">
                Microphone access is now enabled. You're ready to make calls!
              </p>

              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium"
              >
                Close
              </button>
            </>
          ) : permissionStatus === 'denied' ? (
            <>
              {/* Denied State */}
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
                Permission Denied
              </h2>

              <p className="text-center text-gray-600 mb-6">
                We need microphone access to make calls. Please enable it in your browser settings.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-red-900 mb-2">Manual Setup Required:</h3>
                <ol className="space-y-2 text-sm text-red-800">
                  {instructions.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="font-bold flex-shrink-0">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={handleRequestPermission}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white rounded-lg hover:from-[#0099d6] hover:to-[#0086c2] transition-all font-medium"
                >
                  Try Again
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Initial Request State */}
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-blue-600" />
              </div>

              <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
                Microphone Permission
              </h2>

              <p className="text-center text-gray-600 mb-6">
                We need access to your microphone to make calls.
              </p>

              {/* Browser-Specific Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <span>{currentBrowser}</span>
                  <span className="text-sm font-normal text-gray-600">(Detected)</span>
                </h3>
                <ol className="space-y-2 text-sm text-blue-800">
                  {instructions.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="font-bold flex-shrink-0">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Info Box */}
              <div className="bg-gray-50 rounded-lg p-3 mb-6 text-xs text-gray-600">
                <p>
                  When you click "Grant Permission" below, your browser will show a permission
                  prompt. Select "Allow" to proceed.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestPermission}
                  disabled={isRequesting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white rounded-lg hover:from-[#0099d6] hover:to-[#0086c2] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                >
                  {isRequesting ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Requesting...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Grant Permission
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PermissionRecovery;
