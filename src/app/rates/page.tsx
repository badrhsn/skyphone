"use client";

import { useState, useEffect } from "react";
import { Phone, Globe, HelpCircle, Calculator, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PageLayout, { Card, Button } from "../../components/PageLayout";

interface Rate {
  id: string;
  country: string;
  countryCode: string;
  flag?: string;
  rate: number;
  currency: string;
  isActive: boolean;
}

// Removed static countryFlags - now using dynamic flags from database

const CALLER_ID_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'PH', name: 'Philippines', flag: '��' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'TH', name: 'Thailand', flag: '��' }
];

export default function RatesPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("United States");
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  const [callType, setCallType] = useState<"mobile" | "landline">("mobile");
  const [isLoading, setIsLoading] = useState(true);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(5);
  const [callerIdCountry, setCallerIdCountry] = useState<string>("US");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchRates();
  }, [callerIdCountry]);

  useEffect(() => {
    if (rates.length > 0) {
      // Check if there's a country parameter in the URL
      const countryParam = searchParams.get('country');
      let targetCountry = "United States";
      
      if (countryParam && countryParam !== "All") {
        // Map common country name variations
        const countryMappings: { [key: string]: string } = {
          "USA": "United States",
          "UK": "United Kingdom",
          "UAE": "United Arab Emirates"
        };
        
        targetCountry = countryMappings[countryParam] || countryParam;
      }
      
      const selectedCountryRate = rates.find(r => r.country === targetCountry) || rates[0];
      setSelectedCountry(selectedCountryRate.country);
      setSelectedRate(selectedCountryRate);
    }
  }, [rates, searchParams]);

  const fetchRates = async () => {
    try {
      const response = await fetch(`/api/rates?callerIdCountry=${callerIdCountry}`);
      if (response.ok) {
        const data = await response.json();
        setRates(data);
      }
    } catch (error) {
      console.error("Error fetching rates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountrySelect = (country: string) => {
    const rate = rates.find(r => r.country === country);
    setSelectedCountry(country);
    setSelectedRate(rate || null);
  };

  const calculateCost = (rate: Rate) => {
    // Add a higher markup for mobile vs landline
    const baseRate = rate.rate;
    const mobileRate = baseRate * 1.25; // Increased from 10% to 25% higher for mobile
    return callType === "mobile" ? mobileRate : baseRate;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rates...</p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Calculate Your Call Cost"
      description="Check our competitive international calling rates"
      icon={Calculator}
    >
      <div className="text-center mb-12">
        <Link href="/rates/all">
          <Button className="inline-flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>View All {rates.length}+ Countries & Rates</span>
          </Button>
        </Link>
      </div>

      {/* Enterprise Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span className="text-gray-900 font-medium">Need Yadaphone for your team?</span>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium">
          Enterprise Plans
        </Button>
      </div>

      {/* Main Calculator */}
      <Card>
        <div className="p-6 lg:p-8">
          <div className="max-w-3xl mx-auto">
            
            {/* Calculator Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Country Selection */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Country
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCountry}
                      onChange={(e) => handleCountrySelect(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                    >
                      {rates.map((rate) => (
                        <option key={rate.id} value={rate.country}>
                          {rate.flag || "🌍"} {rate.country}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Call Type Buttons */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Phone Type
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCallType("landline")}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                        callType === "landline"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Phone className="h-4 w-4" />
                      <span>Landline</span>
                    </button>
                    <button
                      onClick={() => setCallType("mobile")}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                        callType === "mobile"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Smartphone className="h-4 w-4" />
                      <span>Mobile</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Rate Display */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 text-center border border-blue-100">
                <div className="mb-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    ${selectedRate ? calculateCost(selectedRate).toFixed(3) : "0.000"}
                  </div>
                  <div className="text-sm text-gray-600">per minute</div>
                </div>
                
                {/* Duration Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2">
                    <input
                      type="number"
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      min="1"
                    />
                    <span className="text-sm text-gray-600">min</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    ${selectedRate ? (calculateCost(selectedRate) * estimatedMinutes).toFixed(2) : "0.00"}
                  </div>
                </div>
                
                <Link 
                  href="/dashboard/dialer"
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors inline-flex items-center justify-center space-x-2"
                >
                  <span className="text-lg">
                    {selectedRate?.flag || "🌍"}
                  </span>
                  <span>Start Call</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* FAQ Section */}
      <Card className="mt-8">
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <HelpCircle className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How are international rates determined?
              </h3>
              <p className="text-gray-600">
                International rates are based on carrier costs, network quality, and destination. 
                We negotiate the best rates possible to offer competitive pricing for our users.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Do rates change over time?
              </h3>
              <p className="text-gray-600">
                Yes, rates may change based on market conditions and carrier agreements. 
                We always display the current rates before you place any calls.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What's the difference between mobile and landline rates?
              </h3>
              <p className="text-gray-600">
                Mobile rates are typically slightly higher than landline rates due to network costs. 
                The difference is usually around 10-15% depending on the destination country.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Are there any hidden fees?
              </h3>
              <p className="text-gray-600">
                No hidden fees! The rates shown are exactly what you pay per minute. 
                You only pay for the duration of your successful calls.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
}