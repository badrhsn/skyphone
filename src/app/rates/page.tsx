"use client";

import { useState, useEffect } from "react";
import { Phone, Search, Globe, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface Rate {
  id: string;
  country: string;
  countryCode: string;
  rate: number;
  currency: string;
  isActive: boolean;
}

const countryFlags: { [key: string]: string } = {
  "1": "🇺🇸", // US/Canada  
  "44": "🇬🇧", // UK
  "49": "🇩🇪", // Germany
  "33": "🇫🇷", // France
  "61": "🇦🇺", // Australia
  "81": "🇯🇵", // Japan
  "86": "🇨🇳", // China
  "91": "🇮🇳", // India
  "55": "🇧🇷", // Brazil
  "52": "🇲🇽", // Mexico
  "34": "🇪🇸", // Spain
  "39": "🇮🇹", // Italy
  "31": "🇳🇱", // Netherlands
  "46": "🇸🇪", // Sweden
  "47": "🇳🇴", // Norway
  "45": "🇩🇰", // Denmark
  "358": "🇫🇮", // Finland
  "48": "🇵🇱", // Poland
  "7": "🇷🇺", // Russia
  "82": "🇰🇷", // South Korea
  "65": "🇸🇬", // Singapore
  "66": "🇹🇭", // Thailand
  "60": "🇲🇾", // Malaysia
  "63": "🇵🇭", // Philippines
  "84": "🇻🇳", // Vietnam
  "62": "🇮🇩", // Indonesia
  "90": "🇹🇷", // Turkey
  "971": "🇦🇪", // UAE
  "966": "🇸🇦", // Saudi Arabia
  "27": "🇿🇦", // South Africa
  "20": "🇪🇬", // Egypt
  "234": "🇳🇬", // Nigeria
  "254": "🇰🇪", // Kenya
  "54": "🇦🇷", // Argentina
  "56": "🇨🇱", // Chile
  "57": "🇨🇴", // Colombia
  "51": "🇵🇪", // Peru
  "58": "🇻🇪", // Venezuela
};

export default function RatesPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("United States");
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  const [callType, setCallType] = useState<"mobile" | "landline">("mobile");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(5);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchRates();
  }, []);

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
      const response = await fetch("/api/rates");
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

  const filteredRates = rates.filter(rate =>
    rate.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rate.countryCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountrySelect = (country: string) => {
    const rate = rates.find(r => r.country === country);
    setSelectedCountry(country);
    setSelectedRate(rate || null);
  };

  const calculateCost = (rate: Rate) => {
    // Add a small markup for mobile vs landline
    const baseRate = rate.rate;
    const mobileRate = baseRate * 1.1; // 10% higher for mobile
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Calculate Your Call Cost
          </h1>
          <p className="text-lg text-gray-600">
            Check our competitive international calling rates
          </p>
        </div>

        {/* Enterprise Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-8 text-center">
          <p className="text-gray-700">
            Need Skyphone for the team?{" "}
            <button className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors">
              See enterprise plans
            </button>
          </p>
        </div>

        {/* Main Calculator */}
        <div className="bg-blue-50 rounded-3xl p-8 lg:p-12 mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Left - Country Selection */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-medium text-gray-700">I'm calling</span>
                  <div className="flex-1 relative">
                    <select
                      value={selectedCountry}
                      onChange={(e) => handleCountrySelect(e.target.value)}
                      className="w-full border border-blue-300 rounded-lg px-4 py-3 text-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 appearance-none cursor-pointer"
                    >
                      {rates.map((rate) => (
                        <option key={rate.id} value={rate.country}>
                          {countryFlags[rate.countryCode.replace("+", "")] || "🌍"} {rate.country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Call Type Selection */}
                <div className="space-y-3">
                  <span className="text-lg font-medium text-gray-700 block">To a</span>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setCallType("mobile")}
                      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                        callType === "mobile"
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      📱 Mobile
                    </button>
                    <button
                      onClick={() => setCallType("landline")}
                      className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                        callType === "landline"
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      📞 Landline
                    </button>
                  </div>
                </div>
              </div>

              {/* Right - Rate Display */}
              <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                <div className="mb-6">
                  <p className="text-gray-600 text-lg">Your call will cost</p>
                  <div className="text-4xl font-bold text-gray-800 mb-2">
                    ${selectedRate ? calculateCost(selectedRate).toFixed(3) : "0.000"}
                    <span className="text-lg font-normal text-gray-600 ml-2">per minute</span>
                  </div>
                  
                  {/* Estimated Cost Calculator */}
                  <div className="bg-blue-50 rounded-lg p-4 mt-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <input
                        type="number"
                        value={estimatedMinutes}
                        onChange={(e) => setEstimatedMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center font-medium"
                        min="1"
                      />
                      <span className="text-gray-600">minutes will cost</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${selectedRate ? (calculateCost(selectedRate) * estimatedMinutes).toFixed(2) : "0.00"}
                    </div>
                  </div>
                </div>
                
                <Link 
                  href="/dashboard/dialer"
                  className="bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-600 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <span>Call</span>
                  <span className="text-2xl">
                    {selectedRate ? countryFlags[selectedRate.countryCode.replace("+", "")] || "🌍" : "🌍"}
                  </span>
                  <span>{selectedCountry} now</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* All Rates Table */}
        <div className="bg-white rounded-3xl p-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
              All International Rates
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Country</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Code</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Mobile Rate</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Landline Rate</th>
                </tr>
              </thead>
              <tbody>
                {filteredRates.map((rate) => (
                  <tr 
                    key={rate.id} 
                    className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${
                      selectedCountry === rate.country ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleCountrySelect(rate.country)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{countryFlags[rate.countryCode.replace("+", "")] || "🌍"}</span>
                        <span className="font-medium text-gray-800">{rate.country}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">+{rate.countryCode.replace("+", "")}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-800">
                      ${(rate.rate * 1.1).toFixed(3)}/min
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-800">
                      ${rate.rate.toFixed(3)}/min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No countries found matching your search.
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-3xl p-8 shadow-lg mt-8">
          <div className="flex items-center space-x-3 mb-6">
            <HelpCircle className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-800">Frequently Asked Questions</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                How are international rates determined?
              </h3>
              <p className="text-gray-600">
                International rates are based on carrier costs, network quality, and destination. 
                We negotiate the best rates possible to offer competitive pricing for our users.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Do rates change over time?
              </h3>
              <p className="text-gray-600">
                Yes, rates may change based on market conditions and carrier agreements. 
                We always display the current rates before you place any calls.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                What's the difference between mobile and landline rates?
              </h3>
              <p className="text-gray-600">
                Mobile rates are typically slightly higher than landline rates due to network costs. 
                The difference is usually around 10-15% depending on the destination country.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Are there any hidden fees?
              </h3>
              <p className="text-gray-600">
                No hidden fees! The rates shown are exactly what you pay per minute. 
                You only pay for the duration of your successful calls.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}