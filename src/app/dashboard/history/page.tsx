"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  History, 
  Phone, 
  PhoneOff, 
  Clock, 
  DollarSign, 
  PhoneCall,
  Globe,
  ArrowLeft,
  Download,
  Filter,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/PageLayout";

interface Call {
  id: string;
  fromNumber: string;
  toNumber: string;
  country: string;
  duration: number;
  cost: number;
  status: string;
  createdAt: string;
  endedAt?: string;
}

interface CallAnalytics {
  period: {
    start: Date;
    end: Date;
    days: number;
  };
  callStats: {
    total: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  timeStats: {
    totalDuration: number;
    averageDuration: number;
    maxDuration: number;
  };
  costStats: {
    totalCost: number;
    averageCost: number;
    minCost: number;
    maxCost: number;
  };
  topCountries: Array<{
    country: string;
    count: number;
    cost: number;
    duration: number;
  }>;
  topNumbers: Array<{
    number: string;
    count: number;
    cost: number;
    country: string;
  }>;
  recentCalls: Call[];
}

export default function CallHistory() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [calls, setCalls] = useState<Call[]>([]);
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);
  const [searchTerm, setSearchTerm] = useState("");
  const [useAnalytics, setUseAnalytics] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      if (useAnalytics) {
        fetchAnalytics();
      } else {
        fetchCalls();
      }
    }
  }, [status, router, days, useAnalytics]);

  const fetchCalls = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch("/api/calls/history");
      if (response.ok) {
        const data = await response.json();
        setCalls(data);
      } else {
        setError("Failed to fetch call history");
      }
    } catch (error) {
      console.error("Error fetching calls:", error);
      setError("An error occurred while fetching call history");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch(`/api/user/call-analytics?days=${days}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
        setCalls(data.analytics.recentCalls);
      } else {
        setError("Failed to fetch analytics");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("An error occurred while fetching analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "text-[#00aff0] bg-[#e6fbff]";
      case "failed":
        return "text-red-600 bg-red-100";
      case "cancelled":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-[#00aff0] bg-[#e6fbff]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Phone className="h-4 w-4 text-[#00aff0]" />;
      case "failed":
      case "cancelled":
        return <PhoneOff className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-[#00aff0]" />;
    }
  };

  const generateCSV = () => {
    if (!analytics) return '';

    const headers = [
      'Call ID',
      'Number',
      'Country',
      'Duration (seconds)',
      'Cost',
      'Status',
      'Timestamp',
    ];

    const rows = analytics.recentCalls.map((call) => [
      call.id,
      call.toNumber,
      call.country,
      call.duration,
      call.cost,
      call.status,
      new Date(call.createdAt).toISOString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) =>
            typeof cell === 'string' && cell.includes(',')
              ? `"${cell}"`
              : cell
          )
          .join(',')
      ),
    ].join('\n');

    return csv;
  };

  const downloadCSV = (csv: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `call-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00aff0] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <History className="h-6 w-6 text-[#00aff0]" />
              <h1 className="text-3xl font-bold text-gray-900">Call History & Analytics</h1>
            </div>
            <button
              onClick={() => setUseAnalytics(!useAnalytics)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#00aff0] rounded-lg hover:bg-[#0099d6] transition-colors"
            >
              {useAnalytics ? 'Simple View' : 'Analytics View'}
            </button>
          </div>

          <p className="text-gray-600 mt-2">
            {useAnalytics ? 'View detailed analytics and statistics' : 'View your call logs'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {calls.length === 0 ? (
          <Card className="p-12 text-center bg-[#f3fbff] border border-[#e6fbff]">
            <div className="relative mb-6">
              <div className="w-12 h-12 bg-[#e6fbff] rounded-full flex items-center justify-center mx-auto">
                <History className="h-5 w-5 text-[#00aff0]" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No calls yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start making calls to see your call history and statistics here.
            </p>
            <Link
              href="/dashboard/dialer"
              className="bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white px-6 py-2 rounded-2xl font-medium hover:from-[#0099d6] hover:to-[#0086c2] transition-all inline-flex items-center space-x-2"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Make Your First Call</span>
            </Link>
          </Card>
        ) : (
          <>
            {useAnalytics && analytics && (
              <>
                {/* Analytics Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search phone numbers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
                    />
                  </div>

                  <select
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                  </select>

                  <button
                    onClick={() => {
                      const csv = generateCSV();
                      downloadCSV(csv);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#00aff0] text-white rounded-lg hover:bg-[#0099d6] transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>Export</span>
                  </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {/* Total Calls */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Calls</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {analytics.callStats.total}
                        </p>
                      </div>
                      <Phone className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      {analytics.callStats.completed} completed
                    </p>
                  </div>

                  {/* Total Duration */}
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Total Duration</p>
                        <p className="text-2xl font-bold text-green-900">
                          {formatDuration(analytics.timeStats.totalDuration)}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-green-400" />
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      Avg: {formatDuration(analytics.timeStats.averageDuration)}
                    </p>
                  </div>

                  {/* Total Cost */}
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Total Spent</p>
                        <p className="text-2xl font-bold text-purple-900">
                          ${analytics.costStats.totalCost.toFixed(2)}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-purple-400" />
                    </div>
                    <p className="text-xs text-purple-600 mt-2">
                      Avg: ${analytics.costStats.averageCost.toFixed(4)}
                    </p>
                  </div>

                  {/* Success Rate */}
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-600 font-medium">Success Rate</p>
                        <p className="text-2xl font-bold text-orange-900">
                          {analytics.callStats.total > 0
                            ? Math.round(
                                (analytics.callStats.completed /
                                  analytics.callStats.total) *
                                  100
                              )
                            : 0}
                          %
                        </p>
                      </div>
                      <Filter className="w-8 h-8 text-orange-400" />
                    </div>
                    <p className="text-xs text-orange-600 mt-2">
                      {analytics.callStats.failed} failed
                    </p>
                  </div>
                </div>

                {/* Top Countries */}
                {analytics.topCountries.length > 0 && (
                  <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Globe className="w-5 h-5 text-[#00aff0]" />
                      <span>Top Countries</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {analytics.topCountries.map((country, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white rounded-lg border border-gray-200"
                        >
                          <p className="text-sm text-gray-600">{country.country}</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {country.count}
                          </p>
                          <p className="text-xs text-gray-500">
                            ${country.cost.toFixed(2)} spent
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Calls Table */}
            <Card className="overflow-hidden">
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {useAnalytics ? 'Recent Calls' : 'Your Call History'}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                        <th className="pb-3">Number</th>
                        <th className="pb-3">Country</th>
                        <th className="pb-3">Duration</th>
                        <th className="pb-3">Cost</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calls
                        .filter(
                          (call) =>
                            !searchTerm ||
                            call.toNumber.includes(searchTerm) ||
                            call.country
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                        )
                        .map((call) => (
                          <tr
                            key={call.id}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-3 text-sm text-gray-900 font-medium">
                              {call.toNumber}
                            </td>
                            <td className="py-3 text-sm text-gray-600">
                              {call.country}
                            </td>
                            <td className="py-3 text-sm text-gray-600">
                              {formatDuration(call.duration)}
                            </td>
                            <td className="py-3 text-sm text-gray-900 font-medium">
                              ${call.cost.toFixed(4)}
                            </td>
                            <td className="py-3">
                              <span
                                className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  call.status
                                )}`}
                              >
                                {call.status}
                              </span>
                            </td>
                            <td className="py-3 text-sm text-gray-600">
                              {formatDate(call.createdAt)}
                            </td>
                            <td className="py-3">
                              <button
                                onClick={() =>
                                  router.push(`/dashboard/call/${call.id}`)
                                }
                                className="text-[#00aff0] hover:text-[#008fcf] text-sm font-medium"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </>
        )}

        <div className="mt-4 p-4 rounded-lg border border-dashed flex items-center justify-between bg-[#f3fbff] border-[#e6fbff]">
          <div className="text-gray-700">Need Yadaphone for the team?</div>
          <Link href="/dashboard/enterprise" className="inline-flex items-center text-white px-4 py-2 rounded-full font-semibold bg-gradient-to-r from-[#00aff0] to-[#0099d6]">
            See enterprise plans
          </Link>
        </div>
      </div>
    </div>
  );
}
