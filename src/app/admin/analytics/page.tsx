"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavigation from '@/components/AdminNavigation';
import { 
  BarChart3, 
  TrendingUp, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Globe,
  Activity,
  Users,
  DollarSign
} from 'lucide-react';

interface AnalyticsData {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number;
  avgResponseTime: number;
  providerStats: Array<{
    provider: string;
    successRate: number;
    avgResponseTime: number;
    totalCalls: number;
    isActive: boolean;
  }>;
  countryStats: Array<{
    country: string;
    calls: number;
    successRate: number;
  }>;
  hourlyStats: Array<{
    hour: number;
    calls: number;
    successRate: number;
  }>;
}

export default function AnalyticsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeframe, setTimeframe] = useState('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session?.user) {
      fetchAnalytics();
    }
  }, [session, status, timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?timeframe=${timeframe}`);
      
      if (response.status === 403) {
        router.push('/dashboard');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        console.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Analytics Data</h2>
          <p className="text-gray-600">Unable to load analytics dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Call Analytics Dashboard</h1>
          
          {/* Timeframe Selector */}
          <div className="flex space-x-4">
            {['1h', '24h', '7d', '30d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {tf === '1h' ? 'Last Hour' :
                 tf === '24h' ? 'Last 24 Hours' :
                 tf === '7d' ? 'Last 7 Days' :
                 'Last 30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalCalls}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Failed Calls</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.failedCalls}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.avgResponseTime}ms</p>
              </div>
            </div>
          </div>
        </div>

        {/* Provider Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Provider Performance
            </h3>
            <div className="space-y-4">
              {analytics.providerStats.map((provider) => (
                <div key={provider.provider} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      provider.isActive ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium capitalize">{provider.provider}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{provider.successRate.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">{provider.avgResponseTime}ms</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Top Countries
            </h3>
            <div className="space-y-4">
              {analytics.countryStats.map((country, index) => (
                <div key={country.country} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                    <span className="font-medium">{country.country}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{country.calls} calls</div>
                    <div className="text-xs text-gray-500">{country.successRate.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hourly Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Hourly Call Volume (Last 24 Hours)
          </h3>
          <div className="h-64 flex items-end space-x-1">
            {analytics.hourlyStats.map((stat) => (
              <div key={stat.hour} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${(stat.calls / Math.max(...analytics.hourlyStats.map(s => s.calls))) * 200}px` }}
                ></div>
                <div className="text-xs text-gray-500 mt-2">{stat.hour}:00</div>
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise Features Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Enterprise Features Available</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8" />
              <div>
                <div className="font-semibold">Multi-Provider Routing</div>
                <div className="text-blue-100 text-sm">Automatic failover & optimization</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8" />
              <div>
                <div className="font-semibold">Volume Discounts</div>
                <div className="text-blue-100 text-sm">Up to 25% off bulk purchases</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8" />
              <div>
                <div className="font-semibold">Enterprise API</div>
                <div className="text-blue-100 text-sm">CRM integration ready</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}