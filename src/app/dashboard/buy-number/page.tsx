"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Phone, ArrowLeft, Globe, DollarSign, Check, Search, RefreshCw, MapPin, Zap } from "lucide-react";
import Link from "next/link";
import { useModal } from "@/components/Modal";

interface PhoneNumber {
  id: string;
  phoneNumber: string;
  number?: string; // For backward compatibility
  country: string;
  countryCode: string;
  city?: string;
  type: "local" | "toll-free";
  monthlyPrice: number;
  setupFee: number;
  capabilities: {
    voice: boolean;
    sms: boolean;
    fax: boolean;
  };
}

export default function BuyNumberPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showSuccess, showError, showConfirm, ModalComponent } = useModal();
  const [selectedCountry, setSelectedCountry] = useState("United States");
  const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [purchasingNumber, setPurchasingNumber] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numberType, setNumberType] = useState<"all" | "local" | "toll-free">("all");
  const numbersPerPage = 8;

  const countries = [
    { name: "United States", code: "US", flag: "🇺🇸" },
    { name: "Canada", code: "CA", flag: "🇨🇦" },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (session) {
      fetchUserBalance();
      fetchAvailableNumbers();
    }
  }, [status, session, router, selectedCountry]);

  const fetchUserBalance = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const userData = await response.json();
        setUserBalance(userData.balance);
      }
    } catch (error) {
      console.error("Error fetching user balance:", error);
    }
  };

  const fetchAvailableNumbers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/phone-numbers/available?country=${encodeURIComponent(selectedCountry)}`);
      if (response.ok) {
        const numbers = await response.json();
        setAvailableNumbers(numbers);
      } else {
        console.error("Failed to fetch available numbers");
        setAvailableNumbers([]);
      }
    } catch (error) {
      console.error("Error fetching available numbers:", error);
      setAvailableNumbers([]);
    } finally {
      setLoading(false);
    }
  };

  const purchaseNumber = async (number: PhoneNumber) => {
    const totalCost = (number.monthlyPrice || 0) + (number.setupFee || 0);
    const phoneNum = number.phoneNumber || number.number || 'this number';
    
    showConfirm(
      "Purchase Phone Number",
      `Purchase ${phoneNum} for $${totalCost.toFixed(2)}?\n\nMonthly: $${number.monthlyPrice || 0}\nSetup: $${number.setupFee || 0}\nTotal: $${totalCost.toFixed(2)}`,
      () => {
        handlePurchase(number);
      },
      "Purchase",
      "Cancel"
    );
  };

  const handlePurchase = async (number: PhoneNumber) => {
      setPurchasingNumber(number.id);
      try {
        const response = await fetch('/api/user/phone-numbers/purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: number.phoneNumber || number.number,
            country: number.country || 'United States',
            countryCode: number.countryCode || '+1',
            city: number.city || '',
            type: number.type || 'local',
            monthlyPrice: number.monthlyPrice || 0,
            setupFee: number.setupFee || 0,
            capabilities: number.capabilities || { voice: true, sms: true, fax: false },
          }),
        });

        const result = await response.json();
        
        if (response.ok) {
          if (result.paymentType === 'balance') {
            // Payment was deducted from balance
            showSuccess("Purchase Successful", "Number purchased successfully! You can now use this number for outgoing calls.");
            setUserBalance(result.newBalance);
            fetchAvailableNumbers(); // Refresh available numbers
          } else if (result.paymentType === 'checkout' && result.checkoutUrl) {
            // Redirect to Stripe checkout
            console.log("Redirecting to Stripe checkout:", result.checkoutUrl);
            window.location.href = result.checkoutUrl;
            return; // Don't execute finally block until redirect completes
          } else {
            showError("Purchase Failed", "Unexpected response format. Please try again.");
          }
        } else {
          showError("Purchase Failed", result.error || "Failed to purchase number. Please try again.");
        }
      } catch (error) {
        console.error("Error purchasing number:", error);
        showError("Purchase Error", "Failed to purchase number. Please try again.");
      } finally {
        setPurchasingNumber(null);
      }
  };

  // Filter numbers based on search query and type
  const filteredNumbers = availableNumbers.filter((number: PhoneNumber) => {
    const phoneNumber = number.phoneNumber || number.number;
    
    if (!phoneNumber) return false;
    
    const query = searchQuery?.toLowerCase() || "";
    const matchesSearch = phoneNumber.toLowerCase().includes(query);
    
    if (numberType === "all") return matchesSearch;
    if (numberType === "toll-free") return matchesSearch && number.type === "toll-free";
    if (numberType === "local") return matchesSearch && number.type === "local";
    
    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredNumbers.length / numbersPerPage);
  const startIndex = (currentPage - 1) * numbersPerPage;
  const paginatedNumbers = filteredNumbers.slice(startIndex, startIndex + numbersPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, numberType]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00aff0] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-6 w-6 text-[#00aff0]" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Get Your Number</h1>
                    <p className="text-sm text-gray-600">Purchase a new phone number to make and receive calls</p>
                  </div>
                </div>
            </div>
          </div>
        </div>

        {/* Info Message */}
              <div className="bg-[#f3fbff] border border-[#e6fbff] rounded-2xl p-6 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Important Information</h3>
                  <p className="mt-2 text-sm text-slate-600">Supporting documents might be required by our customer support team.</p>
                  <p className="mt-2 text-sm text-slate-600">Our team may contact you to verify your identity and intended use of the phone number for compliance purposes.</p>
                </div>
              </div>



  {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00aff0] focus:border-[#00aff0] focus:bg-white transition-all duration-200"
                />
              </div>
              <button
                onClick={fetchAvailableNumbers}
                disabled={loading}
                className="flex items-center space-x-2 bg-gradient-to-r from-[#00aff0] to-[#0099d6] hover:from-[#0099d6] hover:to-[#0086c2] text-white px-6 py-3 rounded-2xl font-medium transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Searching...' : 'Refresh'}</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700">Filter by type:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "All Numbers", icon: Globe },
                    { value: "local", label: "Local", icon: MapPin },
                    { value: "toll-free", label: "Toll-Free", icon: Zap }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setNumberType(value as any)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        numberType === value
                          ? "bg-[#e6fbff] text-[#00aff0] border border-[#e6fbff]"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Country Selection */}
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700">Region:</span>
                <div className="flex flex-wrap gap-2">
                  {countries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => setSelectedCountry(country.name)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedCountry === country.name
                          ? "bg-[#e6fbff] text-[#00aff0] border border-[#e6fbff]"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      <span>{country.flag}</span>
                      <span>{country.code}</span>
                      {selectedCountry === country.name && (
                        <Check className="h-3 w-3 text-[#00aff0]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

  {/* Available Numbers */}
  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#e6fbff] rounded-2xl flex items-center justify-center">
                  <Phone className="h-5 w-5 text-[#00aff0]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Available Numbers in {selectedCountry}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {loading ? "Searching for numbers..." : `${filteredNumbers.length} numbers found`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00aff0] mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Finding perfect numbers for you...</p>
                <p className="text-gray-500 text-sm mt-1">This may take a few moments</p>
              </div>
            ) : filteredNumbers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Numbers Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery 
                    ? `No numbers match "${searchQuery}" in ${selectedCountry}`
                    : `No numbers available in ${selectedCountry} right now`
                  }
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    fetchAvailableNumbers();
                  }}
                  className="bg-gradient-to-r from-[#00aff0] to-[#0099d6] hover:from-[#0099d6] hover:to-[#0086c2] text-white px-6 py-3 rounded-2xl font-medium transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedNumbers.map((number: PhoneNumber, index: number) => (
                  <div
                    key={number.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl hover:border-[#00aff0] hover:bg-[#f3fbff] transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-mono font-semibold text-gray-900">
                            {number.phoneNumber || number.number || 'N/A'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            number.type === "toll-free" 
                              ? "bg-[#e6fbff] text-[#00aff0]" 
                              : "bg-[#e6fbff] text-[#00aff0]"
                          }`}>
                            {number.type === "toll-free" ? "Toll-Free" : "Local"}
                          </span>
                        </div>
                        {number.city && (
                          <div className="text-sm text-gray-600 mt-1">
                            {number.city}, {number.country || 'Unknown'}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          ${((number.monthlyPrice || 0) + (number.setupFee || 0)).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">
                          ${number.monthlyPrice || 0}/mo + ${number.setupFee || 0} setup
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => purchaseNumber(number)}
                      disabled={purchasingNumber === number.id}
                      className="ml-4 bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white px-4 py-2 rounded-2xl font-medium transition-colors duration-200 disabled:opacity-50 text-sm"
                    >
                      {purchasingNumber === number.id ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        "Get Number"
                      )}
                    </button>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(startIndex + numbersPerPage, filteredNumbers.length)} of {filteredNumbers.length} numbers
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <div className="flex space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                              currentPage === page
                                  ? "bg-[#00aff0] text-white"
                                : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

  {/* Info Section */}
  <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Why Choose Our Numbers?</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-4 rounded-xl border border-gray-100 bg-white">
              <div className="w-10 h-10 bg-[#e6fbff] rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-[#00aff0]" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Instant Setup</h4>
                <p className="text-sm text-gray-600 mt-1">Ready to use immediately after purchase</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-xl border border-gray-100 bg-white">
              <div className="w-10 h-10 bg-[#e6fbff] rounded-lg flex items-center justify-center">
                <Phone className="h-5 w-5 text-[#00aff0]" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Global Reach</h4>
                <p className="text-sm text-gray-600 mt-1">Make calls worldwide with crystal clear quality</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-xl border border-gray-100 bg-white">
              <div className="w-10 h-10 bg-[#e6fbff] rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-[#00aff0]" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Enterprise Grade</h4>
                <p className="text-sm text-gray-600 mt-1">99.9% uptime with enterprise reliability</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-xl border border-gray-100 bg-white">
              <div className="w-10 h-10 bg-[#e6fbff] rounded-lg flex items-center justify-center">
                <Check className="h-5 w-5 text-[#00aff0]" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">No Contracts</h4>
                <p className="text-sm text-gray-600 mt-1">Cancel anytime, no commitments required</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-[#f3fbff] rounded-xl border border-[#e6fbff]">
            <div className="flex items-center space-x-2 text-[#00aff0] font-medium">
              <div className="w-5 h-5 bg-[#e6fbff] rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-[#00aff0]" />
              </div>
              <span>Numbers with sufficient balance are available for instant purchase!</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {ModalComponent}
    </div>
  );
}


