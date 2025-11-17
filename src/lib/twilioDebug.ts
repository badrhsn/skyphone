/**
 * Twilio debugging utilities for WebRTC calls
 * Helps diagnose issues with token fetching, device initialization, and call flow
 */

export const twilioDebug = {
  log: (message: string, data?: any) => {
    console.log(`🔷 [Twilio] ${message}`, data || '');
  },
  
  success: (message: string, data?: any) => {
    console.log(`✅ [Twilio] ${message}`, data || '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ [Twilio] ${message}`, data || '');
  },
  
  error: (message: string, data?: any) => {
    console.error(`❌ [Twilio] ${message}`, data || '');
  },
  
  // Test token endpoint
  testTokenEndpoint: async () => {
    twilioDebug.log('Testing /api/twilio/token endpoint...');
    try {
      const res = await fetch('/api/twilio/token');
      if (!res.ok) {
        twilioDebug.error(`Token endpoint returned ${res.status}`, await res.text());
        return null;
      }
      const data = await res.json();
      if (!data.token) {
        twilioDebug.error('Token endpoint returned no token', data);
        return null;
      }
      twilioDebug.success('Token endpoint working', {
        tokenLength: data.token.length,
        identity: data.identity,
      });
      return data;
    } catch (err) {
      twilioDebug.error('Token endpoint failed', err);
      return null;
    }
  },

  // Test microphone access
  testMicrophone: async () => {
    twilioDebug.log('Requesting microphone access...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      twilioDebug.success('Microphone access granted');
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err: any) {
      twilioDebug.error('Microphone access denied or unavailable', err.message);
      return false;
    }
  },

  // Test Device initialization
  testDeviceInit: async (token: string) => {
    twilioDebug.log('Testing Twilio Device initialization...');
    try {
      let Twilio: any = null;
      try {
        const mod = await import('twilio-client');
        Twilio = mod && (mod.default || mod);
      } catch (e) {
        twilioDebug.error('Twilio SDK (twilio-client) not found. Run: npm install twilio-client');
        return null;
      }

      const device = new Twilio.Device(token, { debug: true });
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          twilioDebug.warn('Device initialization timeout (10s)');
          device.destroy?.();
          resolve(null);
        }, 10000);

        device.on('ready', () => {
          clearTimeout(timeout);
          twilioDebug.success('Twilio Device initialized and ready');
          device.destroy?.();
          resolve(device);
        });

        device.on('error', (err: any) => {
          clearTimeout(timeout);
          twilioDebug.error('Device initialization error', err);
          device.destroy?.();
          resolve(null);
        });
      });
    } catch (err) {
      twilioDebug.error('Device init test failed', err);
      return null;
    }
  },

  // Full diagnostic test
  fullDiagnostic: async () => {
    twilioDebug.log('=== Starting Full WebRTC Diagnostic ===');
    
    const results = {
      timestamp: new Date().toISOString(),
      token: null as any,
      microphone: false,
      device: null as any,
      allPassed: false,
    };

    // Test 1: Token endpoint
    twilioDebug.log('TEST 1/3: Token Endpoint');
    results.token = await twilioDebug.testTokenEndpoint();
    if (!results.token) {
      twilioDebug.error('❌ Token test failed - stopping diagnostic');
      return results;
    }

    // Test 2: Microphone
    twilioDebug.log('TEST 2/3: Microphone Access');
    results.microphone = await twilioDebug.testMicrophone();
    if (!results.microphone) {
      twilioDebug.warn('⚠️ Microphone test failed - WebRTC calls may have no audio');
    }

    // Test 3: Device
    twilioDebug.log('TEST 3/3: Twilio Device Initialization');
    results.device = await twilioDebug.testDeviceInit(results.token.token);
    if (!results.device) {
      twilioDebug.error('❌ Device initialization failed');
      return results;
    }

    results.allPassed = !!results.token && !!results.device;
    
    twilioDebug.log('=== Diagnostic Complete ===', results);
    return results;
  },
};

// Additional debugging utilities for API key and webhook validation
export const debugExtended = {
  // Verify Twilio API key has Voice grant
  verifyApiKeyPermissions: async () => {
    twilioDebug.log('Verifying Twilio API Key permissions...');
    try {
      const res = await fetch('/api/twilio/debug/verify-api-key', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) {
        twilioDebug.error(`API Key verification failed: ${res.status}`, await res.text());
        return { valid: false, error: `HTTP ${res.status}` };
      }
      
      const data = await res.json();
      if (data.valid) {
        twilioDebug.success('API Key has proper Voice permissions', data);
      } else {
        twilioDebug.error('API Key missing Voice permissions', data);
      }
      return data;
    } catch (err) {
      twilioDebug.error('Failed to verify API Key', err);
      return { valid: false, error: String(err) };
    }
  },

  // Test if Twilio can reach the voice webhook
  testWebhookReachability: async () => {
    twilioDebug.log('Testing if Twilio can reach voice webhook...');
    try {
      const res = await fetch('/api/twilio/debug/webhook-reachability', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!res.ok) {
        twilioDebug.error(`Webhook test failed: ${res.status}`, await res.text());
        return { reachable: false, error: `HTTP ${res.status}` };
      }
      
      const data = await res.json();
      if (data.reachable) {
        twilioDebug.success('Voice webhook is reachable by Twilio', data);
      } else {
        twilioDebug.error('Voice webhook is NOT reachable by Twilio', data);
      }
      return data;
    } catch (err) {
      twilioDebug.error('Failed to test webhook reachability', err);
      return { reachable: false, error: String(err) };
    }
  },

  // Full system diagnostics including API key and webhook
  fullSystemDiagnostic: async () => {
    twilioDebug.log('=== Starting Full System Diagnostic ===');
    
    const results = {
      timestamp: new Date().toISOString(),
      webrtc: { token: null, microphone: false, device: null },
      infrastructure: { apiKey: { valid: false }, webhook: { reachable: false } },
      allPassed: false,
    };

    // WebRTC diagnostics
    twilioDebug.log('PHASE 1/2: WebRTC Components');
    const webrtcTest = await twilioDebug.fullDiagnostic();
    results.webrtc = webrtcTest as any;

    // Infrastructure diagnostics
    twilioDebug.log('PHASE 2/2: Twilio Infrastructure');
    
    const apiKeyTest = await debugExtended.verifyApiKeyPermissions();
    results.infrastructure.apiKey = apiKeyTest as any;
    
    const webhookTest = await debugExtended.testWebhookReachability();
    results.infrastructure.webhook = webhookTest as any;

    results.allPassed = 
      results.webrtc.allPassed && 
      results.infrastructure.apiKey.valid && 
      results.infrastructure.webhook.reachable;
    
    twilioDebug.log('=== System Diagnostic Complete ===', results);
    return results;
  },
};

export default twilioDebug;
