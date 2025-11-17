'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Phone,
  PhoneOff,
  Clock,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Zap,
  TrendingUp,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/PageLayout';

interface CallEvent {
  id: string;
  callSid: string;
  toNumber: string;
  country: string;
  status: string;
  duration: number;
  cost: number;
  startTime: string;
  endTime?: string;
  userBalance: number;
}

/**
 * Real-time Status Dashboard
 * Shows current call status and real-time updates
 */
export default function StatusDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CallEvent[]>([]);
  const [currentCall, setCurrentCall] = useState<CallEvent | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch call events
  const fetchEvents = async () => {
    if (!session?.user?.id) return;

    try {
      setError(null);
      const response = await fetch('/api/twilio/events?limit=50');

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      const callEvents: CallEvent[] = data.events || [];

      setEvents(callEvents);

      // Find current active call
      const active = callEvents.find((call) =>
        ['RINGING', 'ANSWERED'].includes(call.status)
      );

      setCurrentCall(active || null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load call events');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Auto-refresh
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchEvents();

      if (autoRefresh && currentCall) {
        const interval = setInterval(fetchEvents, 2000);
        return () => clearInterval(interval);
      }
    }
  }, [status, router, autoRefresh, currentCall]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEvents();
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00aff0] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading status...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'ringing':
        return 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse';
      case 'answered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'answered':
        return <Phone className="w-4 h-4" />;
      case 'failed':
      case 'cancelled':
        return <PhoneOff className="w-4 h-4" />;
      case 'ringing':
        return <Zap className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const totalCalls = events.length;
  const completedCalls = events.filter((e) => e.status === 'COMPLETED').length;
  const failedCalls = events.filter((e) => e.status === 'FAILED').length;
  const totalSpent = events.reduce((sum, e) => sum + e.cost, 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-[#00aff0]" />
              <h1 className="text-3xl font-bold text-gray-900">Call Status Dashboard</h1>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[#00aff0] text-white rounded-lg hover:bg-[#0099d6] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <p className="text-gray-600">Real-time monitoring of your call status and activity</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Active Call Alert */}
        {currentCall && (
          <div className="mb-8 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <h2 className="text-xl font-bold text-emerald-900">Call In Progress</h2>
              </div>
              <span className="text-sm font-semibold text-emerald-600 uppercase">
                {currentCall.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-emerald-600 font-medium mb-1">Calling</p>
                <p className="text-lg font-bold text-emerald-900">{currentCall.toNumber}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-medium mb-1">Country</p>
                <p className="text-lg font-bold text-emerald-900">{currentCall.country}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-medium mb-1">Duration</p>
                <p className="text-lg font-bold text-emerald-900">{formatDuration(currentCall.duration)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-medium mb-1">Cost So Far</p>
                <p className="text-lg font-bold text-emerald-900">${currentCall.cost.toFixed(4)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Calls */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Calls</p>
                <p className="text-3xl font-bold text-gray-900">{totalCalls}</p>
              </div>
              <Phone className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
            {completedCalls > 0 && (
              <p className="text-xs text-green-600 mt-2">
                ✓ {completedCalls} completed
              </p>
            )}
          </Card>

          {/* Completed */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedCalls}</p>
              </div>
              <Phone className="w-10 h-10 text-green-500 opacity-20" />
            </div>
            {totalCalls > 0 && (
              <p className="text-xs text-gray-600 mt-2">
                {Math.round((completedCalls / totalCalls) * 100)}% success rate
              </p>
            )}
          </Card>

          {/* Failed */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-600">{failedCalls}</p>
              </div>
              <PhoneOff className="w-10 h-10 text-red-500 opacity-20" />
            </div>
            {failedCalls > 0 && (
              <p className="text-xs text-red-600 mt-2">
                Review failed calls
              </p>
            )}
          </Card>

          {/* Total Spent */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-purple-600">
                  ${totalSpent.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
            {completedCalls > 0 && (
              <p className="text-xs text-gray-600 mt-2">
                Avg: ${(totalSpent / completedCalls).toFixed(4)}/call
              </p>
            )}
          </Card>
        </div>

        {/* Auto-refresh Toggle */}
        <div className="mb-6 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#00aff0] focus:ring-[#00aff0]"
            />
            <span className="text-sm text-gray-700 font-medium">
              Auto-refresh every 2 seconds
            </span>
          </label>
        </div>

        {/* Events List */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Recent Call Events</h2>
            <p className="text-sm text-gray-600 mt-1">Showing {events.length} recent calls</p>
          </div>

          {events.length === 0 ? (
            <div className="p-12 text-center">
              <Phone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-600 mb-2">No calls yet</p>
              <p className="text-gray-500 mb-4">Make your first call to see it appear here</p>
              <Link
                href="/dashboard/dialer"
                className="inline-flex items-center gap-2 bg-[#00aff0] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#0099d6] transition-colors"
              >
                Make a Call
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((call) => (
                    <tr key={call.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-900">
                          {call.toNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{call.country}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            call.status
                          )}`}
                        >
                          {getStatusIcon(call.status)}
                          {call.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {formatDuration(call.duration)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">
                          ${call.cost.toFixed(4)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDateTime(call.startTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="mt-8 p-6 bg-[#f3fbff] border border-[#e6fbff] rounded-lg flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">View More Details</h3>
            <p className="text-sm text-gray-600 mt-1">
              Check call history, analytics, and transaction details
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/history"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Call History
            </Link>
            <Link
              href="/dashboard/transactions"
              className="px-4 py-2 bg-[#00aff0] text-white rounded-lg font-semibold hover:bg-[#0099d6] transition-colors"
            >
              Transactions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
