'use client'

import { useState, useEffect } from 'react'
import { Download, Search, Filter, DollarSign } from 'lucide-react'
import PageLayout, { Card, Button } from '../../../components/PageLayout'



interface CallRate {
  id: string
  country: string
  countryCode: string
  callerIdCountry: string
  flag?: string
  rate: number
  currency: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AllRatesPage() {
  const [rates, setRates] = useState<CallRate[]>([])
  const [filteredRates, setFilteredRates] = useState<CallRate[]>([])
  const [callerIdCountries, setCallerIdCountries] = useState<{code: string, name: string, flag: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [callerIdCountry, setCallerIdCountry] = useState<string>('US')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)


  useEffect(() => {
    fetchRates()
  }, [callerIdCountry])

  useEffect(() => {
    fetchCallerIdCountries()
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
    setCurrentPage(1) // Reset to first page when filters change
  }, [rates, searchTerm, filterActive])

  const fetchRates = async () => {
    try {
      const response = await fetch(`/api/rates/all?callerIdCountry=${callerIdCountry}`)
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

  const fetchCallerIdCountries = async () => {
    try {
      const response = await fetch('/api/rates/caller-id-countries')
      if (response.ok) {
        const data = await response.json()
        setCallerIdCountries(data)
      }
    } catch (error) {
      console.error('Error fetching caller ID countries:', error)
      // Fallback to some common countries if API fails
      setCallerIdCountries([
        { code: 'US', name: 'United States', flag: '🇺🇸' },
        { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
        { code: 'CA', name: 'Canada', flag: '🇨🇦' },
        { code: 'AU', name: 'Australia', flag: '🇦🇺' },
      ])
    }
  }

  // Pagination calculations
  const totalItems = filteredRates.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRates = filteredRates.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const exportToCSV = () => {
    const headers = ['Country', 'Country Code', 'Mobile Rate (per minute)', 'Landline Rate (per minute)', 'Currency']
    const csvData = filteredRates.map(rate => [
      rate.country,
      rate.countryCode,
      (rate.rate * 1.25).toFixed(4),
      rate.rate.toFixed(4),
      rate.currency
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
    <PageLayout
      title="All Call Rates"
      description="View mobile and landline calling rates for all countries and regions"
      icon={DollarSign}
    >
      <Card>
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Rate Details</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Note: Call rates vary based on the caller ID country used. For the lowest rates, use US caller IDs or Yadaphone public numbers.
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Button onClick={exportToCSV} className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
            
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Caller ID Country Selector - Horizontal List */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Caller ID:
              </span>
              <div className="flex space-x-2">
                {callerIdCountries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => setCallerIdCountry(country.code)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg border transition-all ${
                      callerIdCountry === country.code
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm font-medium">{country.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by country or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
                >
                  <option value="all">All Rates</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📱 Mobile Rate
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📞 Landline Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Currency
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rate.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rate.countryCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      ${(rate.rate * 1.25).toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      ${rate.rate.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rate.currency}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} rates
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 7) {
                      pageNum = i + 1
                    } else if (currentPage <= 4) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i
                    } else {
                      pageNum = currentPage - 3 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </PageLayout>
  )
}