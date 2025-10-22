"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Settings as SettingsIcon, 
  User, 
  CreditCard, 
  ArrowLeft, 
  Phone,
  Shield,
  Gift,
  Eye,
  Lock,
  LogOut,
  Plus,
  CheckCircle,
  X,
  Edit3,
  Wallet,
  Bell,
  ChevronRight,
  Key
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import AutoTopupComponent from "@/components/AutoTopupComponent";
import CallerIDComponent from "@/components/CallerIDComponent";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Modern Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-white/80 rounded-xl transition-colors shadow-sm"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                    <SettingsIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-sm text-gray-600">Manage your account and preferences</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Cards */}
        <div className="space-y-6">
          
          {/* Profile Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
                    <p className="text-gray-600 text-sm">Manage your account information</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-white/50 transition-colors">
                  <Edit3 className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 text-gray-900 font-medium">{profile?.email}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Member since</label>
                  <div className="mt-1 text-gray-900 font-medium">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button 
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-white/60 transition-colors"
                >
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">Change Password</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-white/60 transition-colors">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">Billing Portal</span>
                </button>
                <button 
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50/80 transition-colors ml-auto"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
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
          </div>

          {/* Balance Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Balance</h2>
                    <p className="text-gray-600 text-sm">Manage your account balance</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl mb-4 border border-green-100">
                <div>
                  <p className="text-sm text-green-600 font-medium">Current Balance</p>
                  <p className="text-3xl font-bold text-gray-900">${profile?.balance?.toFixed(2) || "0.00"}</p>
                </div>
                <Link
                  href="/dashboard/add-credits"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Credits</span>
                </Link>
              </div>
                

            </div>
          </div>

          {/* Auto Top-up Settings */}
          <AutoTopupComponent />

          {/* Caller ID Settings */}
          <CallerIDComponent />

          {/* Additional Settings */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Phone Numbers Card */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Phone Numbers</h2>
                      <p className="text-gray-600 text-sm">Manage your phone numbers</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/buy-number"
                    className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-white/50 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </Link>
                </div>
                
                {availableNumbers.filter(num => num.type === 'premium').length > 0 ? (
                  <div className="space-y-3">
                    {availableNumbers.filter(num => num.type === 'premium').slice(0, 3).map((number) => (
                      <div key={number.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{number.phoneNumber}</div>
                          <div className="text-sm text-gray-600">{number.country}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">${number.monthlyFee}/mo</div>
                          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            number.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                          }`}>
                            {number.isActive ? "Active" : "Inactive"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No phone numbers</p>
                    <Link
                      href="/dashboard/buy-number"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Buy Number</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Promo Codes Card */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Gift className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Promo Codes</h2>
                      <p className="text-gray-600 text-sm">Active discount codes</p>
                    </div>
                  </div>
                </div>
                {promoCodes.length > 0 ? (
                  <div className="space-y-3">
                    {promoCodes.slice(0, 3).map((promo) => (
                      <div key={promo.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                        <div>
                          <div className="font-bold text-purple-800">{promo.code}</div>
                          <div className="text-sm text-purple-600">{promo.discount}% discount</div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          promo.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {promo.isActive ? "Active" : "Used"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Gift className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No promo codes</p>
                    <Link
                      href="/earn-credits"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center space-x-2 transition-colors"
                    >
                      <Gift className="h-4 w-4" />
                      <span>Earn Credits</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-xl border ${
              message.includes("successfully") 
                ? "bg-green-50 text-green-700 border-green-200" 
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              <div className="flex items-center space-x-2">
                {message.includes("successfully") ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
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
