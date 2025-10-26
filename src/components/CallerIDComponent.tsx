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

  const [editingFriendlyId, setEditingFriendlyId] = useState<string | null>(null);
  const [friendlyDraft, setFriendlyDraft] = useState<string>("");
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl p-4 border border-gray-100 ${className}`}>
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#e6fbff] rounded-xl flex items-center justify-center">
              <Phone className="h-5 w-5 text-[#00aff0]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Caller IDs</h2>
              <p className="text-sm text-gray-600">Import your own phone numbers</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-[#00aff0] hover:text-[#008fcf] p-2 rounded-lg hover:bg-[#f3fbff] transition-colors"
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
            <div className="mb-6 p-4 bg-[#f3fbff] rounded-xl border border-[#e6fbff]">
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0] focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              
              <div className="bg-[#f3fbff] border border-[#e6fbff] rounded-lg p-3">
                <p className="text-sm text-[#0b7fb4]">
                  <strong>Note:</strong> Custom caller ID rates may differ from our public numbers. 
                  Always check the dialer for current pricing before making calls.
                </p>
              </div>
              
              <div className="flex space-x-3 flex-wrap">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white px-4 py-2 rounded-2xl font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-2xl font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Verification Form */}
        {verifyingNumber && (
            <div className="mb-6 p-4 bg-white rounded-xl border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Verification Required</h3>
            <p className="text-sm text-gray-700 mb-4">
              We've called your number. Please enter the 6-digit verification code you heard.
            </p>
            
            <div className="flex space-x-3">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0] focus:border-transparent transition-all duration-200"
              />
              <button
                onClick={() => handleVerifyCode(verifyingNumber)}
                disabled={submitting}
                className="bg-gradient-to-r from-[#00aff0] to-[#0099d6] hover:from-[#0099d6] hover:to-[#0086c2] text-white px-4 py-2 rounded-2xl font-medium transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
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
          <div className="grid gap-3 sm:grid-cols-2">
            {callerIDs.map((callerID) => (
              <div key={callerID.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="flex items-start sm:items-center space-x-3 w-full sm:w-auto">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
                        callerID.status === 'VERIFIED' ? 'bg-green-100' : 
                        callerID.status === 'FAILED' || callerID.status === 'EXPIRED' ? 'bg-red-100' : 'bg-yellow-100'
                      }`}>
                        {callerID.status === 'VERIFIED' ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : callerID.status === 'FAILED' || callerID.status === 'EXPIRED' ? (
                          <X className="h-5 w-5 text-red-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium text-gray-900 truncate">{formatPhoneNumber(callerID.phoneNumber)}</div>
                      <div className={`text-xs font-medium px-2 py-1 rounded-md ${
                        callerID.status === 'VERIFIED' ? 'bg-green-50 text-green-700' : 
                        callerID.status === 'FAILED' || callerID.status === 'EXPIRED' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>{callerID.status === 'VERIFIED' ? 'Verified' : callerID.status === 'FAILED' ? 'Failed' : callerID.status === 'EXPIRED' ? 'Expired' : 'Pending'}</div>
                    </div>
                    <div className="text-sm text-gray-600 truncate">{callerID.friendlyName || 'No label'}</div>
                    <div className="text-xs text-gray-500">Added {new Date(callerID.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="mt-3 sm:mt-0 flex items-center space-x-2">
                  {callerID.status === 'PENDING' && (
                    <button
                      onClick={() => setVerifyingNumber(callerID.id)}
                      disabled={!!processingIds[callerID.id]}
                      className="text-[#00aff0] hover:text-[#008fcf] px-3 py-1 rounded-full hover:bg-[#f3fbff] transition-colors text-sm font-medium"
                    >
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingFriendlyId(callerID.id);
                      setFriendlyDraft(callerID.friendlyName || '');
                    }}
                    className="bg-white border border-gray-200 px-3 py-1 rounded-full text-sm font-medium hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCallerID(callerID.id)}
                    disabled={!!processingIds[callerID.id]}
                    className="text-red-600 hover:text-red-700 px-3 py-1 rounded-full hover:bg-red-50 transition-colors text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>

                {editingFriendlyId === callerID.id && (
                  <div className="w-full mt-3 sm:mt-2">
                    <div className="flex items-center space-x-2">
                      <input
                        value={friendlyDraft}
                        onChange={(e) => setFriendlyDraft(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
                      />
                      <button
                        onClick={async () => {
                          try {
                            setProcessingIds(prev => ({ ...prev, [callerID.id]: true }));
                            const res = await fetch(`/api/user/caller-ids/${callerID.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ friendlyName: friendlyDraft }),
                            });
                            if (res.ok) {
                              await fetchCallerIDs();
                              setEditingFriendlyId(null);
                              setMessage({ type: 'success', text: 'Label updated' });
                            } else {
                              setMessage({ type: 'error', text: 'Failed to update label' });
                            }
                          } catch (err) {
                            console.error(err);
                            setMessage({ type: 'error', text: 'Failed to update label' });
                          } finally {
                            setProcessingIds(prev => ({ ...prev, [callerID.id]: false }));
                          }
                        }}
                        className="bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white px-3 py-1 rounded-2xl text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingFriendlyId(null)}
                        className="bg-gray-50 text-gray-700 px-3 py-1 rounded-2xl text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Phone className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No caller IDs added yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-[#00aff0] to-[#0099d6] hover:from-[#0099d6] hover:to-[#0086c2] text-white px-4 py-2 rounded-2xl font-medium inline-flex items-center space-x-2 transition-colors"
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