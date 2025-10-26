"use client";

import { useState, useEffect } from "react";
import { Shield, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";

interface AutoTopupSettings {
  autoTopupEnabled: boolean;
  autoTopupThreshold: number;
  autoTopupAmount: number;
}

interface AutoTopupComponentProps {
  className?: string;
}

export default function AutoTopupComponent({ className = "" }: AutoTopupComponentProps) {
  const [settings, setSettings] = useState<AutoTopupSettings>({
    autoTopupEnabled: false,
    autoTopupThreshold: 2.0,
    autoTopupAmount: 10.0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user/auto-topup');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        console.error('Failed to fetch auto top-up settings');
      }
    } catch (error) {
      console.error('Error fetching auto top-up settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/auto-topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setMessage({ type: 'success', text: 'Auto top-up settings saved successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving auto top-up settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, autoTopupEnabled: enabled }));
  };

  const handleThresholdChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setSettings(prev => ({ ...prev, autoTopupThreshold: numValue }));
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setSettings(prev => ({ ...prev, autoTopupAmount: numValue }));
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl p-4 border border-gray-100 ${className}`}>
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl p-4 border border-gray-100 ${className}`}>
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-9 h-9 bg-[#e6fbff] rounded-lg flex items-center justify-center">
          <Shield className="h-4 w-4 text-[#00aff0]" />
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-900">Auto Top-up</h4>
          <p className="text-sm text-gray-600">Automatically add credits when balance is low</p>
        </div>
      </div>

      {message && (
        <div className={`mb-3 p-2 rounded-md flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900">Enable Auto Top-up</label>
            <p className="text-xs text-gray-600">Avoid interrupting an important call</p>
          </div>
          <button
            onClick={() => handleToggle(!settings.autoTopupEnabled)}
            className={`${
              settings.autoTopupEnabled ? 'bg-[#00aff0]' : 'bg-gray-200'
            } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00aff0]`}
          >
            <span
              className={`${
                settings.autoTopupEnabled ? 'translate-x-4' : 'translate-x-1'
              } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
            />
          </button>
        </div>

        {settings.autoTopupEnabled && (
          <>
            {/* Threshold Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auto Top-up Threshold
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.50"
                  value={settings.autoTopupThreshold}
                  onChange={(e) => handleThresholdChange(e.target.value)}
                  className="block w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0] focus:border-transparent transition-all duration-150"
                  placeholder="2.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Trigger when balance ≤ this amount</p>
            </div>

            {/* Amount Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auto Top-up Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="5"
                  max="500"
                  step="1"
                  value={settings.autoTopupAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="block w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0] focus:border-transparent transition-all duration-150"
                  placeholder="10.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Amount added when auto top-up triggers</p>
            </div>

            {/* Preview */}
            <div className="bg-[#f3fbff] border border-[#e6fbff] rounded-lg p-3">
              <h4 className="text-sm font-medium text-[#0b7fb4] mb-1">How it works:</h4>
              <ul className="text-sm text-[#0b7fb4] space-y-1">
                <li>• When your balance drops below ${settings.autoTopupThreshold.toFixed(2)}</li>
                <li>• We'll automatically add ${settings.autoTopupAmount.toFixed(2)} to your account</li>
                <li>• Your calls won't be interrupted due to insufficient funds</li>
                <li>• You'll receive an email notification for each auto top-up</li>
              </ul>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="pt-2 border-t border-gray-100">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white px-4 py-2 rounded-2xl font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Auto Top-up Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}