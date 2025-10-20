'use client'

import { useState, useEffect } from 'react'
import { Download, Search, Filter } from 'lucide-react'

interface CallRate {
  id: string
  country: string
  countryCode: string
  rate: number
  currency: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AllRatesPage() {
  const [rates, setRates] = useState<CallRate[]>([])
  const [filteredRates, setFilteredRates] = useState<CallRate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')


  useEffect(() => {
    fetchRates()
  }, [])

  useEffect(() => {
    let filtered = rates

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(rate => 
        rate.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rate.countryCode.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply active filter
    if (filterActive !== 'all') {
      filtered = filtered.filter(rate => 
        filterActive === 'active' ? rate.isActive : !rate.isActive
      )
    }

    setFilteredRates(filtered)
  }, [rates, searchTerm, filterActive])

  const fetchRates = async () => {
    try {
      const response = await fetch('/api/rates/all')
      if (response.ok) {
        const data = await response.json()
        setRates(data)
      }
    } catch (error) {
      console.error('Error fetching rates:', error)
    } finally {
      setIsLoading(false)
    }
  }







  const exportToCSV = () => {
    const headers = ['Country', 'Country Code', 'Rate (per minute)', 'Currency', 'Status', 'Created', 'Updated']
    const csvData = filteredRates.map(rate => [
      rate.country,
      rate.countryCode,
      rate.rate.toFixed(4),
      rate.currency,
      rate.isActive ? 'Active' : 'Inactive',
      new Date(rate.createdAt).toLocaleDateString(),
      new Date(rate.updatedAt).toLocaleDateString()
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `call_rates_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Call Rates</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage calling rates for all countries and regions
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={exportToCSV}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by country or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Rates</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
                <div className="text-sm text-gray-500">
                  {filteredRates.length} of {rates.length} rates
                </div>
              </div>
            </div>
          </div>

          {/* Rates Table */}
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
                    Rate (per min)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Currency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rate.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rate.countryCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${rate.rate.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rate.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rate.isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {rate.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(rate.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No rates found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>


    </div>
  )
}