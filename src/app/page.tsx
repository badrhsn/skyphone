"use client";

import { 
  Phone, CheckCircle, ArrowRight, Globe, Shield, Star, CreditCard, User, Building, MessageSquare, 
  Zap, HeadphonesIcon, Plus, X, ChevronDown, Clock, DollarSign, Users, Mic, Settings,
  Smartphone, FileText, BarChart3, Headphones, Lock, Radio, Eye
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Rate {
  id: string;
  country: string;
  countryCode: string;
  mobileRate: number;
  landlineRate: number;
  isActive: boolean;
}

// Dialer Component
function PhoneDialer() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState({ name: "United States", flag: "🇺🇸", code: "+1" });
  const [isDialing, setIsDialing] = useState(false);
  const [callStatus, setCallStatus] = useState<"idle" | "dialing" | "connected" | "ended">("idle");
  const [userBalance, setUserBalance] = useState<number>(0);
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countries, setCountries] = useState<{ name: string; flag: string; code: string }[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session && status === "authenticated") {
      fetchUserBalance();
    }
  }, [session, status]);

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

  // Fetch countries from API
  useEffect(() => {
    fetchCountries();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside the country dropdown
      if (showCountryDropdown && !target.closest('[data-country-dropdown]')) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCountryDropdown]);

  const fetchCountries = async () => {
    setIsLoadingCountries(true);
    try {
      const response = await fetch("/api/rates");
      if (response.ok) {
        const data = await response.json();
        
        // Create countries from rates using flags from database
        const uniqueCountries = new Map<string, { name: string; flag: string; code: string }>();
        data.forEach((rate: any) => {
          if (!uniqueCountries.has(rate.country)) {
            const flag = rate.flag || "�"; // Use flag from database, fallback to earth emoji
            uniqueCountries.set(rate.country, {
              name: rate.country,
              flag: flag,
              code: rate.countryCode
            });
          }
        });
        
        const countriesArray = Array.from(uniqueCountries.values()).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        if (countriesArray.length > 0) {
          setCountries(countriesArray);
        }
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  const dialerButtons = [
    { number: "1", letters: "" },
    { number: "2", letters: "ABC" },
    { number: "3", letters: "DEF" },
    { number: "4", letters: "GHI" },
    { number: "5", letters: "JKL" },
    { number: "6", letters: "MNO" },
    { number: "7", letters: "PQRS" },
    { number: "8", letters: "TUV" },
    { number: "9", letters: "WXYZ" },
    { number: "*", letters: "" },
    { number: "0", letters: "+" },
    { number: "#", letters: "" }
  ];

  const addDigit = (digit: string) => {
    if (callStatus === "idle") {
      setPhoneNumber(prev => prev + digit);
    }
  };

  const clearNumber = () => {
    if (callStatus === "idle") {
      setPhoneNumber("");
    }
  };

  const deleteLastDigit = () => {
    if (callStatus === "idle") {
      setPhoneNumber(prev => prev.slice(0, -1));
    }
  };

  const handleCountryChange = (country: typeof countries[0]) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    setCountrySearch('');
  };

  const startCall = async () => {
    if (!phoneNumber || callStatus !== "idle") return;
    
    setIsDialing(true);
    setCallStatus("dialing");
    
    try {
      const response = await fetch("/api/calls/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: `${selectedCountry.code}${phoneNumber}`,
          from: "+1234567890", // Default caller ID
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Simulate call connection for demo
        setTimeout(() => {
          setCallStatus("connected");
          setIsDialing(false);
        }, 2000);
        
        // Refresh balance after call
        fetchUserBalance();
      } else {
        setCallStatus("idle");
        setIsDialing(false);
        alert(data.error || "Failed to initiate call");
      }
    } catch (error) {
      setCallStatus("idle");
      setIsDialing(false);
      alert("Failed to initiate call");
      console.error("Call initiation error:", error);
    }
  };

  const endCall = () => {
    setCallStatus("ended");
    setTimeout(() => {
      setCallStatus("idle");
      setPhoneNumber("");
    }, 1000);
  };

  return (
    <div className="bg-blue-50 rounded-3xl p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-md shadow-2xl border border-blue-200 backdrop-blur-lg">
      {/* Balance */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 bg-white/60 rounded-2xl p-3 sm:p-4 shadow-lg backdrop-blur-sm">
        <span className="text-xs sm:text-sm text-gray-600 font-medium">Balance:</span>
        <div className="flex items-center space-x-2">
          <span className="text-lg sm:text-xl font-bold text-gray-800">
            ${session ? userBalance.toFixed(2) : "0.00"}
          </span>
          <Link href="/dashboard/add-credits">
            <button className="bg-blue-500 text-white rounded-full p-1.5 sm:p-2 hover:bg-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* Integrated Country Selector and Phone Input */}
      <div className="mb-3 sm:mb-4 relative">
        <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
          {/* Country Selector Button */}
          <button
            type="button"
            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
            className="flex items-center space-x-2 px-3 sm:px-4 py-3 sm:py-4 bg-blue-50 hover:bg-blue-100 transition-colors border-r border-gray-200"
            disabled={callStatus !== "idle"}
            data-country-dropdown="button"
          >
            <span className="text-xl sm:text-2xl">{selectedCountry.flag}</span>
            <span className="text-sm sm:text-base font-bold text-gray-700">{selectedCountry.code}</span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          {/* Phone Number Input */}
          <input 
            type="tel" 
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Enter phone number"
            className="flex-1 border-0 outline-none bg-transparent text-lg sm:text-xl font-mono text-gray-800 placeholder-gray-400"
            disabled={callStatus !== "idle"}
          />

          {/* Clear Button */}
          {phoneNumber && (
            <button
              type="button"
              onClick={() => setPhoneNumber("")}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              disabled={callStatus !== "idle"}
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Country Dropdown */}
        {showCountryDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-72 overflow-hidden z-50" data-country-dropdown="menu">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search countries..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            
            {/* Countries List */}
            <div className="max-h-48 overflow-y-auto">
              {isLoadingCountries ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading countries...</span>
                </div>
              ) : countries.length === 0 ? (
                <div className="px-3 py-4 text-gray-500 text-sm text-center">
                  No countries available
                </div>
              ) : (
                countries
                  .filter(country => 
                    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                    country.code.toLowerCase().includes(countrySearch.toLowerCase())
                  )
                  .map((country) => (
                    <button
                      key={country.code + country.name}
                      onClick={() => handleCountryChange(country)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left ${
                        selectedCountry.code === country.code ? "bg-blue-100 text-blue-700" : "text-gray-700"
                      }`}
                    >
                      <span className="text-xl">{country.flag}</span>
                      <span className="font-medium flex-1">{country.name}</span>
                      <span className="text-blue-600 font-bold">{country.code}</span>
                    </button>
                  ))
              )}
              {!isLoadingCountries && countries.filter(country => 
                country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                country.code.toLowerCase().includes(countrySearch.toLowerCase())
              ).length === 0 && countrySearch && (
                <div className="px-3 py-4 text-gray-500 text-sm text-center">
                  No countries found for "{countrySearch}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Contact Button */}
      <Link href="/dashboard/contacts">
        <button 
          className="w-full mb-4 sm:mb-6 text-xs sm:text-sm text-blue-600 font-medium bg-white/60 backdrop-blur-sm rounded-2xl py-2.5 sm:py-3 hover:bg-white/80 transition-all duration-300 shadow-lg disabled:opacity-50"
          disabled={callStatus !== "idle"}
        >
          👤 Add contact
        </button>
      </Link>

      {/* Call Status Display */}
      {callStatus !== "idle" && (
        <div className="mb-6 text-center">
          <div className={`text-lg font-semibold ${
            callStatus === "dialing" ? "text-yellow-600" :
            callStatus === "connected" ? "text-green-600" :
            "text-red-600"
          }`}>
            {callStatus === "dialing" && "Connecting..."}
            {callStatus === "connected" && "Connected"}
            {callStatus === "ended" && "Call Ended"}
          </div>
          {callStatus === "connected" && (
            <div className="text-sm text-gray-600 mt-1">
              {selectedCountry.code} {phoneNumber}
            </div>
          )}
        </div>
      )}

      {/* Dialer Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-5 mb-6 sm:mb-8">
        {dialerButtons.map((button) => (
          <button
            key={button.number}
            onClick={() => addDigit(button.number)}
            className="bg-white/90 backdrop-blur-sm rounded-full w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 flex flex-col items-center justify-center hover:bg-white hover:scale-105 shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 border border-white/20 touch-manipulation"
            disabled={callStatus !== "idle"}
          >
            <div className="text-2xl sm:text-2xl md:text-3xl font-light text-gray-800">{button.number}</div>
            {button.letters && (
              <div className="text-xs text-gray-500 font-medium mt-0.5 tracking-wide">{button.letters}</div>
            )}
          </button>
        ))}
      </div>

      {/* Call Actions */}
      <div className="flex items-center justify-center space-x-4 sm:space-x-6">
        {callStatus === "idle" && (
          <>
            <div className="text-center flex-1">
              <span className="text-sm sm:text-lg text-gray-700 font-mono">
                {phoneNumber ? `${selectedCountry.code} ${phoneNumber}` : "Enter number"}
              </span>
            </div>
            <button 
              onClick={startCall}
              disabled={!phoneNumber}
              className="bg-green-500 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center hover:bg-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-green-200 hover:scale-110 active:scale-95 touch-manipulation"
            >
              <Phone className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
            <button 
              onClick={clearNumber} 
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50 w-10 h-10 sm:w-12 sm:h-12 rounded-full hover:bg-white/50 flex items-center justify-center transition-all duration-200 touch-manipulation"
              disabled={!phoneNumber}
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </>
        )}
        
        {(callStatus === "dialing" || callStatus === "connected") && (
          <button 
            onClick={endCall}
            className="bg-red-500 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center hover:bg-red-600 transition-all duration-300 shadow-2xl hover:shadow-red-200 hover:scale-110 active:scale-95 touch-manipulation"
          >
            <Phone className="h-6 w-6 sm:h-7 sm:w-7 rotate-[135deg]" />
          </button>
        )}
        
        {callStatus === "ended" && (
          <div className="text-center text-gray-500 bg-white/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-lg">
            <div className="text-base sm:text-lg font-medium">Call completed</div>
            <div className="text-xs sm:text-sm">Duration: 1m 23s</div>
          </div>
        )}
      </div>

      {/* Call Cost Display */}
      {phoneNumber && callStatus === "idle" && (
        <div className="mt-6 text-center p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100">
          <div className="text-sm text-gray-600 font-medium">Estimated cost:</div>
          <div className="text-xl font-bold text-blue-600">$0.02/min</div>
        </div>
      )}
    </div>
  );
}

// Rate Calculator Component
function RateCalculator() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("United States");
  const [callType, setCallType] = useState<"mobile" | "landline">("mobile");
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState<number>(5); // minutes
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const { data: session, status } = useSession();

  // Helper function to get the correct redirect URL based on auth status
  const getCallUrl = () => {
    if (status === "loading") return "#";
    return session ? "/dashboard/dialer" : "/auth/signup";
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await fetch("/api/rates");
      if (response.ok) {
        const data = await response.json();
        setRates(data);
        if (data.length > 0) {
          const usRate = data.find((r: Rate) => r.country === "United States") || data[0];
          setSelectedCountry(usRate.country);
        }
      }
    } catch (error) {
      console.error("Error fetching rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedRate = rates.find(r => r.country === selectedCountry);
  const currentRate = selectedRate 
    ? (callType === "mobile" ? selectedRate.mobileRate : selectedRate.landlineRate) 
    : 0.02;

  const totalCost = currentRate * duration;

  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      "United States": "🇺🇸",
      "United Kingdom": "🇬🇧", 
      "Germany": "🇩🇪",
      "France": "🇫🇷",
      "Canada": "🇨🇦",
      "Australia": "🇦🇺",
      "Japan": "🇯🇵",
      "India": "🇮🇳",
      "China": "🇨🇳",
      "Brazil": "🇧🇷"
    };
    return flags[country] || "🌍";
  };

  const popularCountries = rates.slice(0, 8);
  const availableCountries = rates.length > 0 ? rates.slice(0, 20) : [
    { id: "1", country: "United States", countryCode: "US", mobileRate: 0.02, landlineRate: 0.015, isActive: true },
    { id: "2", country: "United Kingdom", countryCode: "GB", mobileRate: 0.03, landlineRate: 0.025, isActive: true },
    { id: "3", country: "Germany", countryCode: "DE", mobileRate: 0.04, landlineRate: 0.03, isActive: true },
  ];

  return (
    <div className="bg-blue-50 rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl border border-blue-200">
      <div className="text-center mb-4 sm:mb-6">
        <p className="text-sm sm:text-base text-gray-600 mb-2">Need Yadaphone for the team?</p>
        <button 
          onClick={() => setShowEnterpriseModal(true)}
          className="bg-blue-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-blue-600 transition-colors"
        >
          See enterprise plans
        </button>
      </div>

      {/* Quick Country Selection */}
      <div className="mb-4 sm:mb-6">
        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Popular destinations:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {popularCountries.slice(0, 4).map((rate) => (
            <button
              key={rate.id}
              onClick={() => setSelectedCountry(rate.country)}
              className={`text-xs p-2 rounded-lg border transition-colors ${
                selectedCountry === rate.country
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
              }`}
            >
              <div>{getCountryFlag(rate.country)}</div>
              <div className="mt-1">{rate.country.split(' ')[0]}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
        <span className="text-base sm:text-lg font-medium text-gray-700">I'm calling</span>
        <select 
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="w-full sm:w-auto border border-blue-300 rounded-lg px-3 sm:px-4 py-2 bg-white text-gray-800 focus:border-blue-500 outline-none text-sm sm:text-base"
        >
          {availableCountries.map((rate) => (
            <option key={rate.id} value={rate.country}>
              {getCountryFlag(rate.country)} {rate.country}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-center space-x-4 mb-6">
        <button 
          onClick={() => setCallType("mobile")}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            callType === "mobile" 
              ? "bg-blue-500 text-white" 
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          📱 Mobile
        </button>
        <button 
          onClick={() => setCallType("landline")}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            callType === "landline" 
              ? "bg-blue-500 text-white" 
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          📞 Landline
        </button>
      </div>

      {/* Duration Slider */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Call duration: {duration} minute{duration !== 1 ? 's' : ''}
        </label>
        <input
          type="range"
          min="1"
          max="60"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 min</span>
          <span>60 min</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 text-center shadow-2xl border border-gray-100">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gray-600 text-sm">Rate per minute</p>
            <p className="text-2xl font-bold text-gray-800">
              ${typeof currentRate === 'number' ? currentRate.toFixed(3) : '0.020'}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Total cost</p>
            <p className="text-2xl font-bold text-blue-600">
              ${totalCost.toFixed(2)}
            </p>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 mb-4">
          {duration} minute{duration !== 1 ? 's' : ''} to {getCountryFlag(selectedCountry)} {selectedCountry}
        </div>
        
        <Link href={getCallUrl()} className="bg-blue-500 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-blue-600 transition-all duration-300 block shadow-lg hover:shadow-xl hover:scale-105">
          Call {getCountryFlag(selectedCountry)} {selectedCountry} now
        </Link>
      </div>

      {/* Comparison with traditional carriers */}
      <div className="mt-4 text-center p-3 bg-blue-100 rounded-lg shadow-md">
        <div className="text-sm text-gray-600">vs. traditional carrier:</div>
        <div className="text-lg font-bold text-green-600">
          Save ${((totalCost * 3) - totalCost).toFixed(2)} ({Math.round(66)}% less)
        </div>
      </div>

      {/* Enterprise Modal */}
      {showEnterpriseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise Plans</h3>
            <div className="space-y-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                <h4 className="font-semibold text-gray-900">Team Plan</h4>
                <p className="text-gray-600 text-sm">Up to 50 users</p>
                <p className="text-2xl font-bold text-blue-600">$99/month</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900">Enterprise Plan</h4>
                <p className="text-gray-600 text-sm">Unlimited users</p>
                <p className="text-2xl font-bold text-blue-600">Custom pricing</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowEnterpriseModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <Link href="/contact" className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-center">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session, status } = useSession();

  // Helper function to get the correct redirect URL based on auth status
  const getCallUrl = () => {
    if (status === "loading") return "#";
    return session ? "/dashboard/dialer" : "/auth/signup";
  };

  const faqItems = [
    {
      question: "How does browser-based calling work?",
      answer: "Our service uses WebRTC technology to enable high-quality voice calls directly from your browser without requiring any downloads or installations.",
      category: "technical"
    },
    {
      question: "Does Yadaphone support inbound calls?", 
      answer: "Yes, you can receive calls on your virtual numbers and forward them to any device.",
      category: "features"
    },
    {
      question: "Do you support SMS?",
      answer: "Currently we focus on voice calling, but SMS features are in development.",
      category: "features"
    },
    {
      question: "Do you have a referral program?",
      answer: "Yes, refer friends and earn calling credits when they sign up and make their first call.",
      category: "billing"
    },
    {
      question: "How do you stay competitive?",
      answer: "We maintain competitive rates through efficient routing and partnerships with global carriers.",
      category: "business"
    },
    {
      question: "Why can't I just use Google Voice?",
      answer: "Google Voice is limited to US numbers and has restrictions. We offer global coverage with no geographic limitations.",
      category: "comparison"
    },
    {
      question: "Why can't I use WhatsApp for free?",
      answer: "WhatsApp requires both parties to have the app and internet. We connect to any phone number worldwide.",
      category: "comparison"
    },
    {
      question: "Do you require phone number or ID authentication?",
      answer: "No phone verification required. Sign up with just your email and start calling immediately.",
      category: "account"
    },
    {
      question: "Do I need to buy a subscription?",
      answer: "No subscriptions required. Pay only for what you use with our flexible credit system.",
      category: "billing"
    },
    {
      question: "What are the rates for international calls?",
      answer: "Rates vary by destination. Check our rates page for specific pricing to any country.",
      category: "billing"
    }
  ];

  const filteredFaqItems = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
      
      <div className="min-h-screen bg-white">
      {/* Hero Section with Dialer */}
      <div className="bg-blue-50 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between lg:items-start gap-8 lg:gap-12">
            {/* Content Section - Left on desktop, below dialer on mobile */}
            <div className="text-center lg:text-left max-w-2xl lg:flex-1 order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                <span className="text-blue-600">Cheap</span><br />
                <span className="text-blue-600">International</span><br />
                <span className="text-blue-600">Calls In Your</span><br />
                <span className="text-blue-600">Browser</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-lg lg:max-w-none mx-auto lg:mx-0">
                Call clients, banks, government offices, or any number worldwide. Pay only for what you use. No contracts or hidden fees.
              </p>
              
              <div className="space-y-4 mb-6 sm:mb-8">
                <Link 
                  href={getCallUrl()}
                  className="inline-flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-blue-700 transition-all w-full sm:w-auto"
                >
                  <Phone className="h-5 w-5" />
                  <span>{session ? "Start Calling" : "Call anyone in 🏴󠁧󠁢󠁥󠁮󠁧󠁿"} →</span>
                </Link>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p>From only 0.02 USD per minute!</p>
                  <p>First call is <span className="font-semibold">FREE</span></p>
                  <div className="flex items-center justify-center lg:justify-start space-x-2 text-blue-600">
                    <span className="bg-blue-100 px-2 py-1 rounded text-xs">💡</span>
                    <span>50% cheaper than your carrier</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Dialer Section - Right on desktop, top on mobile */}
            <div className="flex justify-center lg:justify-end lg:flex-1 order-1 lg:order-2">
              <PhoneDialer />
            </div>
          </div>
        </div>
      </div>

      {/* 3 Steps Section */}
      <div className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How to Make International Calls in 3 Simple Steps
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-blue-50 rounded-3xl p-8 text-center">
              <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Sign Up</h3>
              <p className="text-gray-600 mb-6">Sign up in seconds with just your email - no phone verification needed</p>
              
              <div className="space-y-3 text-sm text-left">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-600">No authentication required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-600">No phone numbers required</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-3xl p-8 text-center">
              <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add Credits</h3>
              <p className="text-gray-600 mb-6">Purchase credits and only pay for the minutes you actually use</p>
              
              <div className="space-y-3 text-sm text-left">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-600">No subscriptions or recurring fees</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-600">Pay only for minutes you use</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-3xl p-8 text-center">
              <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Call Anywhere</h3>
              <p className="text-gray-600 mb-6">Call any landline or institution worldwide directly from your browser</p>
              
              <div className="space-y-3 text-sm text-left">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-600">Available in all countries</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-600">Calls routed through a secure system</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Link 
              href={getCallUrl()} 
              className="bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              {session ? "Go to Dialer" : "Get started"}
            </Link>
          </div>
        </div>
      </div>

      {/* Business Section */}
      <div className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Building className="h-8 w-8 text-blue-600" />
              <h2 className="text-4xl font-bold text-blue-600">Yadaphone for business</h2>
            </div>
            <p className="text-lg text-gray-600">Cheap calls to 180+ countries from browser</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-blue-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Record calls</h3>
              </div>
              <p className="text-gray-600">and access AI transcripts</p>
            </div>
            
            <div className="bg-blue-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Add free unlimited members</h3>
              </div>
              <p className="text-gray-600">in one account and one corporate wallet</p>
            </div>
            
            <div className="bg-blue-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Get priority support</h3>
              </div>
              <p className="text-gray-600">we're just a message away — 24/7</p>
            </div>
            
            <div className="bg-blue-100 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Customize your setup</h3>
              </div>
              <p className="text-gray-600">with features your business needs</p>
            </div>
          </div>
          
          <div className="text-center">
            <button className="bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
              See enterprise plans
            </button>
          </div>
        </div>
      </div>

      {/* See It In Action Section */}
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">See It In Action</h2>
          <p className="text-lg text-gray-600 mb-8">
            Watch the demo video to see how Yadaphone works and make international calls directly from your browser.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Yadaphone for International Calls?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-100 hover:scale-105">
              <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mb-6 flex items-center justify-center shadow-lg">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Call Anywhere, From Anywhere</h3>
              <p className="text-gray-600 mb-6">Make international calls to any country without restrictions, directly from your browser</p>
              <Link href="#" className="text-blue-500 font-medium hover:text-blue-600">
                Visit Free Caller Registry ↗
              </Link>
            </div>
            
            <div className="bg-blue-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-100 hover:scale-105">
              <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mb-6 flex items-center justify-center shadow-lg">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">No Country Restrictions</h3>
              <p className="text-gray-600">Our service works globally, allowing you to connect with people and institutions worldwide</p>
            </div>
            
            <div className="bg-blue-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-100 hover:scale-105">
              <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mb-6 flex items-center justify-center shadow-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">No Apps or Subscriptions</h3>
              <p className="text-gray-600">Start calling in 2 minutes directly from your browser without installing any apps or committing to subscriptions</p>
            </div>
            
            <div className="bg-blue-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-100 hover:scale-105">
              <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mb-6 flex items-center justify-center shadow-lg">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Credit Based, No Subscription</h3>
              <p className="text-gray-600">Pay only for what you use with our flexible credit system - no recurring fees or contracts</p>
            </div>
            
            <div className="bg-blue-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-100 hover:scale-105">
              <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mb-6 flex items-center justify-center shadow-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Buy Phone Numbers</h3>
              <p className="text-gray-600">Purchase virtual phone numbers from various countries</p>
            </div>
            
            <div className="bg-blue-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-100 hover:scale-105">
              <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mb-6 flex items-center justify-center shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Custom Caller ID</h3>
              <p className="text-gray-600">Set your own caller ID for outgoing calls</p>
            </div>
            
            <div className="bg-blue-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-100 hover:scale-105">
              <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mb-6 flex items-center justify-center shadow-lg">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Secure and Private</h3>
              <p className="text-gray-600 mb-6">All calls are encrypted and your data is protected</p>
              <Link href="#" className="text-blue-500 font-medium hover:text-blue-600">
                Learn about privacy ↗
              </Link>
            </div>
            
            <div className="bg-blue-50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-100 hover:scale-105">
              <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mb-6 flex items-center justify-center shadow-lg">
                <Radio className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Receive Calls In Browser</h3>
              <p className="text-gray-600">Accept incoming calls directly in your browser</p>
            </div>
          </div>
        </div>
      </div>

      {/* Explore Yadaphone CTA */}
      <div className="py-20 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Explore Yadaphone</h2>
          <p className="text-lg text-gray-600 mb-8">Test our features with a free account.</p>
          
          <Link 
            href={getCallUrl()} 
            className="bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            {session ? "Go to Dialer" : "Get started"}
          </Link>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Ready to make your first call?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              See the simplicity of browser-based calling with crystal-clear audio quality and affordable international rates yourself.
            </p>
            <Link 
              href={getCallUrl()} 
              className="bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              {session ? "Start Calling" : "Start calling"}
            </Link>
          </div>

          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-8">Why Choose Yadaphone?</h3>
          </div>
          
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Features</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-blue-600">Yadaphone</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Google Voice</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">Viber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">Browser-Based</div>
                        <div className="text-sm text-gray-500">Make calls directly from your web browser, no apps required</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-6 w-6 text-blue-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-6 w-6 text-blue-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-6 w-6 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">No Phone Authentication Required</div>
                        <div className="text-sm text-gray-500">Start calling immediately without verifying your phone number</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-6 w-6 text-blue-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-6 w-6 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-6 w-6 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">Global Coverage</div>
                        <div className="text-sm text-gray-500">Call any country worldwide without restrictions</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-6 w-6 text-blue-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-6 w-6 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-6 w-6 text-blue-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">Instant Setup</div>
                        <div className="text-sm text-gray-500">No waiting time or verification process</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-6 w-6 text-blue-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-6 w-6 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-6 w-6 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">No Subscription Required</div>
                        <div className="text-sm text-gray-500">Pay only for what you use</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-6 w-6 text-blue-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-6 w-6 text-blue-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-6 w-6 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">Competitive Rates</div>
                        <div className="text-sm text-gray-500">Best-in-class pricing for international calls</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-6 w-6 text-blue-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-6 w-6 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-6 w-6 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">No Restrictions</div>
                        <div className="text-sm text-gray-500">No country or usage limitations</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CheckCircle className="h-6 w-6 text-blue-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-6 w-6 text-red-500 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="h-6 w-6 text-red-500 mx-auto" />
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">Pricing Model</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm font-medium text-blue-600">Pay-as-you-go with competitive rates</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-600">Free for US calls, international rates apply</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-600">Subscription + per-minute rates</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Ready to Experience Section */}
      <div className="py-20 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to experience the Yadaphone difference?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start making cheap international calls today with no setup, no subscriptions, and no restrictions.
          </p>
          
          <Link 
            href={getCallUrl()} 
            className="bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            {session ? "Go to Dialer" : "Try Yadaphone Now"}
          </Link>
        </div>
      </div>

      {/* Rate Calculator Section */}
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Calculate Your Call Cost
            </h2>
          </div>
          
          <RateCalculator />
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            
            {/* Search FAQ */}
            <div className="max-w-md mx-auto mb-8">
              <input
                type="text"
                placeholder="Search FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredFaqItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{item.question}</span>
                  <ChevronDown 
                    className={`h-5 w-5 text-gray-500 transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600">{item.answer}</p>
                    <div className="mt-2">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {item.category}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {filteredFaqItems.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              No questions found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-100 rounded-3xl p-8">
              <div className="mb-6">
                <Star className="h-8 w-8 text-blue-500 mb-4" />
                <p className="text-gray-700 italic">
                  "Yadaphone works great! The sound quality is better than the alternatives and much easier to use. Will be using from now on!"
                </p>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Nicolas P.</div>
                <div className="text-sm text-gray-600">Cyprus</div>
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-3xl p-8">
              <div className="mb-6">
                <Star className="h-8 w-8 text-blue-500 mb-4" />
                <p className="text-gray-700 italic">
                  "I use Yadaphone weekly to call my family abroad. It's much more affordable than my phone carrier's international rates."
                </p>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Miguel R.</div>
                <div className="text-sm text-gray-600">Canada</div>
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-3xl p-8">
              <div className="mb-6">
                <Star className="h-8 w-8 text-blue-500 mb-4" />
                <p className="text-gray-700 italic">
                  "I lost access to my bank while nomading in Southeast Asia. I stumbled upon Yadaphone, called my bank, and solved everything in no time!"
                </p>
              </div>
              <div>
                <div className="font-semibold text-gray-900">James M.</div>
                <div className="text-sm text-gray-600">United States</div>
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-3xl p-8">
              <div className="mb-6">
                <Star className="h-8 w-8 text-blue-500 mb-4" />
                <p className="text-gray-700 italic">
                  "I had to call the tax authorities in my base country from abroad. I've spent hours talking to the officials on Yadaphone and only spent a couple of dollars. Everything was perfect and it saved me a lot of nerves!"
                </p>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Thomas L.</div>
                <div className="text-sm text-gray-600">Germany</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
