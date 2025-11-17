import { useEffect, useRef, useState } from 'react';
import twilioDebug from './twilioDebug';

type DeviceType = any;
type ConnectionType = any;

const CALL_STATUS = {
  IDLE: 'idle',
  CALLING: 'calling',
  CONNECTED: 'connected',
  COMPLETED: 'completed'
} as const;

const log = (msg: string, data?: any) => {
  twilioDebug.log(`[useCall] ${msg}`, data);
};

const logSuccess = (msg: string, data?: any) => {
  twilioDebug.success(`[useCall] ${msg}`, data);
};

const logError = (msg: string, data?: any) => {
  twilioDebug.error(`[useCall] ${msg}`, data);
};

export function useCall() {
  const [status, setStatus] = useState<string>(CALL_STATUS.IDLE);
  const [number, setNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [callStatus, setCallStatus] = useState<string>(CALL_STATUS.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [device, setDevice] = useState<DeviceType | null>(null);
  const [connection, setConnection] = useState<ConnectionType | null>(null);
  const [call, setCall] = useState<ConnectionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<ConnectionType | null>(null);
  const [isIncomingCallRinging, setIsIncomingCallRinging] = useState(false);

  const twilioDeviceRef = useRef<DeviceType | null>(null);

  // Format phone number utility (very small implementation)
  const formatPhoneNumber = (s: string) => s.replace(/[^0-9+]/g, '');

  // Fetch token from server and init Twilio Device
  const initDevice = async () => {
    if (twilioDeviceRef.current) return twilioDeviceRef.current;
    try {
      setIsLoading(true);
      log('Initializing Twilio Device...');

      const res = await fetch('/api/twilio/token');
      const data = await res.json();
      if (!res.ok || !data?.token) {
        logError('Failed to fetch token', data?.error || res.statusText);
        throw new Error(data?.error || 'Failed to get Twilio token');
      }

      logSuccess('Token fetched successfully');

      // Ensure microphone permission (browsers require secure contexts for getUserMedia)
      try {
        log('Requesting microphone permission...');
        await navigator.mediaDevices.getUserMedia({ audio: true });
        logSuccess('Microphone permission granted');
      } catch (err) {
        logError('Microphone access denied or not available', err);
        // continue — Twilio Device may still initialize but user won't be able to send audio
      }

      // dynamic import of Twilio client SDK; package must be installed in the project
      let Twilio: any = null;
      try {
        log('Loading Twilio Voice SDK...');
        // Try new package name first
        const mod = await import('@twilio/voice-sdk');
        Twilio = (mod && (mod.default || mod));
        logSuccess('Loaded @twilio/voice-sdk SDK');
      } catch (e) {
        // Fallback to old package name
        try {
          log('Trying twilio-client...');
          const mod2 = await import('twilio-client');
          Twilio = (mod2 && (mod2.default || mod2));
          logSuccess('Loaded twilio-client SDK');
        } catch (e2) {
          logError('Twilio SDK not found. Please install @twilio/voice-sdk');
          throw new Error('Twilio client SDK not installed');
        }
      }

      log('Creating Device instance...');
      const deviceInstance = new Twilio.Device(data.token, { debug: true });
      twilioDeviceRef.current = deviceInstance;
      setDevice(deviceInstance);

      deviceInstance.on('ready', () => {
        logSuccess('Twilio Device ready');
        setStatus(CALL_STATUS.IDLE);
      });

      deviceInstance.on('error', (err: any) => {
        logError('Device error', err);
        setError(err?.message || String(err));
      });

      deviceInstance.on('incoming', (conn: ConnectionType) => {
        logSuccess('Incoming call received', { callSid: conn.parameters?.CallSid });
        setIncomingCall(conn);
        setIsIncomingCallRinging(true);
        setCallStatus(CALL_STATUS.CALLING);
      });

      deviceInstance.on('connect', (conn: ConnectionType) => {
        logSuccess('Call connected', { callSid: conn.parameters?.CallSid });
        setConnection(conn);
        setCall(conn);
        setCallStatus(CALL_STATUS.CONNECTED);
        setStatus(CALL_STATUS.CALLING);
      });

      deviceInstance.on('disconnect', (conn: ConnectionType) => {
        logSuccess('Call disconnected');
        setConnection(null);
        setCall(null);
        setCallStatus(CALL_STATUS.COMPLETED);
        setStatus(CALL_STATUS.IDLE);
        setIsMuted(false);
      });

      logSuccess('Device initialized');
      return deviceInstance;
    } catch (err: any) {
      logError('Failed to initialize device', err?.message);
      setError(err?.message || String(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = async (params?: { To?: string; From?: string; callerIdType?: string; callerIdInfo?: string; PhoneNumber?: string; Country?: string; Rate?: number }) => {
    try {
      setIsLoading(true);
      setCallStatus(CALL_STATUS.CALLING);
      log('Starting call', params);

      const dev = await initDevice();
      if (!dev) {
        logError('Device not initialized');
        throw new Error('Device not initialized');
      }

      // Validate required parameters
      if (!params?.To) {
        throw new Error('Destination phone number (To) is required');
      }

      log('Connecting to destination', params);
      
      // Twilio Device.connect() expects params object
      const callParams = {
        To: params.To,
        From: params.From || '+12293983710',
        // Pass other tracking parameters
        callerIdType: params.callerIdType,
        PhoneNumber: params.PhoneNumber,
        Country: params.Country,
        Rate: params.Rate?.toString(),
      };

      log('Call parameters', callParams);
      const connection = dev.connect(callParams);
      
      if (!connection) {
        throw new Error('Failed to create connection');
      }

      setCall(connection);

      // attach listeners if present
      connection.on && connection.on('accept', () => {
        logSuccess('Call accepted');
        setCallStatus(CALL_STATUS.CONNECTED);
      });
      connection.on && connection.on('disconnect', () => {
        logSuccess('Call disconnected');
        setCallStatus(CALL_STATUS.COMPLETED);
      });
      connection.on && connection.on('error', (err: any) => {
        logError('Call error', err?.message);
        setError(err?.message || String(err));
        setCallStatus(CALL_STATUS.IDLE);
      });

      logSuccess('Call initiated', { callSid: connection.parameters?.CallSid });
      return connection;
    } catch (err: any) {
      logError('Call initiation failed', err?.message);
      setError(err?.message || String(err));
      setCallStatus(CALL_STATUS.IDLE);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleHangUp = () => {
    try {
      log('Hanging up call...');
      if (call && typeof call.disconnect === 'function') {
        call.disconnect();
        logSuccess('Call disconnected');
      } else if (connection && typeof connection.disconnect === 'function') {
        connection.disconnect();
        logSuccess('Connection disconnected');
      } else if (device && device.disconnectAll) {
        device.disconnectAll();
        logSuccess('All connections disconnected');
      } else {
        logError('No active connection to disconnect');
      }
      setCall(null);
      setConnection(null);
      setCallStatus(CALL_STATUS.COMPLETED);
      setStatus(CALL_STATUS.IDLE);
    } catch (err: any) {
      logError('Error hanging up', err?.message);
      setError(err?.message || String(err));
    }
  };

  const toggleMuteFn = () => {
    try {
      if (!call) {
        logError('No active call to mute');
        return;
      }
      // Twilio Connection usually has mute/unmute methods
      if (call.isMuted) {
        call.mute && call.mute(false);
        setIsMuted(false);
        logSuccess('Unmuted');
      } else {
        call.mute && call.mute(true);
        setIsMuted(true);
        logSuccess('Muted');
      }
    } catch (err: any) {
      logError('Mute toggle failed', err?.message);
      setError(err?.message || String(err));
    }
  };

  const acceptIncomingCall = () => {
    if (!incomingCall) return;
    try {
      log('Accepting incoming call...');
      incomingCall.accept();
      setCall(incomingCall);
      setIncomingCall(null);
      setIsIncomingCallRinging(false);
      setCallStatus(CALL_STATUS.CONNECTED);
      logSuccess('Incoming call accepted');
    } catch (err: any) {
      logError('Accept incoming failed', err?.message);
      setError(err?.message || String(err));
    }
  };

  const rejectIncomingCall = () => {
    if (!incomingCall) return;
    try {
      log('Rejecting incoming call...');
      incomingCall.reject && incomingCall.reject();
      setIncomingCall(null);
      setIsIncomingCallRinging(false);
      setCallStatus(CALL_STATUS.IDLE);
      logSuccess('Incoming call rejected');
    } catch (err: any) {
      logError('Reject incoming failed', err?.message);
      setError(err?.message || String(err));
    }
  };

  const handleDigitInput = (digit: string) => {
    try {
      if (connection && typeof connection.sendDigits === 'function') {
        connection.sendDigits(digit);
      } else if (call && typeof call.sendDigits === 'function') {
        call.sendDigits(digit);
      } else {
        console.warn('No active connection to send DTMF');
      }
    } catch (err: any) {
      console.error('Sending digit failed', err);
      setError(err?.message || String(err));
    }
  };

  // Recording toggles - placeholder calls to server endpoints
  const toggleRecording = async (call_twilio_sid?: string, recording_sid?: string) => {
    try {
      if (!call_twilio_sid) return;
      // This assumes you have server endpoints to start/stop recordings
      if (recording_sid) {
        await fetch(`/api/twilio/recording/stop`, { method: 'POST', body: JSON.stringify({ callSid: call_twilio_sid, recordingSid: recording_sid }) });
      } else {
        await fetch(`/api/twilio/recording/start`, { method: 'POST', body: JSON.stringify({ callSid: call_twilio_sid }) });
      }
    } catch (err) {
      console.error('Recording toggle failed', err);
    }
  };

  useEffect(() => {
    // cleanup on unmount
    return () => {
      try {
        if (twilioDeviceRef.current && twilioDeviceRef.current.destroy) {
          twilioDeviceRef.current.destroy();
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  return {
    status,
    number,
    setNumber,
    isLoading,
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
    call,
    isIncomingCallRinging,
    rejectIncomingCall,
    acceptIncomingCall,
    handleDigitInput,
    toggleRecording,
    CALL_STATUS
  };
}

export default useCall;
