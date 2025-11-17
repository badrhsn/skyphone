'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  Download,
  Filter,
  Search,
  Calendar,
  Phone,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/PageLayout';

interface Transaction {
  id: string;
  type: 'call' | 'topup' | 'refund' | 'admin' | 'other';
  amount: number;
  reason: string;
  callId?: string;
  timestamp: string;
  balance: number;
}

/**
 * Transaction History Page
 * Shows all balance changes and financial activity
 */
export default function TransactionHistory() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentBalance, setCurrentBalance] = useState(0);

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch from user profile to get current balance
      const profileRes = await fetch('/api/user/profile');
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setCurrentBalance(profile.balance || 0);
      }

      // Fetch transactions from API
      const response = await fetch('/api/user/transactions');

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      const txns: Transaction[] = data.transactions || [];

      setTransactions(txns);
      applyFilters(txns, searchTerm, selectedType, dateRange);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters
  const applyFilters = (
    txns: Transaction[],
    search: string,
    type: string,
    dates: typeof dateRange
  ) => {
    let result = txns;

    // Filter by type
    if (type !== 'all') {
      result = result.filter((t) => t.type === type);
    }

    // Filter by search
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.reason.toLowerCase().includes(lower) ||
          t.callId?.includes(search) ||
          t.id.includes(search)
      );
    }

    // Filter by date range
    if (dates.start) {
      const startDate = new Date(dates.start);
      result = result.filter((t) => new Date(t.timestamp) >= startDate);
    }
    if (dates.end) {
      const endDate = new Date(dates.end);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter((t) => new Date(t.timestamp) <= endDate);
    }

    setFiltered(result);
  };

  // Watch for filter changes
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchTransactions();
    }
  }, [status, router]);

  useEffect(() => {
    applyFilters(transactions, searchTerm, selectedType, dateRange);
  }, [searchTerm, selectedType, dateRange, transactions]);

  const handleDownloadCSV = () => {
    const headers = ['Date', 'Type', 'Reason', 'Amount', 'Balance', 'Transaction ID'];
    const rows = filtered.map((t) => [
      new Date(t.timestamp).toLocaleString(),
      t.type,
      t.reason,
      t.amount.toFixed(4),
      t.balance.toFixed(2),
      t.id,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00aff0] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalTopups = transactions
    .filter((t) => t.type === 'topup')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpentOnCalls = Math.abs(
    transactions
      .filter((t) => t.type === 'call')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const totalRefunds = transactions
    .filter((t) => t.type === 'refund')
    .reduce((sum, t) => sum + t.amount, 0);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4 text-blue-600" />;
      case 'topup':
        return <CreditCard className="w-4 h-4 text-green-600" />;
      case 'refund':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'admin':
        return <DollarSign className="w-4 h-4 text-orange-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (amount: number) => {
    return amount > 0
      ? 'text-green-600 font-semibold'
      : 'text-red-600 font-semibold';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-[#00aff0]" />
              <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
            </div>
            <button
              onClick={fetchTransactions}
              className="flex items-center gap-2 px-4 py-2 bg-[#00aff0] text-white rounded-lg hover:bg-[#0099d6] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          <p className="text-gray-600">View all your balance changes and financial activity</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Current Balance</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${currentBalance.toFixed(2)}
                </p>
              </div>
              <CreditCard className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Total Added</p>
                <p className="text-3xl font-bold text-green-600">
                  ${totalTopups.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Spent on Calls</p>
                <p className="text-3xl font-bold text-red-600">
                  ${totalSpentOnCalls.toFixed(2)}
                </p>
              </div>
              <TrendingDown className="w-10 h-10 text-red-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Refunds</p>
                <p className="text-3xl font-bold text-purple-600">
                  ${totalRefunds.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reason, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
            >
              <option value="all">All Types</option>
              <option value="call">Calls</option>
              <option value="topup">Topups</option>
              <option value="refund">Refunds</option>
              <option value="admin">Admin</option>
            </select>

            {/* Start Date */}
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
              placeholder="Start date"
            />

            {/* End Date */}
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
              placeholder="End date"
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filtered.length} of {transactions.length} transactions
            </p>
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </Card>

        {/* Transactions List */}
        {filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-600 mb-2">No transactions</p>
            <p className="text-gray-500">
              {transactions.length === 0
                ? 'You have no transactions yet.'
                : 'No transactions match your filters.'}
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900">
                      Balance After
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                      Transaction ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((txn, idx) => (
                    <tr
                      key={txn.id}
                      className={`border-b transition-colors hover:bg-gray-50 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(txn.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(txn.type)}
                          <span className="text-xs font-semibold capitalize text-gray-700">
                            {txn.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {txn.reason}
                        {txn.callId && (
                          <p className="text-xs text-gray-500 mt-1">
                            Call: {txn.callId}
                          </p>
                        )}
                      </td>
                      <td className={`px-6 py-4 text-sm text-right ${getTransactionColor(txn.amount)}`}>
                        {txn.amount > 0 ? '+' : ''} ${Math.abs(txn.amount).toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900 font-medium">
                        ${txn.balance.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-600">
                        {txn.id.substring(0, 8)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Footer Navigation */}
        <div className="mt-8 p-6 bg-[#f3fbff] border border-[#e6fbff] rounded-lg flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Need More Information?</h3>
            <p className="text-sm text-gray-600 mt-1">
              View call history, status updates, and balance tracking
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
              href="/dashboard/add-credits"
              className="px-4 py-2 bg-[#00aff0] text-white rounded-lg font-semibold hover:bg-[#0099d6] transition-colors"
            >
              Add Credits
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
