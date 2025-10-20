"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Phone, ArrowLeft, Globe, DollarSign, Check } from "lucide-react";
import Link from "next/link";

interface PhoneNumber {
  id: string;
  number: string;
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
  const [selectedCountry, setSelectedCountry] = useState("United States");
  const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  const countries = [
    { name: "United States", code: "US", flag: "🇺🇸" },
    { name: "United Kingdom", code: "GB", flag: "🇬🇧" },
    { name: "Canada", code: "CA", flag: "🇨🇦" },
    { name: "Germany", code: "DE", flag: "🇩🇪" },
    { name: "France", code: "FR", flag: "🇫🇷" },
    { name: "Australia", code: "AU", flag: "🇦🇺" },
  ];

  // Mock data for available numbers
  const mockNumbers: PhoneNumber[] = [
    {
      id: "1",
      number: "+1 (555) 123-4567",
      country: "United States",
      countryCode: "+1",
      city: "New York",
      type: "local",
      monthlyPrice: 2.99,
      setupFee: 1.00,
      capabilities: { voice: true, sms: true, fax: false }
    },
    {
      id: "2",
      number: "+1 (555) 987-6543",
      country: "United States",
      countryCode: "+1",
      city: "Los Angeles",
      type: "local",
      monthlyPrice: 2.99,
      setupFee: 1.00,
      capabilities: { voice: true, sms: true, fax: true }
    },
    {
      id: "3",
      number: "+1 (800) 555-0123",
      country: "United States",
      countryCode: "+1",
      type: "toll-free",
      monthlyPrice: 9.99,
      setupFee: 5.00,
      capabilities: { voice: true, sms: false, fax: false }
    },
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
    // Simulate API call
    setTimeout(() => {
      const filtered = mockNumbers.filter(num => 
        num.country === selectedCountry
      );
      setAvailableNumbers(filtered);
      setLoading(false);
    }, 1000);
  };

  const purchaseNumber = async (number: PhoneNumber) => {
    const totalCost = number.monthlyPrice + number.setupFee;
    
    if (userBalance < totalCost) {
      alert(`Insufficient balance. You need $${totalCost.toFixed(2)} but only have $${userBalance.toFixed(2)}`);
      return;
    }

    const confirmed = confirm(
      `Purchase ${number.number} for $${totalCost.toFixed(2)}?\n\nMonthly: $${number.monthlyPrice}\nSetup: $${number.setupFee}\nTotal: $${totalCost.toFixed(2)}`
    );

    if (confirmed) {
      try {
        // Simulate purchase API call
        alert("Number purchased successfully! You can now use this number for outgoing calls.");
        fetchUserBalance(); // Refresh balance
      } catch (error) {
        alert("Failed to purchase number. Please try again.");
      }
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Buy Phone Number</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Your Balance</p>
            <p className="text-2xl font-bold text-green-600">${userBalance.toFixed(2)}</p>
          </div>
        </div>

        {/* Country Selector */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Country</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {countries.map((country) => (
              <button
                key={country.code}
                onClick={() => setSelectedCountry(country.name)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCountry === country.name
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-2">{country.flag}</div>
                <div className="text-sm font-medium text-gray-900">{country.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Available Numbers */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Available Numbers in {selectedCountry}
            </h2>
            <button
              onClick={fetchAvailableNumbers}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Searching..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching for available numbers...</p>
            </div>
          ) : availableNumbers.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No numbers available in {selectedCountry}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableNumbers.map((number) => (
                <div
                  key={number.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-xl font-mono font-bold text-gray-900">
                          {number.number}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          number.type === "toll-free" 
                            ? "bg-purple-100 text-purple-700" 
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {number.type === "toll-free" ? "Toll-Free" : "Local"}
                        </span>
                      </div>
                      
                      {number.city && (
                        <p className="text-gray-600 mb-3">{number.city}, {number.country}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 mb-3">
                        {number.capabilities.voice && (
                          <span className="flex items-center space-x-1 text-green-600">
                            <Check className="h-4 w-4" />
                            <span className="text-sm">Voice</span>
                          </span>
                        )}
                        {number.capabilities.sms && (
                          <span className="flex items-center space-x-1 text-green-600">
                            <Check className="h-4 w-4" />
                            <span className="text-sm">SMS</span>
                          </span>
                        )}
                        {number.capabilities.fax && (
                          <span className="flex items-center space-x-1 text-green-600">
                            <Check className="h-4 w-4" />
                            <span className="text-sm">Fax</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Monthly: ${number.monthlyPrice}</span>
                        <span>Setup: ${number.setupFee}</span>
                        <span className="font-bold text-gray-900">
                          Total: ${(number.monthlyPrice + number.setupFee).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => purchaseNumber(number)}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                      Purchase
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-3">How it works</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• Purchase a phone number to use as your caller ID</p>
            <p>• Monthly subscription includes unlimited incoming calls</p>
            <p>• Use your number for outgoing calls worldwide</p>
            <p>• Cancel anytime - no long-term contracts</p>
          </div>
        </div>
      </div>
    </div>
  );
}


