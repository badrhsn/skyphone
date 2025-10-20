"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Settings as SettingsIcon, 
  User, 
  CreditCard, 
  ArrowLeft, 
  Save, 
  Phone,
  Key,
  Gift,
  Eye,
  Lock,
  LogOut,
  Plus,
  CheckCircle,
  X
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  balance: number;
  createdAt: string;
}

interface PromoCode {
  id: string;
  code: string;
  discount: number;
  isActive: boolean;
}

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [autoTopUp, setAutoTopUp] = useState(false);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchProfile();
      fetchPromoCodes();
      fetchAvailableNumbers();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPromoCodes = async () => {
    try {
      const response = await fetch("/api/user/promo-codes");
      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data);
      }
    } catch (error) {
      console.error("Error fetching promo codes:", error);
    }
  };

  const fetchAvailableNumbers = async () => {
    try {
      const response = await fetch("/api/user/phone-numbers");
      if (response.ok) {
        const numbers = await response.json();
        setAvailableNumbers(numbers);
      }
    } catch (error) {
      console.error("Error fetching available numbers:", error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile?.name,
          autoTopUp,
        }),
      });

      if (response.ok) {
        setMessage("Settings updated successfully!");
      } else {
        setMessage("Failed to update settings");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword,
        }),
      });

      if (response.ok) {
        setMessage("Password changed successfully!");
        setNewPassword("");
        setConfirmPassword("");
        setShowChangePassword(false);
      } else {
        setMessage("Failed to change password");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header is already rendered by layout */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-lg border border-gray-200">
          
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <SettingsIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Account Settings</h1>
                <p className="text-gray-600">Manage your account preferences and settings</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-blue-600 flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Left Column */}
            <div className="space-y-6">
              
              {/* Account Information */}
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-blue-500 p-2 rounded-full">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Account Information</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Email:</span>
                        <span className="text-gray-900">{profile?.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Member since:</span>
                        <span className="text-gray-900">
                          {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <button className="text-blue-600 hover:text-blue-700 flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors">
                      <Eye className="h-4 w-4" />
                      <span>View billing portal</span>
                    </button>
                    <button 
                      onClick={() => setShowChangePassword(!showChangePassword)}
                      className="text-purple-600 hover:text-purple-700 flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors"
                    >
                      <Lock className="h-4 w-4" />
                      <span>Change password</span>
                    </button>
                    <button 
                      onClick={handleSignOut}
                      className="text-red-600 hover:text-red-700 flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-red-200 hover:border-red-300 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>

                {/* Change Password Form */}
                {showChangePassword && (
                  <form onSubmit={handleChangePassword} className="mt-6 p-6 bg-white rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
                        >
                          {isSaving ? "Saving..." : "Update Password"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowChangePassword(false)}
                          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Balance */}
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-blue-500 p-2 rounded-full">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Balance</h2>
                </div>
                
                <div className="bg-white rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Current Balance</p>
                        <p className="text-3xl font-bold text-gray-900">${profile?.balance?.toFixed(2) || "0.00"}</p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard/add-credits"
                      className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Credits</span>
                    </Link>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="autoTopUp"
                      checked={autoTopUp}
                      onChange={(e) => setAutoTopUp(e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <label htmlFor="autoTopUp" className="text-sm font-medium text-gray-900">
                        Auto top-up when low
                      </label>
                      <p className="text-xs text-gray-600">Never interrupt an important call</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="mt-4 w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Promo Codes */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Gift className="h-5 w-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Promo Codes</h2>
                </div>
                {promoCodes.length > 0 ? (
                  <div className="space-y-3">
                    {promoCodes.map((promo) => (
                      <div key={promo.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-purple-800 text-lg">{promo.code}</div>
                            <div className="text-sm text-purple-600">{promo.discount}% discount</div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            promo.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {promo.isActive ? "Active" : "Used"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <div className="text-4xl mb-3">🎁</div>
                    <p className="text-gray-600 mb-2">You don't have any active promo codes at the moment.</p>
                    <p className="text-sm text-gray-500">Complete feedback surveys to earn discount codes!</p>
                    <Link
                      href="/earn-credits"
                      className="inline-flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors mt-3"
                    >
                      <Gift className="h-4 w-4" />
                      <span>Earn Credits</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Phone Numbers */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Phone Numbers</h2>
                </div>
                {availableNumbers.filter(num => num.type === 'premium').length > 0 ? (
                  <div className="space-y-3">
                    {availableNumbers.filter(num => num.type === 'premium').map((number) => (
                      <div key={number.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-blue-800 text-lg">{number.phoneNumber}</div>
                            <div className="text-sm text-blue-600">{number.country}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-blue-800">${number.monthlyFee}/month</div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              number.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                            }`}>
                              {number.isActive ? "Active" : "Inactive"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <div className="text-4xl mb-3">📱</div>
                    <p className="text-gray-600 mb-4">No phone numbers found</p>
                    <Link
                      href="/dashboard/buy-number"
                      className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 flex items-center space-x-2 mx-auto transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Buy a new phone number</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Caller IDs */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Key className="h-5 w-5 text-orange-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Caller IDs</h2>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3">🆔</div>
                  <p className="text-gray-600 mb-4">No caller IDs found</p>
                  <button className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 flex items-center space-x-2 mx-auto transition-colors">
                    <Plus className="h-4 w-4" />
                    <span>Add a new caller ID</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mt-8 p-4 rounded-xl border ${
              message.includes("successfully") 
                ? "bg-blue-50 text-blue-700 border-blue-200" 
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              <div className="flex items-center space-x-2">
                {message.includes("successfully") ? (
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                ) : (
                  <X className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">{message}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
