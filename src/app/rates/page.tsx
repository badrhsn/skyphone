"use client";

import { useState, useEffect, Suspense } from "react";
import { Phone, Globe, HelpCircle, Calculator, Smartphone, ChevronDown, Headphones } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button } from "../../components/PageLayout";

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

function RatesContent() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("United States");
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  const [callType, setCallType] = useState<"mobile" | "landline">("mobile");
  const [isLoading, setIsLoading] = useState(true);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(5);
  const [callerIdCountry, setCallerIdCountry] = useState<string>("US");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#00aff0' }}></div>
          <p className="mt-4 text-gray-600">Loading rates...</p>
        </div>
      </div>
    );
  }

      return (
        <div className="min-h-screen bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <Calculator className="h-6 w-6 text-[#00aff0]" />
            <h1 className="text-2xl font-semibold text-gray-900">Calculate Your Call Cost</h1>
          </div>
          <p className="mt-4 text-gray-700">Check our competitive international calling rates</p>
        </div>

        <div className="text-center mb-6">
          <Link href="/rates/all">
            <button
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white font-extrabold text-base px-6 py-3 rounded-full shadow-md hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-[#00aff0] focus:ring-offset-2"
              style={{ minWidth: 0 }}
            >
              <Globe className="h-5 w-5 text-white" />
              <span>View All Countries & Rates</span>
            </button>
          </Link>
        </div>

        {/* Enterprise Banner - match Add Credits style */}
        <div className="mt-4 p-4 rounded-lg border border-dashed flex items-center justify-between mb-8" style={{ borderColor: '#cfeeff', backgroundColor: '#f5fbff' }}>
          <div className="text-gray-700">Need Yadaphone for your team?</div>
          <Link href="/dashboard/enterprise" className="inline-flex items-center text-white px-4 py-2 rounded-full font-semibold" style={{ backgroundColor: '#00aff0' }}>
            See enterprise plans
          </Link>
        </div>

        {/* Main Calculator */}
  <div className="rounded-2xl border border-[#e6fbff] bg-white p-4 sm:p-6 max-w-3xl mx-auto">
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-700 mb-1 block">Select Country</label>
            <div className="relative">
              <select
                value={selectedCountry}
                onChange={(e) => handleCountrySelect(e.target.value)}
                className="w-full border border-[#e6fbff] rounded-xl px-3 py-2 text-sm bg-white focus:border-[#00aff0] focus:ring-1 focus:ring-[#00aff0] appearance-none cursor-pointer"
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
          <div className="mb-3">
            <label className="text-xs font-medium text-gray-700 mb-1 block">Phone Type</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setCallType("landline")}
                className={`flex-1 px-2 py-2 rounded-xl font-medium text-xs transition-colors flex items-center justify-center space-x-1 ${
                  callType === "landline"
                    ? "bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white"
                    : "bg-white border border-[#e6fbff] text-gray-900 hover:bg-[#f3fbff]"
                }`}
              >
                <Phone className="h-3 w-3 text-[#00aff0]" />
                <span>Landline</span>
              </button>
              <button
                onClick={() => setCallType("mobile")}
                className={`flex-1 px-2 py-2 rounded-xl font-medium text-xs transition-colors flex items-center justify-center space-x-1 ${
                  callType === "mobile"
                    ? "bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white"
                    : "bg-white border border-[#e6fbff] text-gray-900 hover:bg-[#f3fbff]"
                }`}
              >
                <Smartphone className="h-3 w-3 text-[#00aff0]" />
                <span>Mobile</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 mb-2">
            <div className="text-xs text-gray-500">Per minute</div>
            <div className="text-xl font-bold text-blue-600">${selectedRate ? calculateCost(selectedRate).toFixed(3) : "0.000"}</div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-500">Minutes</label>
            <input
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-1 border border-[#e6fbff] rounded text-center text-xs focus:border-[#00aff0] focus:ring-1 focus:ring-[#00aff0]"
              min="1"
            />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-base font-semibold text-blue-600">${selectedRate ? (calculateCost(selectedRate) * estimatedMinutes).toFixed(2) : "0.00"}</div>
          </div>
          <Link
            href="/dashboard/dialer"
            className="w-full bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white py-2 rounded-xl text-sm font-semibold transition-colors inline-flex items-center justify-center space-x-2"
          >
            <span className="inline-flex items-center justify-center bg-[#f3fbff] rounded-full w-6 h-6">
              <span className="text-[#00aff0] text-base">{selectedRate?.flag || "🌍"}</span>
            </span>
            <span>Start Call</span>
          </Link>
        </div>
          </div>
        

            {/* FAQ Section - Soft Panel Style */}
            <div className="max-w-3xl mx-auto mt-12 mb-16 bg-[#f7fbff] rounded-3xl px-8 py-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
              <div className="space-y-8">
                {[{
                  q: "How are international rates determined?",
                  a: "International rates are based on carrier costs, network quality, and destination. We negotiate the best rates possible to offer competitive pricing for our users."
                }, {
                  q: "Do rates change over time?",
                  a: "Yes, rates may change based on market conditions and carrier agreements. We always display the current rates before you place any calls."
                }, {
                  q: "What's the difference between mobile and landline rates?",
                  a: "Mobile rates are typically slightly higher than landline rates due to network costs. The difference is usually around 10-15% depending on the destination country."
                }, {
                  q: "Are there any hidden fees?",
                  a: "No hidden fees! The rates shown are exactly what you pay per minute. You only pay for the duration of your successful calls."
                }].map((item, idx) => (
                  <div key={idx}>
                    <div className="font-semibold text-base text-gray-900 mb-1">{item.q}</div>
                    <div className="text-gray-600 text-sm leading-relaxed">{item.a}</div>
                  </div>
                ))}
              </div>
            </div>
        </div>
      );
}

export default function RatesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#00aff0' }}></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <RatesContent />
    </Suspense>
  );
}