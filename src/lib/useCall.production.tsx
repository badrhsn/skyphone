// Enhanced useCall hook with production-ready error handling, loading states, and browser compatibility

import { useEffect, useRef, useState } from 'react';
import twilioDebug from './twilioDebug';

type DeviceType = any;
type ConnectionType = any;

const CALL_STATUS = {
  IDLE: 'idle',
  CALLING: 'calling',
  CONNECTED: 'connected',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout'
} as const;

const ERROR_TYPES = {
  PERMISSION_DENIED: 'permission_denied',
  NETWORK_ERROR: 'network_error',
  TOKEN_ERROR: 'token_error',
  WEBHOOK_UNREACHABLE: 'webhook_unreachable',
  TIMEOUT: 'timeout',
  SDK_NOT_FOUND: 'sdk_not_found',
  MICROPHONE_NOT_FOUND: 'microphone_not_found',
  BROWSER_INCOMPATIBLE: 'browser_incompatible',
  UNKNOWN: 'unknown'
} as const;

// Browser compatibility check
const checkBrowserCompatibility = () => {
  const checks = {
    mediaDevices: !!navigator.mediaDevices?.getUserMedia,
    webrtc: !!(window.RTCPeerConnection || (window as any).webkitRTCPeerConnection),
    audioContext: !!(window.AudioContext || (window as any).webkitAudioContext),
    https: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
  };
  
  return {
    isSupported: Object.values(checks).every(v => v),
    checks,
    missingFeatures: Object.entries(checks)
      .filter(([_, supported]) => !supported)
      .map(([feature]) => feature)
  };
};

// Error type detection
const getErrorType = (error: any): string => {
  const message = error?.message?.toLowerCase() || '';
  
  if (message.includes('permission')) return ERROR_TYPES.PERMISSION_DENIED;
  if (message.includes('network')) return ERROR_TYPES.NETWORK_ERROR;
  if (message.includes('token')) return ERROR_TYPES.TOKEN_ERROR;
  if (message.includes('unreachable') || message.includes('webhook')) return ERROR_TYPES.WEBHOOK_UNREACHABLE;
  if (message.includes('timeout')) return ERROR_TYPES.TIMEOUT;
  if (message.includes('sdk')) return ERROR_TYPES.SDK_NOT_FOUND;
  if (message.includes('microphone')) return ERROR_TYPES.MICROPHONE_NOT_FOUND;
  if (message.includes('not supported')) return ERROR_TYPES.BROWSER_INCOMPATIBLE;
  
  return ERROR_TYPES.UNKNOWN;
};

// User-friendly error messages
const getErrorMessage = (errorType: string): { title: string; description: string; action?: string } => {
  const messages: Record<string, any> = {
    [ERROR_TYPES.PERMISSION_DENIED]: {
      title: 'Microphone Permission Denied',
      description: 'Please grant microphone access in your browser settings to make calls.',
      action: 'Check browser permissions'
    },
    [ERROR_TYPES.NETWORK_ERROR]: {
      title: 'Network Connection Issue',
      description: 'Check your internet connection and try again.',
      action: 'Retry'
    },
    [ERROR_TYPES.TOKEN_ERROR]: {
      title: 'Authentication Failed',
      description: 'Failed to authenticate. Please refresh the page and try again.',
      action: 'Refresh page'
    },
    [ERROR_TYPES.WEBHOOK_UNREACHABLE]: {
      title: 'Service Unavailable',
      description: 'Unable to reach Twilio service. Please try again in a moment.',
      action: 'Retry'
    },
    [ERROR_TYPES.TIMEOUT]: {
      title: 'Call Timeout',
      description: 'The call took too long to connect. Please try again.',
      action: 'Retry'
    },
    [ERROR_TYPES.SDK_NOT_FOUND]: {
      title: 'SDK Not Installed',
      description: 'WebRTC SDK is not installed. Please refresh the page.',
      action: 'Refresh page'
    },
    [ERROR_TYPES.MICROPHONE_NOT_FOUND]: {
      title: 'Microphone Not Found',
      description: 'No microphone detected. Please connect a microphone and try again.',
      action: 'Connect microphone'
    },
    [ERROR_TYPES.BROWSER_INCOMPATIBLE]: {
      title: 'Browser Not Supported',
      description: 'Your browser does not support WebRTC calls. Try Chrome, Firefox, or Edge.',
      action: 'Switch browser'
    },
    [ERROR_TYPES.UNKNOWN]: {
      title: 'Call Failed',
      description: 'An unexpected error occurred. Please try again.',
      action: 'Retry'
    }
  };
  
  return messages[errorType] || messages[ERROR_TYPES.UNKNOWN];
};

export function useCall() {
  // State
  const [status, setStatus] = useState<string>(CALL_STATUS.IDLE);
  const [number, setNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [callStatus, setCallStatus] = useState<string>(CALL_STATUS.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [device, setDevice] = useState<DeviceType | null>(null);
  const [connection, setConnection] = useState<ConnectionType | null>(null);
  const [call, setCall] = useState<ConnectionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<ConnectionType | null>(null);
  const [isIncomingCallRinging, setIsIncomingCallRinging] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [browserCompatibility, setBrowserCompatibility] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Refs
  const twilioDeviceRef = useRef<DeviceType | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check browser compatibility on mount
  useEffect(() => {
    const compatibility = checkBrowserCompatibility();
    setBrowserCompatibility(compatibility);
    
    if (!compatibility.isSupported) {
      const errorMsg = `Browser incompatible. Missing: ${compatibility.missingFeatures.join(', ')}`;
      setError(errorMsg);
      setErrorType(ERROR_TYPES.BROWSER_INCOMPATIBLE);
    }
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
      twilioDebug.success('Network connection restored');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setError('No internet connection');
      setErrorType(ERROR_TYPES.NETWORK_ERROR);
      twilioDebug.error('Network connection lost');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Format phone number
  const formatPhoneNumber = (s: string) => s.replace(/[^0-9+]/g, '');

  // Cleanup function
  const cleanup = () => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
    }
    if (twilioDeviceRef.current?.destroy) {
      try {
        twilioDeviceRef.current.destroy();
      } catch (e) {
        // ignore
      }
    }
    twilioDeviceRef.current = null;
  };

  // Initialize device with progress tracking
  const initDevice = async (forceReinit = false) => {
    if (twilioDeviceRef.current && !forceReinit) {
      return twilioDeviceRef.current;
    }

    if (!isOnline) {
      throw new Error('No internet connection');
    }

    if (browserCompatibility && !browserCompatibility.isSupported) {
      throw new Error('Browser not compatible');
    }

    try {
      setIsLoading(true);
      setLoadingStep('Fetching authentication token...');

      const res = await fetch('/api/twilio/token');
      const data = await res.json();
      
      if (!res.ok || !data?.token) {
        throw new Error(data?.error || 'Failed to get authentication token');
      }

      setLoadingStep('Requesting microphone access...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          throw new Error('Microphone permission denied');
        } else if (err.name === 'NotFoundError') {
          throw new Error('Microphone not found');
        } else {
          throw err;
        }
      }

      setLoadingStep('Loading WebRTC SDK...');
      let Twilio: any = null;
      try {
        const mod = await import('twilio-client');
        Twilio = mod && (mod.default || mod);
      } catch (e) {
        try {
          const mod2 = await import('@twilio/voice-sdk');
          Twilio = mod2 && (mod2.default || mod2);
        } catch (e2) {
          throw new Error('Twilio SDK not found. Please refresh the page.');
        }
      }

      setLoadingStep('Initializing Twilio device...');
      const deviceInstance = new Twilio.Device(data.token, { debug: true });
      twilioDeviceRef.current = deviceInstance;
      setDevice(deviceInstance);

      deviceInstance.on('ready', () => {
        twilioDebug.success('Device ready');
        setStatus(CALL_STATUS.IDLE);
        setLoadingStep('');
      });

      deviceInstance.on('error', (err: any) => {
        twilioDebug.error('Device error', err);
        setError(err?.message || String(err));
        setErrorType(getErrorType(err));
      });

      deviceInstance.on('incoming', (conn: ConnectionType) => {
        twilioDebug.success('Incoming call', { callSid: conn.parameters?.CallSid });
        setIncomingCall(conn);
        setIsIncomingCallRinging(true);
        setCallStatus(CALL_STATUS.CALLING);
      });

      deviceInstance.on('connect', (conn: ConnectionType) => {
        twilioDebug.success('Call connected', { callSid: conn.parameters?.CallSid });
        setConnection(conn);
        setCall(conn);
        setCallStatus(CALL_STATUS.CONNECTED);
        setStatus(CALL_STATUS.CALLING);
        setRetryCount(0); // Reset retry count on success
        setError(null);
      });

      deviceInstance.on('disconnect', () => {
        twilioDebug.success('Call disconnected');
        setConnection(null);
        setCall(null);
        setCallStatus(CALL_STATUS.COMPLETED);
        setStatus(CALL_STATUS.IDLE);
        setIsMuted(false);
        cleanup();
      });

      setLoadingStep('');
      return deviceInstance;
    } catch (err: any) {
      setLoadingStep('');
      const errorMsg = err?.message || String(err);
      twilioDebug.error('Device initialization failed', errorMsg);
      setError(errorMsg);
      setErrorType(getErrorType(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Call with retry logic and timeout
  const handleCall = async (params?: { To?: string; From?: string }, maxRetries = 2) => {
    if (!isOnline) {
      setError('No internet connection');
      setErrorType(ERROR_TYPES.NETWORK_ERROR);
      return;
    }

    try {
      setIsLoading(true);
      setCallStatus(CALL_STATUS.CALLING);
      setError(null);
      setErrorType(null);
      setRetryCount(0);

      const attemptCall = async (attempt: number) => {
        try {
          twilioDebug.log(`Call attempt ${attempt + 1}/${maxRetries + 1}`, params);
          
          // Set up timeout
          const timeoutPromise = new Promise<never>((_, reject) => {
            callTimeoutRef.current = setTimeout(() => {
              reject(new Error('TIMEOUT'));
            }, 30000); // 30 second timeout
          });

          const dev = await initDevice(attempt > 0); // Force reinit on retry
          if (!dev) {
            throw new Error('Device not initialized');
          }

          const connection = dev.connect({ params: params || {} });
          setCall(connection);

          // Race between call connection and timeout
          const result = await Promise.race([
            new Promise((resolve) => {
              connection.on('accept', () => {
                twilioDebug.success('Call accepted');
                setCallStatus(CALL_STATUS.CONNECTED);
                resolve(connection);
              });
              connection.on('error', (err: any) => {
                throw err;
              });
            }),
            timeoutPromise
          ]);

          if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
          }

          setRetryCount(0);
          return result;
        } catch (err: any) {
          if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
          }

          if (err.message === 'TIMEOUT') {
            err.message = 'Call timeout - took too long to connect';
          }

          if (attempt < maxRetries) {
            twilioDebug.warn(`Attempt ${attempt + 1} failed, retrying...`, err.message);
            setRetryCount(attempt + 1);
            // Exponential backoff: 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
            return attemptCall(attempt + 1);
          }

          throw err;
        }
      };

      return await attemptCall(0);
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      twilioDebug.error('Call failed', errorMsg);
      setError(errorMsg);
      setErrorType(getErrorType(err));
      setCallStatus(CALL_STATUS.FAILED);
      setIsCalling(false);
      throw err;
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Hangup with cleanup
  const handleHangUp = () => {
    try {
      twilioDebug.log('Hanging up call');
      
      if (call && typeof call.disconnect === 'function') {
        call.disconnect();
      } else if (connection && typeof connection.disconnect === 'function') {
        connection.disconnect();
      } else if (device && device.disconnectAll) {
        device.disconnectAll();
      }
      
      setCall(null);
      setConnection(null);
      setCallStatus(CALL_STATUS.COMPLETED);
      setStatus(CALL_STATUS.IDLE);
      setIsMuted(false);
    } catch (err: any) {
      twilioDebug.error('Error hanging up', err?.message);
      setError(err?.message || String(err));
    }
  };

  // Mute toggle
  const toggleMuteFn = () => {
    try {
      if (!call) {
        twilioDebug.warn('No active call to mute');
        return;
      }

      if (call.isMuted) {
        call.mute && call.mute(false);
        setIsMuted(false);
        twilioDebug.success('Call unmuted');
      } else {
        call.mute && call.mute(true);
        setIsMuted(true);
        twilioDebug.success('Call muted');
      }
    } catch (err: any) {
      twilioDebug.error('Mute toggle failed', err?.message);
      setError(err?.message || String(err));
    }
  };

  // Accept incoming call
  const acceptIncomingCall = () => {
    if (!incomingCall) return;
    try {
      twilioDebug.log('Accepting incoming call');
      incomingCall.accept();
      setCall(incomingCall);
      setIncomingCall(null);
      setIsIncomingCallRinging(false);
      setCallStatus(CALL_STATUS.CONNECTED);
      twilioDebug.success('Incoming call accepted');
    } catch (err: any) {
      twilioDebug.error('Accept failed', err?.message);
      setError(err?.message || String(err));
    }
  };

  // Reject incoming call
  const rejectIncomingCall = () => {
    if (!incomingCall) return;
    try {
      twilioDebug.log('Rejecting incoming call');
      incomingCall.reject && incomingCall.reject();
      setIncomingCall(null);
      setIsIncomingCallRinging(false);
      setCallStatus(CALL_STATUS.IDLE);
      twilioDebug.success('Incoming call rejected');
    } catch (err: any) {
      twilioDebug.error('Reject failed', err?.message);
      setError(err?.message || String(err));
    }
  };

  // Send DTMF digits
  const handleDigitInput = (digit: string) => {
    try {
      if (connection && typeof connection.sendDigits === 'function') {
        connection.sendDigits(digit);
      } else if (call && typeof call.sendDigits === 'function') {
        call.sendDigits(digit);
      }
    } catch (err: any) {
      twilioDebug.error('Sending digit failed', err?.message);
    }
  };

  // Toggle recording
  const toggleRecording = async (call_twilio_sid?: string, recording_sid?: string) => {
    try {
      if (!call_twilio_sid) return;
      if (recording_sid) {
        await fetch('/api/twilio/recording/stop', {
          method: 'POST',
          body: JSON.stringify({ callSid: call_twilio_sid, recordingSid: recording_sid })
        });
      } else {
        await fetch('/api/twilio/recording/start', {
          method: 'POST',
          body: JSON.stringify({ callSid: call_twilio_sid })
        });
      }
    } catch (err: any) {
      twilioDebug.error('Recording toggle failed', err?.message);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    status,
    number,
    setNumber,
    isLoading,
    loadingStep,
    callStatus,
    isMuted,
    device,
    connection,
    handleCall,
    handleHangUp,
    toggleMute: toggleMuteFn,
    formatPhoneNumber,
    error,
    setError,
    errorType,
    errorMessage: error ? getErrorMessage(errorType || ERROR_TYPES.UNKNOWN) : null,
    call,
    isIncomingCallRinging,
    rejectIncomingCall,
    acceptIncomingCall,
    handleDigitInput,
    toggleRecording,
    CALL_STATUS,
    ERROR_TYPES,
    retryCount,
    browserCompatibility,
    isOnline,
    canMakeCall: isOnline && (!browserCompatibility || browserCompatibility.isSupported),
  };
}

export default useCall;
