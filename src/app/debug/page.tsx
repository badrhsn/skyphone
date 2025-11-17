// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Zap, Send } from "lucide-react";

interface LogEntry {
  type: 'info' | 'success' | 'error' | 'warn';
  message: string;
  timestamp: string;
  data?: any;
}

export default function DebugPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (type: LogEntry['type'], message: string, data?: any) => {
    const entry: LogEntry = {
      type,
      message,
      timestamp: new Date().toLocaleTimeString(),
      data,
    };
    setLogs((prev) => [...prev, entry]);
  };

  // Intercept console methods
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      const message = args[0];
      const data = args[1];
      if (message?.includes('✅')) {
        addLog('success', message, data);
      } else if (message?.includes('❌')) {
        addLog('error', message, data);
      } else if (message?.includes('⚠️')) {
        addLog('warn', message, data);
      } else {
        addLog('info', message, data);
      }
      originalLog(...args);
    };

    console.error = (...args) => {
      addLog('error', String(args[0]), args[1]);
      originalError(...args);
    };

    console.warn = (...args) => {
      addLog('warn', String(args[0]), args[1]);
      originalWarn(...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const testTokenEndpoint = async () => {
    setTesting(true);
    setLogs([]);
    addLog('info', '🔗 Testing Token Endpoint...');

    try {
      const res = await fetch('/api/twilio/token');
      const data = await res.json();

      if (!res.ok) {
        addLog('error', `❌ Token endpoint returned ${res.status}`, data);
        setResults({ token: false });
      } else if (!data.token) {
        addLog('error', '❌ No token in response', data);
        setResults({ token: false });
      } else {
        addLog('success', '✅ Token endpoint working', {
          tokenLength: data.token.length,
          identity: data.identity,
        });
        setResults({ token: true });
      }
    } catch (err: any) {
      addLog('error', `❌ Token test failed: ${err.message}`, err);
      setResults({ token: false });
    }

    setTesting(false);
  };

  const testMicrophone = async () => {
    setTesting(true);
    setLogs([]);
    addLog('info', '🎤 Testing Microphone Access...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog('success', '✅ Microphone access granted', {
        audioTracks: stream.getAudioTracks().length,
      });
      stream.getTracks().forEach((track) => track.stop());
      setResults((prev: any) => ({ ...prev, microphone: true }));
    } catch (err: any) {
      addLog('error', `❌ Microphone access denied: ${err.message}`, err);
      setResults((prev: any) => ({ ...prev, microphone: false }));
    }

    setTesting(false);
  };

  const testApiKeyPermissions = async () => {
    setTesting(true);
    setLogs([]);
    addLog('info', '🔐 Testing API Key Permissions...');

    try {
      const res = await fetch('/api/twilio/debug/verify-api-key');
      const data = await res.json();

      if (!res.ok || !data.valid) {
        addLog('error', `❌ API Key validation failed`, data);
        setResults((prev: any) => ({ ...prev, apiKey: false }));
      } else {
        addLog('success', '✅ API Key has proper Voice permissions', data.details);
        if (data.recommendations) {
          data.recommendations.forEach((rec: string) => {
            addLog('info', rec);
          });
        }
        setResults((prev: any) => ({ ...prev, apiKey: true }));
      }
    } catch (err: any) {
      addLog('error', `❌ API Key test failed: ${err.message}`, err);
      setResults((prev: any) => ({ ...prev, apiKey: false }));
    }

    setTesting(false);
  };

  const testWebhookReachability = async () => {
    setTesting(true);
    setLogs([]);
    addLog('info', '🌐 Testing Webhook Reachability...');

    try {
      const res = await fetch('/api/twilio/debug/webhook-reachability');
      const data = await res.json();

      if (!res.ok || !data.reachable) {
        addLog('error', `❌ Webhook is not reachable`, data);
        if (data.steps) {
          addLog('info', '📋 Steps to fix:');
          data.steps.forEach((step: string) => {
            addLog('info', step);
          });
        }
        setResults((prev: any) => ({ ...prev, webhook: false }));
      } else {
        addLog('success', '✅ Voice webhook is reachable by Twilio', data.details);
        if (data.recommendations) {
          data.recommendations.forEach((rec: string) => {
            addLog('info', rec);
          });
        }
        setResults((prev: any) => ({ ...prev, webhook: true }));
      }
    } catch (err: any) {
      addLog('error', `❌ Webhook test failed: ${err.message}`, err);
      setResults((prev: any) => ({ ...prev, webhook: false }));
    }

    setTesting(false);
  };

  const fullDiagnostic = async () => {
    setLogs([]);
    addLog('info', '🚀 Starting Full System Diagnostic...');

    await testTokenEndpoint();
    await new Promise((r) => setTimeout(r, 1000));

    await testApiKeyPermissions();
    await new Promise((r) => setTimeout(r, 1000));

    await testWebhookReachability();
    await new Promise((r) => setTimeout(r, 1000));

    await testMicrophone();

    setTesting(false);
    addLog('info', '🏆 Diagnostic complete!');
  };

  const getStatusColor = (status?: boolean) => {
    if (status === undefined) return 'text-gray-500';
    return status ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (status?: boolean) => {
    if (status === undefined) return '⚫';
    return status ? '✅' : '❌';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">🔧 WebRTC Debug Center</h1>
        <p className="text-slate-300 mb-8">
          Comprehensive diagnostics for Twilio WebRTC calling setup
        </p>

        {/* Results Summary */}
        {results && (
          <div className="bg-slate-700 rounded-lg p-6 mb-8 border border-slate-600">
            <h2 className="text-xl font-semibold text-white mb-4">📊 Test Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded p-4">
                <p className="text-slate-400 text-sm mb-2">Token Endpoint</p>
                <p className={`text-2xl font-bold ${getStatusColor(results.token)}`}>
                  {getStatusIcon(results.token)}
                </p>
              </div>
              <div className="bg-slate-800 rounded p-4">
                <p className="text-slate-400 text-sm mb-2">API Key</p>
                <p className={`text-2xl font-bold ${getStatusColor(results.apiKey)}`}>
                  {getStatusIcon(results.apiKey)}
                </p>
              </div>
              <div className="bg-slate-800 rounded p-4">
                <p className="text-slate-400 text-sm mb-2">Webhook</p>
                <p className={`text-2xl font-bold ${getStatusColor(results.webhook)}`}>
                  {getStatusIcon(results.webhook)}
                </p>
              </div>
              <div className="bg-slate-800 rounded p-4">
                <p className="text-slate-400 text-sm mb-2">Microphone</p>
                <p className={`text-2xl font-bold ${getStatusColor(results.microphone)}`}>
                  {getStatusIcon(results.microphone)}
                </p>
              </div>
            </div>

            {results.token && results.apiKey && results.webhook && (
              <div className="mt-4 p-4 bg-green-900 border border-green-600 rounded">
                <p className="text-green-100 flex items-center gap-2">
                  <CheckCircle2 size={20} />
                  🎉 System ready for WebRTC calls!
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Token Test */}
          <button
            onClick={testTokenEndpoint}
            disabled={testing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Zap size={20} />
            🔗 Test Token
          </button>

          {/* API Key Test */}
          <button
            onClick={testApiKeyPermissions}
            disabled={testing}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <AlertCircle size={20} />
            🔐 Test API Key
          </button>

          {/* Webhook Test */}
          <button
            onClick={testWebhookReachability}
            disabled={testing}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <AlertTriangle size={20} />
            🌐 Test Webhook
          </button>
        </div>

        <div className="mb-8">
          <button
            onClick={fullDiagnostic}
            disabled={testing}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:bg-slate-600 text-white font-bold py-4 px-6 rounded-lg transition text-lg flex items-center justify-center gap-2"
          >
            <Send size={24} />
            🚀 Full System Diagnostic
          </button>
        </div>

        {/* Logs Display */}
        <div className="bg-slate-800 rounded-lg border border-slate-600 overflow-hidden">
          <div className="bg-slate-700 px-4 py-3 border-b border-slate-600">
            <h2 className="text-lg font-semibold text-white">📝 Debug Logs</h2>
          </div>

          <div className="h-96 overflow-y-auto font-mono text-sm p-4 bg-slate-900">
            {logs.length === 0 ? (
              <p className="text-slate-500">Logs will appear here...</p>
            ) : (
              logs.map((log, idx) => {
                const colorClass = {
                  info: 'text-slate-300',
                  success: 'text-green-400',
                  error: 'text-red-400',
                  warn: 'text-yellow-400',
                }[log.type];

                return (
                  <div key={idx} className={`${colorClass} mb-1`}>
                    <span className="text-slate-500">[{log.timestamp}]</span> {log.message}
                    {log.data && (
                      <div className="text-slate-400 ml-4 text-xs mt-1">
                        {typeof log.data === 'string'
                          ? log.data
                          : JSON.stringify(log.data, null, 2)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Troubleshooting Guide */}
        <div className="mt-8 bg-slate-700 rounded-lg p-6 border border-slate-600">
          <h2 className="text-xl font-semibold text-white mb-4">🆘 Troubleshooting Guide</h2>
          <div className="space-y-4 text-slate-200 text-sm">
            <div>
              <p className="font-semibold text-orange-400 mb-2">❌ Token Endpoint Failed</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Check .env file has TWILIO_ACCOUNT_SID</li>
                <li>Verify TWILIO_API_KEY_SID is set</li>
                <li>Verify TWILIO_API_KEY_SECRET is set</li>
                <li>Check TWIML_APP_SID is configured</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-orange-400 mb-2">❌ API Key Test Failed</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>API Key might not have Voice permissions</li>
                <li>Create new API Key at: twilio.com/console/account/keys</li>
                <li>Ensure it's not restricted to specific services</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-orange-400 mb-2">❌ Webhook Not Reachable</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Set NEXT_PUBLIC_APP_URL correctly (must be HTTPS)</li>
                <li>Verify TwiML App Voice URL is configured in Twilio</li>
                <li>Check firewall rules allow incoming Twilio webhooks</li>
                <li>Deploy app to Vercel or similar (not localhost)</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-orange-400 mb-2">❌ Microphone Permission Denied</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Check browser settings: Chrome → Settings → Privacy → Microphone</li>
                <li>Ensure site is using HTTPS</li>
                <li>Try in incognito mode</li>
                <li>Check if another app is using microphone</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
