"use client";

import { useState, useEffect } from "react";
import { Phone, Plus, Check, X, AlertCircle, Loader2 } from "lucide-react";
import { useModal } from "./Modal";

interface CallerID {
  id: string;
  phoneNumber: string;
  status: 'PENDING' | 'VERIFYING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
  friendlyName?: string;
  verifiedAt?: string;
  isActive: boolean;
  createdAt: string;
}

interface CallerIDComponentProps {
  className?: string;
}

export default function CallerIDComponent({ className = "" }: CallerIDComponentProps) {
  const [callerIDs, setCallerIDs] = useState<CallerID[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyingNumber, setVerifyingNumber] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { showConfirm, ModalComponent } = useModal();

  useEffect(() => {
    fetchCallerIDs();
  }, []);

  const fetchCallerIDs = async () => {
    try {
      const response = await fetch('/api/user/caller-ids');
      if (response.ok) {
        const data = await response.json();
        setCallerIDs(data.callerIds || []);
      } else {
        console.error('Failed to fetch caller IDs');
      }
    } catch (error) {
      console.error('Error fetching caller IDs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return number;
  };

  const validatePhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const handleAddCallerID = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhoneNumber(newNumber)) {
      setMessage({ type: 'error', text: 'Please enter a valid phone number' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/caller-ids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: newNumber }),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchCallerIDs(); // Refresh the list
        setVerifyingNumber(data.callerId.id);
        setMessage({ type: 'success', text: 'Verification code sent! Please check your phone and enter the code.' });
        setNewNumber("");
        setShowAddForm(false);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to add caller ID' });
      }
    } catch (error) {
      console.error('Error adding caller ID:', error);
      setMessage({ type: 'error', text: 'Failed to add caller ID' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async (callerIdId: string) => {
    if (!verificationCode || verificationCode.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter the 6-digit verification code' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/caller-ids/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          callerIdId,
          verificationCode 
        }),
      });

      if (response.ok) {
        await fetchCallerIDs(); // Refresh the list
        setVerifyingNumber(null);
        setVerificationCode("");
        setMessage({ type: 'success', text: 'Caller ID verified successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Verification failed' });
      }
    } catch (error) {
      console.error('Error verifying caller ID:', error);
      setMessage({ type: 'error', text: 'Verification failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCallerID = async (callerIdId: string) => {
    showConfirm(
      "Remove Caller ID",
      "Are you sure you want to remove this caller ID?",
      () => {
        deleteCallerID(callerIdId);
      },
      "Remove",
      "Cancel"
    );
  };

  const deleteCallerID = async (callerIdId: string) => {
    try {
      const response = await fetch(`/api/user/caller-ids/${callerIdId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCallerIDs(); // Refresh the list
        setMessage({ type: 'success', text: 'Caller ID removed successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to remove caller ID' });
      }
    } catch (error) {
      console.error('Error deleting caller ID:', error);
      setMessage({ type: 'error', text: 'Failed to remove caller ID' });
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Phone className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Caller IDs</h2>
              <p className="text-gray-600 text-sm">Import your own phone numbers</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-orange-600 hover:text-orange-700 p-2 rounded-lg hover:bg-orange-50 transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <Check className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Add Caller ID Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Add Caller ID</h3>
            <p className="text-sm text-gray-600 mb-4">
              Import a phone number you already own to use as your caller ID. You'll need to verify ownership.
            </p>
            
            <form onSubmit={handleAddCallerID} className="space-y-4">
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter number to verify (e.g. +12125551234)
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  placeholder="+12125551234"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Custom caller ID rates may differ from our public numbers. 
                  Always check the dialer for current pricing before making calls.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4" />
                      <span>Send Verification Call</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewNumber("");
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Verification Form */}
        {verifyingNumber && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">Verification Required</h3>
            <p className="text-sm text-yellow-800 mb-4">
              We've called your number. Please enter the 6-digit verification code you heard.
            </p>
            
            <div className="flex space-x-3">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="flex-1 px-4 py-3 border border-yellow-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
              />
              <button
                onClick={() => handleVerifyCode(verifyingNumber)}
                disabled={submitting}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>Verify</span>
              </button>
            </div>
          </div>
        )}

        {/* Caller IDs List */}
        {callerIDs.length > 0 ? (
          <div className="space-y-3">
            {callerIDs.map((callerID) => (
              <div key={callerID.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    callerID.status === 'VERIFIED' ? 'bg-green-100' : 
                    callerID.status === 'FAILED' || callerID.status === 'EXPIRED' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {callerID.status === 'VERIFIED' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : callerID.status === 'FAILED' || callerID.status === 'EXPIRED' ? (
                      <X className="h-4 w-4 text-red-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {formatPhoneNumber(callerID.phoneNumber)}
                    </div>
                    <div className={`text-xs font-medium ${
                      callerID.status === 'VERIFIED' ? 'text-green-600' : 
                      callerID.status === 'FAILED' || callerID.status === 'EXPIRED' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {callerID.status === 'VERIFIED' ? 'Verified' : 
                       callerID.status === 'FAILED' ? 'Verification Failed' :
                       callerID.status === 'EXPIRED' ? 'Code Expired' : 'Pending Verification'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {callerID.status === 'PENDING' && (
                    <button
                      onClick={() => setVerifyingNumber(callerID.id)}
                      className="text-yellow-600 hover:text-yellow-700 px-3 py-1 rounded-lg hover:bg-yellow-50 transition-colors text-sm font-medium"
                    >
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteCallerID(callerID.id)}
                    className="text-red-600 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Phone className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No caller IDs added yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Caller ID</span>
            </button>
          </div>
        )}
      </div>
      
      {ModalComponent}
    </div>
  );
}