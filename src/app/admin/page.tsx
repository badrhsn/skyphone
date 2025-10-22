"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings as SettingsIcon, Users, DollarSign, Phone, Plus, Edit, Trash2, ArrowLeft, CreditCard, Activity, Zap, Database } from "lucide-react";
import Link from "next/link";
import AdminNavigation from "@/components/AdminNavigation";
import { useModal } from "@/components/Modal";

// Configurations Tab Component
function ConfigurationsTab() {
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigStatus();
  }, []);

  const fetchConfigStatus = async () => {
    try {
      const response = await fetch('/api/admin/configurations/status');
      if (response.ok) {
        const data = await response.json();
        setConfigStatus(data);
      }
    } catch (error) {
      console.error('Error fetching config status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure':
        return <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>;
      case 'env':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>;
      default:
        return <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'secure':
        return <span className="text-sm text-green-600">Secure (Database)</span>;
      case 'env':
        return <span className="text-sm text-yellow-600">Environment Variables</span>;
      default:
        return <span className="text-sm text-red-600">Not Configured</span>;
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'TWILIO':
        return <Zap className="h-4 w-4 text-purple-600" />;
      case 'STRIPE':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'GOOGLE_OAUTH':
        return <Users className="h-4 w-4 text-red-600" />;
      case 'TELNYX':
        return <Phone className="h-4 w-4 text-green-600" />;
      case 'VONAGE':
        return <Activity className="h-4 w-4 text-orange-600" />;
      default:
        return <SettingsIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getProviderDescription = (provider: string) => {
    switch (provider) {
      case 'TWILIO':
        return 'Voice calling and SMS services';
      case 'STRIPE':
        return 'Payment processing';
      case 'GOOGLE_OAUTH':
        return 'User authentication';
      case 'TELNYX':
        return 'Cloud communications platform';
      case 'VONAGE':
        return 'Voice and messaging APIs';
      default:
        return 'API configuration';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">API Configurations</h3>
          {configStatus && (
            <p className="text-sm text-gray-600 mt-1">
              {configStatus.summary.secure}/{configStatus.summary.total} using secure storage
            </p>
          )}
        </div>
        <Link
          href="/admin/configurations"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <SettingsIcon className="h-4 w-4 mr-2" />
          Manage Configurations
        </Link>
      </div>
      
      {configStatus && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {configStatus.status.map((config: any) => (
              <div key={config.provider} className="border rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    {getProviderIcon(config.provider)}
                  </div>
                  <h4 className="ml-3 text-lg font-medium text-gray-900">
                    {config.provider.replace('_', ' ')}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {getProviderDescription(config.provider)}
                </p>
                <div className="flex items-center">
                  {getStatusIcon(config.status)}
                  {getStatusText(config.status)}
                </div>
              </div>
            ))}
          </div>

          {configStatus.summary.environment > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Migration Recommended
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      {configStatus.summary.environment} configuration(s) are using environment variables. 
                      For enhanced security, migrate to encrypted database storage.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface CallRate {
  id: string;
  country: string;
  countryCode: string;
  rate: number;
  currency: string;
  isActive: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalRevenue: number;
  totalCalls: number;
  activeUsers: number;
}

interface CallRecord {
  id: string;
  userId: string;
  user: { name: string; email: string };
  fromNumber: string;
  toNumber: string;
  country: string;
  duration: number;
  cost: number;
  status: string;
  createdAt: string;
  endedAt?: string;
}

interface PaymentRecord {
  id: string;
  userId: string;
  user: { name: string; email: string };
  amount: number;
  currency: string;
  status: string;
  stripePaymentId?: string;
  createdAt: string;
}

interface ProviderStatus {
  id: string;
  provider: string;
  isActive: boolean;
  successRate: number;
  avgResponseTime: number;
  lastChecked: string;
}

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rates, setRates] = useState<CallRate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const { showConfirm, showSuccess, ModalComponent } = useModal();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      // Check both isAdmin field and admin email for debugging
      const isAdmin = session?.user?.isAdmin || session?.user?.email === 'admin@yadaphone.com';
      
      if (!isAdmin) {
        router.push("/dashboard");
      } else {
        fetchData();
      }
    }
  }, [status, session, router]);

  const fetchData = async () => {
    try {
      const [ratesRes, usersRes, statsRes, callsRes, paymentsRes, providersRes] = await Promise.all([
        fetch("/api/admin/rates"),
        fetch("/api/admin/users"),
        fetch("/api/admin/stats"),
        fetch("/api/admin/calls"),
        fetch("/api/admin/payments"),
        fetch("/api/admin/providers"),
      ]);

      if (ratesRes.ok) {
        const ratesData = await ratesRes.json();
        setRates(ratesData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (callsRes.ok) {
        const callsData = await callsRes.json();
        setCalls(callsData);
      }

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      }

      if (providersRes.ok) {
        const providersData = await providersRes.json();
        setProviders(providersData);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateToggle = async (rateId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/admin/rates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rateId, isActive }),
      });

      if (response.ok) {
        setRates(rates.map(rate => 
          rate.id === rateId ? { ...rate, isActive } : rate
        ));
      }
    } catch (error) {
      console.error("Error updating rate:", error);
    }
  };

  const handleAddCredits = async (userId: string, amount: number) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "addCredits", amount }),
      });

      if (response.ok) {
        // Refresh user data
        fetchData();
        setShowUserModal(false);
        setCreditAmount('');
      }
    } catch (error) {
      console.error("Error adding credits:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    showConfirm(
      "Delete User",
      "Are you sure you want to delete this user?",
      () => {
        deleteUser(userId);
      },
      "Delete",
      "Cancel"
    );
  };

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleRefundCall = async (callId: string) => {
    showConfirm(
      "Refund Call",
      "Are you sure you want to refund this call?",
      () => {
        refundCall(callId);
      },
      "Refund",
      "Cancel"
    );
  };

  const refundCall = async (callId: string) => {
    try {
      const response = await fetch("/api/admin/calls", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId, action: "refund" }),
      });

      if (response.ok) {
        // Refresh data
        fetchData();
        showSuccess("Success", "Call refunded successfully!");
      }
    } catch (error) {
      console.error("Error refunding call:", error);
    }
  };

  const handleRefundPayment = async (paymentId: string) => {
    showConfirm(
      "Refund Payment",
      "Are you sure you want to refund this payment?",
      () => {
        refundPayment(paymentId);
      },
      "Refund",
      "Cancel"
    );
  };

  const refundPayment = async (paymentId: string) => {
    try {
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action: "refund" }),
      });

      if (response.ok) {
        // Refresh data
        fetchData();
        showSuccess("Success", "Payment refunded successfully!");
      }
    } catch (error) {
      console.error("Error refunding payment:", error);
    }
  };

  const handleToggleProvider = async (providerId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/admin/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, action: "toggle", isActive }),
      });

      if (response.ok) {
        setProviders(providers.map(provider => 
          provider.id === providerId ? { ...provider, isActive } : provider
        ));
      }
    } catch (error) {
      console.error("Error toggling provider:", error);
    }
  };

  const handleTestProvider = async (providerId: string) => {
    try {
      const response = await fetch("/api/admin/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, action: "test" }),
      });

      if (response.ok) {
        showSuccess("Success", "Provider tested successfully!");
        fetchData(); // Refresh to get updated lastChecked time
      }
    } catch (error) {
      console.error("Error testing provider:", error);
    }
  };

  const exportCallsToCSV = () => {
    const headers = ['User', 'Email', 'From', 'To', 'Country', 'Duration', 'Cost', 'Status', 'Date'];
    const csvData = calls.map(call => [
      call.user.name,
      call.user.email,
      call.fromNumber,
      call.toNumber,
      call.country,
      `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}`,
      call.cost.toFixed(3),
      call.status,
      new Date(call.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calls_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPaymentsToCSV = () => {
    const headers = ['User', 'Email', 'Amount', 'Currency', 'Status', 'Stripe ID', 'Date'];
    const csvData = payments.map(payment => [
      payment.user.name,
      payment.user.email,
      payment.amount.toFixed(2),
      payment.currency,
      payment.status,
      payment.stripePaymentId || '',
      new Date(payment.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRefreshProviders = async () => {
    try {
      const response = await fetch("/api/admin/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh" }),
      });

      if (response.ok) {
        fetchData(); // Refresh to get updated provider statuses
        showSuccess("Success", "Provider statuses refreshed!");
      }
    } catch (error) {
      console.error("Error refreshing providers:", error);
    }
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

  // Check both isAdmin field and admin email for debugging
  const isAdmin = session?.user?.isAdmin || session?.user?.email === 'admin@yadaphone.com';
  
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "overview", name: "Overview", icon: DollarSign },
                { id: "users", name: "Users", icon: Users },
                { id: "calls", name: "Calls", icon: Phone },
                { id: "payments", name: "Payments", icon: CreditCard },
                { id: "rates", name: "Rates", icon: Database },
                { id: "providers", name: "Providers", icon: Activity },
                { id: "configurations", name: "Configurations", icon: SettingsIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Users
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.totalUsers}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Revenue
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          ${stats.totalRevenue.toFixed(2)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Phone className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Calls
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.totalCalls}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Users
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.activeUsers}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rates Tab */}
          {activeTab === "rates" && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Call Rates</h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Rate
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Country
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rates.map((rate) => (
                        <tr key={rate.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {rate.country}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {rate.countryCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${rate.rate.toFixed(4)}/min
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              rate.isActive 
                                ? "bg-blue-100 text-blue-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {rate.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRateToggle(rate.id, !rate.isActive)}
                                className={`${
                                  rate.isActive 
                                    ? "text-red-600 hover:text-red-900" 
                                    : "text-blue-600 hover:text-blue-900"
                                }`}
                              >
                                {rate.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Users Management</h3>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Add User
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Balance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${user.balance.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.balance > 0 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {user.balance > 0 ? "Active" : "Low Balance"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900" 
                                title="Edit User"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserModal(true);
                                }}
                                className="text-green-600 hover:text-green-900" 
                                title="Add Credits"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900" 
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Calls Tab */}
          {activeTab === "calls" && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Calls Management</h3>
                  <div className="flex space-x-2">
                    <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                      <option>All Status</option>
                      <option>COMPLETED</option>
                      <option>FAILED</option>
                      <option>CANCELLED</option>
                    </select>
                    <button 
                      onClick={exportCallsToCSV}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          From/To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {calls.map((call) => (
                        <tr key={call.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div>
                              <div>{call.user.name}</div>
                              <div className="text-xs text-gray-500">{call.user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div>{call.fromNumber}</div>
                              <div className="text-xs text-gray-500">→ {call.toNumber}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${call.cost.toFixed(3)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              call.status === 'COMPLETED' 
                                ? "bg-green-100 text-green-800" 
                                : call.status === 'FAILED'
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {call.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(call.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900" title="View Details">
                                <Edit className="h-4 w-4" />
                              </button>
                              {call.status === 'COMPLETED' && (
                                <button 
                                  onClick={() => handleRefundCall(call.id)}
                                  className="text-green-600 hover:text-green-900" 
                                  title="Refund"
                                >
                                  <DollarSign className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Payments Management</h3>
                  <div className="flex space-x-2">
                    <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                      <option>All Status</option>
                      <option>COMPLETED</option>
                      <option>PENDING</option>
                      <option>FAILED</option>
                    </select>
                    <button 
                      onClick={exportPaymentsToCSV}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stripe ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div>
                              <div>{payment.user.name}</div>
                              <div className="text-xs text-gray-500">{payment.user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${payment.amount.toFixed(2)} {payment.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              payment.status === 'COMPLETED' 
                                ? "bg-green-100 text-green-800" 
                                : payment.status === 'FAILED'
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.stripePaymentId ? (
                              <span className="font-mono text-xs">{payment.stripePaymentId.substring(0, 20)}...</span>
                            ) : (
                              <span>—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900" title="View Details">
                                <Edit className="h-4 w-4" />
                              </button>
                              {payment.status === 'COMPLETED' && (
                                <button 
                                  onClick={() => handleRefundPayment(payment.id)}
                                  className="text-red-600 hover:text-red-900" 
                                  title="Refund"
                                >
                                  <DollarSign className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Providers Tab */}
          {activeTab === "providers" && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Provider Status</h3>
                  <button 
                    onClick={() => handleRefreshProviders()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    <Activity className="h-4 w-4 mr-1" />
                    Refresh Status
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {providers.map((provider) => (
                    <div key={provider.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold capitalize">{provider.provider}</h4>
                        <div className={`w-3 h-3 rounded-full ${
                          provider.isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Success Rate:</span>
                          <span className={`font-medium ${
                            provider.successRate >= 95 ? 'text-green-600' : 
                            provider.successRate >= 90 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {provider.successRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avg Response:</span>
                          <span className="font-medium">{provider.avgResponseTime}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Check:</span>
                          <span className="text-xs text-gray-500">
                            {new Date(provider.lastChecked).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <button 
                          onClick={() => handleToggleProvider(provider.id, !provider.isActive)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            provider.isActive 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {provider.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button 
                          onClick={() => handleTestProvider(provider.id)}
                          className="px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                        >
                          Test
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Provider Configuration</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Auto-Failover</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Load Balancing</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Configurations Tab */}
          {activeTab === "configurations" && (
            <ConfigurationsTab />
          )}
        </div>
      </div>

      {/* Add Credits Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Credits to {selectedUser.name}
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Current Balance: ${selectedUser.balance.toFixed(2)}
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Add ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                  setCreditAmount('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const amount = parseFloat(creditAmount);
                  if (amount > 0) {
                    handleAddCredits(selectedUser.id, amount);
                  }
                }}
                disabled={!creditAmount || parseFloat(creditAmount) <= 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                Add Credits
              </button>
            </div>
          </div>
        </div>
      )}
      
      {ModalComponent}
    </div>
  );
}
