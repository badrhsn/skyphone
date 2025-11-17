// @ts-nocheck
"use client";

import { useState, useRef } from "react";
import twilioDebug from "@/lib/twilioDebug";

export default function TwilioTestPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string) => {
    setTestLogs((prev) => [...prev, message]);
    if (logsRef.current) {
      setTimeout(() => {
        logsRef.current!.scrollTop = logsRef.current!.scrollHeight;
      }, 100);
    }
  };

  // Intercept console methods to capture logs
  const startCapture = () => {
    setTestLogs([]);
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      addLog(`ℹ️ ${args.join(" ")}`);
      originalLog(...args);
    };

    console.error = (...args) => {
      addLog(`❌ ${args.join(" ")}`);
      originalError(...args);
    };

    console.warn = (...args) => {
      addLog(`⚠️ ${args.join(" ")}`);
      originalWarn(...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  };

  const runFullDiagnostic = async () => {
    setLoading(true);
    setResults(null);
    const restore = startCapture();

    try {
      addLog("🚀 Starting Twilio WebRTC Diagnostic...");
      const result = await twilioDebug.fullDiagnostic();
      setResults(result);
      addLog("✅ Diagnostic complete!");
    } catch (err: any) {
      addLog(`❌ Diagnostic failed: ${err.message}`);
    } finally {
      restore();
      setLoading(false);
    }
  };

  const testTokenEndpoint = async () => {
    setLoading(true);
    const restore = startCapture();

    try {
      addLog("🔗 Testing /api/twilio/token...");
      const data = await twilioDebug.testTokenEndpoint();
      if (data) {
        addLog(`✅ Token received: ${data.token.substring(0, 50)}...`);
        addLog(`✅ Identity: ${data.identity}`);
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    } finally {
      restore();
      setLoading(false);
    }
  };

  const testMicrophone = async () => {
    setLoading(true);
    const restore = startCapture();

    try {
      addLog("🎤 Requesting microphone access...");
      const success = await twilioDebug.testMicrophone();
      if (success) {
        addLog("✅ Microphone access granted");
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    } finally {
      restore();
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Twilio WebRTC Test Suite
          </h1>
          <p className="text-gray-600 mb-6">
            Test token endpoint, microphone access, and Twilio Device
            initialization
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={runFullDiagnostic}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              {loading ? "Running..." : "🚀 Full Diagnostic"}
            </button>

            <button
              onClick={testTokenEndpoint}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              {loading ? "Testing..." : "🔗 Test Token"}
            </button>

            <button
              onClick={testMicrophone}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              {loading ? "Testing..." : "🎤 Test Mic"}
            </button>
          </div>

          {results && (
            <div className="bg-gray-50 border-l-4 border-blue-500 p-6 mb-6">
              <h3 className="font-bold text-lg mb-4">Diagnostic Results</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Token:</span>{" "}
                  {results.token ? "✅ OK" : "❌ FAILED"}
                </p>
                <p>
                  <span className="font-semibold">Microphone:</span>{" "}
                  {results.microphone ? "✅ OK" : "❌ FAILED"}
                </p>
                <p>
                  <span className="font-semibold">Device:</span>{" "}
                  {results.device ? "✅ OK" : "❌ FAILED"}
                </p>
                <p className="mt-4 pt-4 border-t">
                  <span className="font-semibold">Overall:</span>{" "}
                  {results.allPassed ? (
                    <span className="text-green-600">✅ READY FOR CALLS</span>
                  ) : (
                    <span className="text-red-600">
                      ❌ ISSUES DETECTED - See logs below
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Diagnostic Logs
          </h2>
          <div
            ref={logsRef}
            className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded h-96 overflow-y-auto border border-gray-700"
          >
            {testLogs.length === 0 ? (
              <p className="text-gray-500">Logs will appear here...</p>
            ) : (
              testLogs.map((log, idx) => (
                <div key={idx} className="py-1">
                  {log}
                </div>
              ))
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
            <p className="font-semibold mb-2">📋 What each test does:</p>
            <ul className="space-y-2 ml-4">
              <li>
                <span className="font-semibold">Full Diagnostic:</span> Runs all
                tests (token, mic, device)
              </li>
              <li>
                <span className="font-semibold">Test Token:</span> Fetches JWT
                from /api/twilio/token
              </li>
              <li>
                <span className="font-semibold">Test Mic:</span> Requests
                getUserMedia permission
              </li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded text-sm text-gray-700">
            <p className="font-semibold mb-2">✅ Success indicators:</p>
            <ul className="space-y-1 ml-4">
              <li>✅ Token test returns valid JWT</li>
              <li>🎤 Browser prompts for microphone access</li>
              <li>✅ Device initializes without errors</li>
              <li>
                If all pass → you can make test calls in the{" "}
                <strong>/dashboard/dialer</strong>
              </li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded text-sm text-gray-700">
            <p className="font-semibold mb-2">❌ Troubleshooting:</p>
            <ul className="space-y-1 ml-4">
              <li>
                <strong>Token test fails:</strong> Check env vars in Vercel
              </li>
              <li>
                <strong>Mic denied:</strong> Check browser permissions or use
                HTTPS
              </li>
              <li>
                <strong>Device fails:</strong> Check browser console for SDK
                errors
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
