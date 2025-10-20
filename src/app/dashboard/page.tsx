"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, CreditCard, History, Settings as SettingsIcon, LogOut, Plus } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  isAdmin: boolean;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      // Redirect to dialer as the main page
      router.push("/dashboard/dialer");
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
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

  if (!session || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header is already rendered by layout */}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-lg border border-gray-200">
          
          {/* Welcome Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Welcome back, <span className="text-blue-600">{user.name}</span>!
            </h1>
            <p className="text-lg text-gray-600">Ready to make your next international call?</p>
          </div>

          {/* Balance Card */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-500 p-3 rounded-full">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Account Balance</p>
                  <p className="text-3xl font-bold text-gray-900">${user.balance.toFixed(2)} USD</p>
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

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link
              href="/dashboard/dialer"
              className="bg-blue-50 rounded-2xl p-6 border border-blue-200 hover:border-blue-300 transition-all duration-300 group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-500 p-3 rounded-full group-hover:bg-blue-600 transition-colors">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Make a Call</h3>
                  <p className="text-gray-600">Start calling internationally</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/history"
              className="bg-blue-50 rounded-2xl p-6 border border-blue-200 hover:border-blue-300 transition-all duration-300 group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-500 p-3 rounded-full group-hover:bg-blue-600 transition-colors">
                  <History className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Call History</h3>
                  <p className="text-gray-600">View your call logs</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/settings"
              className="bg-blue-50 rounded-2xl p-6 border border-blue-200 hover:border-blue-300 transition-all duration-300 group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-500 p-3 rounded-full group-hover:bg-blue-600 transition-colors">
                  <SettingsIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Settings</h3>
                  <p className="text-gray-600">Manage your account</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Admin Panel Link */}
          {user.isAdmin && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8">
              <div className="flex items-center space-x-4">
                <div className="bg-orange-500 p-3 rounded-full">
                  <SettingsIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-orange-800">Admin Access</h3>
                  <p className="text-orange-600">You have administrative privileges</p>
                </div>
                <Link
                  href="/admin"
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Access Admin Panel
                </Link>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gray-400 p-2 rounded-full">
                <History className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Recent Activity</h3>
            </div>
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">📞</div>
              <p className="text-gray-600 mb-4">No recent calls yet</p>
              <p className="text-sm text-gray-500">Start making calls to see your activity here</p>
              <Link
                href="/dashboard/dialer"
                className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors mt-4"
              >
                <Phone className="h-4 w-4" />
                <span>Make Your First Call</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
