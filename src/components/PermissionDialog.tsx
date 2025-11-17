'use client';

import { useState, useEffect } from 'react';
import { Mic, AlertCircle, Check } from 'lucide-react';
import { usePermissions, PermissionStatus, PermissionType } from '@/lib/usePermissions';

interface PermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGranted?: () => void;
  permissionType?: PermissionType;
}

/**
 * Permission Dialog Component
 * Requests browser permissions with user-friendly UI
 */
export function PermissionDialog({
  isOpen,
  onClose,
  onGranted,
  permissionType = PermissionType.MICROPHONE,
}: PermissionDialogProps) {
  const { microphone, requestMicrophone } = usePermissions();
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      const success = await requestMicrophone();
      if (success) {
        onGranted?.();
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        setError('Microphone permission was denied. Please enable it in your browser settings.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request permission');
    } finally {
      setIsRequesting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const getPermissionTitle = () => {
    switch (permissionType) {
      case PermissionType.MICROPHONE:
        return 'Microphone Access Required';
      case PermissionType.CAMERA:
        return 'Camera Access Required';
      case PermissionType.NOTIFICATIONS:
        return 'Notification Permission';
      default:
        return 'Permission Required';
    }
  };

  const getPermissionDescription = () => {
    switch (permissionType) {
      case PermissionType.MICROPHONE:
        return 'Yadaphone needs access to your microphone to make calls. Your microphone will only be used during active calls.';
      case PermissionType.CAMERA:
        return 'Yadaphone needs access to your camera. Your camera will only be used when you enable video calls.';
      case PermissionType.NOTIFICATIONS:
        return 'Yadaphone can send you notifications about call updates and account activity.';
      default:
        return 'Yadaphone needs access to this resource.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl">
        {/* Icon */}
        <div className="w-12 h-12 bg-[#e6fbff] rounded-full flex items-center justify-center mx-auto mb-4">
          <Mic className="w-6 h-6 text-[#00aff0]" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          {getPermissionTitle()}
        </h2>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6">
          {getPermissionDescription()}
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Current Status */}
        {microphone === PermissionStatus.GRANTED && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-600 font-medium">Permission granted ✓</p>
          </div>
        )}

        {/* Browser Instructions */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-600 font-semibold mb-2">Browser will ask for permission:</p>
          <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
            <li>Look for the permission prompt at the top of the page</li>
            <li>Click "Allow" to grant permission</li>
            <li>If you don't see it, click the lock or info icon in the address bar</li>
          </ol>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={isRequesting}
          >
            Maybe Later
          </button>
          <button
            onClick={handleRequest}
            disabled={isRequesting || microphone === PermissionStatus.GRANTED}
            className="flex-1 px-4 py-2.5 bg-[#00aff0] text-white rounded-lg font-semibold hover:bg-[#0099d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                Requesting...
              </span>
            ) : microphone === PermissionStatus.GRANTED ? (
              'Permission Granted'
            ) : (
              'Grant Permission'
            )}
          </button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 text-center mt-4">
          You can change permissions anytime in your browser settings.
        </p>
      </div>
    </div>
  );
}

export default PermissionDialog;
