"use client";

import { 
  Phone, CheckCircle, ArrowRight, Globe, Shield, Star, CreditCard, User, Building, MessageSquare, 
  Zap, HeadphonesIcon, Plus, X, ChevronDown, Clock, DollarSign, Users, Mic, Settings,
  Smartphone, FileText, BarChart3, Headphones, Lock, Radio, Eye
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useModal } from "@/components/Modal";

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
  const { showError, ModalComponent } = useModal();

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
        showError("Call Failed", data.error || "Failed to initiate call");
      }
    } catch (error) {
      setCallStatus("idle");
      setIsDialing(false);
      showError("Call Failed", "Failed to initiate call");
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
    <div className="bg-blue-50 rounded-3xl p-4 sm:p-6 md:p-8 max-w-sm sm:max-w-md border border-blue-200 backdrop-blur-lg">
      {/* Balance */}
  <div className="flex items-center justify-between mb-4 sm:mb-6 bg-white/60 rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
        <span className="text-xs sm:text-sm text-gray-600 font-medium">Balance:</span>
        <div className="flex items-center space-x-2">
          <span className="text-lg sm:text-xl font-bold text-gray-800">
            ${session ? userBalance.toFixed(2) : "0.00"}
          </span>
          <Link href="/dashboard/add-credits">
            <button className="bg-blue-500 text-white rounded-full p-1.5 sm:p-2 hover:bg-blue-600 transition-all duration-300">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* Integrated Country Selector and Phone Input */}
      <div className="mb-3 sm:mb-4 relative">
  <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
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
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 max-h-72 overflow-hidden z-50" data-country-dropdown="menu">
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
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#00aff0]"></div>
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
          className="w-full mb-4 sm:mb-6 text-xs sm:text-sm text-blue-600 font-medium bg-white/60 backdrop-blur-sm rounded-2xl py-2.5 sm:py-3 hover:bg-white/80 transition-all duration-300 disabled:opacity-50"
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
            className="bg-white/90 backdrop-blur-sm rounded-full w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 flex flex-col items-center justify-center hover:bg-white hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 border border-white/20 touch-manipulation"
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
              className="bg-green-500 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center hover:bg-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95 touch-manipulation"
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
            className="bg-red-500 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center hover:bg-red-600 transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation"
          >
            <Phone className="h-6 w-6 sm:h-7 sm:w-7 rotate-[135deg]" />
          </button>
        )}
        
        {callStatus === "ended" && (
          <div className="text-center text-gray-500 bg-white/80 backdrop-blur-sm rounded-2xl p-3 sm:p-4">
            <div className="text-base sm:text-lg font-medium">Call completed</div>
            <div className="text-xs sm:text-sm">Duration: 1m 23s</div>
          </div>
        )}
      </div>

      {/* Call Cost Display */}
      {phoneNumber && callStatus === "idle" && (
        <div className="mt-6 text-center p-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-blue-100">
          <div className="text-sm text-gray-600 font-medium">Estimated cost:</div>
          <div className="text-xl font-bold text-blue-600">$0.02/min</div>
        </div>
      )}
      
      {ModalComponent}
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
    : 0.04; // Updated from 0.02 to 0.04

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
        
        <Link href={getCallUrl()} className="bg-blue-500 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-blue-600 transition-all duration-300 block hover:scale-105">
          Call {getCountryFlag(selectedCountry)} {selectedCountry} now
        </Link>
      </div>

      {/* Comparison with traditional carriers */}
      <div className="mt-4 text-center p-3 bg-blue-100 rounded-lg">
        <div className="text-sm text-gray-600">vs. traditional carrier:</div>
        <div className="text-lg font-bold text-green-600">
          Save ${((totalCost * 3) - totalCost).toFixed(2)} ({Math.round(66)}% less)
        </div>
      </div>

      {/* Enterprise Modal */}
      {showEnterpriseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise Plans</h3>
              <div className="space-y-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4 transition-shadow">
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

      {/* 3 Steps Section - Redesigned */}
      <div className="py-16 sm:py-20 md:py-24 bg-white relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
              <span className="mr-2">✨</span>
              Get Started in Minutes
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              How to Make International Calls<br />
              <span className="text-blue-600">in 3 Simple Steps</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              No complex setup, no lengthy verification process. Start calling worldwide in under 2 minutes.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-16">
            {/* Step 1 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 text-center transform group-hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border border-blue-200/50">
                <div className="absolute -top-4 left-8 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                  1
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-xl">
                  <FileText className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Sign Up</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">Sign up in seconds with just your email - no phone verification needed</p>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 bg-white/60 rounded-xl p-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">No authentication required</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-white/60 rounded-xl p-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">No phone numbers required</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 text-center transform group-hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border border-blue-200/50">
                <div className="absolute -top-4 left-8 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                  2
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-xl">
                  <CreditCard className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Add Credits</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">Purchase credits and only pay for the minutes you actually use</p>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 bg-white/60 rounded-xl p-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">No subscriptions or recurring fees</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-white/60 rounded-xl p-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">Pay only for minutes you use</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 text-center transform group-hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl border border-blue-200/50">
                <div className="absolute -top-4 left-8 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                  3
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-xl">
                  <Phone className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Call Anywhere</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">Call any landline or institution worldwide directly from your browser</p>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 bg-white/60 rounded-xl p-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">Available in all countries</span>
                  </div>
                  <div className="flex items-center space-x-3 bg-white/60 rounded-xl p-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">Calls routed through a secure system</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Link 
              href={getCallUrl()} 
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-10 py-4 rounded-2xl text-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              <span>{session ? "Go to Dialer" : "Get started"}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Business Section - Redesigned */}
      <div className="py-20 md:py-24 bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16 md:mb-20">
            <div className="inline-flex items-center justify-center space-x-3 mb-6">
              <div className="bg-blue-500 rounded-full p-2 shadow-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-blue-600">Yadaphone for business</h2>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Scale your global communications with enterprise-grade features and unbeatable rates to 180+ countries
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-16">
            <div className="group bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-blue-200/50 hover:border-blue-300 transform hover:-translate-y-2">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Mic className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Record calls</h3>
                  <p className="text-gray-600">and access AI transcripts for better business insights and compliance</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-600 font-medium">
                <span>Learn more</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            
            <div className="group bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-blue-200/50 hover:border-blue-300 transform hover:-translate-y-2">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Add free unlimited members</h3>
                  <p className="text-gray-600">in one account and one corporate wallet for seamless team collaboration</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-600 font-medium">
                <span>Learn more</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            
            <div className="group bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-blue-200/50 hover:border-blue-300 transform hover:-translate-y-2">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Headphones className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Get priority support</h3>
                  <p className="text-gray-600">we're just a message away — 24/7 dedicated enterprise support</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-600 font-medium">
                <span>Learn more</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            
            <div className="group bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-blue-200/50 hover:border-blue-300 transform hover:-translate-y-2">
              <div className="flex items-start space-x-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Customize your setup</h3>
                  <p className="text-gray-600">with features your business needs including API integration and custom branding</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-600 font-medium">
                <span>Learn more</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4">
              <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-10 py-4 rounded-2xl text-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105">
                See enterprise plans
              </button>
              <span className="text-gray-500 text-sm">or</span>
              <Link href="/contact" className="text-blue-600 font-semibold hover:text-blue-700 underline underline-offset-4">
                Contact our sales team
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* See It In Action Section - Redesigned */}
      <div className="py-20 md:py-24 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #3b82f6 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
              <Eye className="h-4 w-4 mr-2" />
              Live Demo
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              See It In <span className="text-blue-600">Action</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Watch how Yadaphone works and see real international calls being made directly from your browser with crystal-clear quality.
            </p>
          </div>
          
          {/* Video Preview Placeholder */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl p-8 md:p-12 shadow-2xl border border-blue-300/50">
              <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg">
                <div className="flex items-center justify-center space-x-4 mb-8">
                  <div className="bg-blue-500 rounded-full p-4 shadow-lg">
                    <Phone className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-gray-900">Live International Call Demo</h3>
                    <p className="text-gray-600">See the call quality and ease of use</p>
                  </div>
                </div>
                
                {/* Demo Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 rounded-full p-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Crystal Clear Audio</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 rounded-full p-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Instant Connection</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 rounded-full p-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">No Downloads</span>
                  </div>
                </div>
                
                {/* Play Button */}
                <div className="relative">
                  <div className="bg-gray-100 rounded-2xl h-64 md:h-80 flex items-center justify-center group cursor-pointer hover:bg-gray-200 transition-colors">
                    <div className="bg-blue-500 rounded-full p-6 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                      <svg className="h-12 w-12 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-lg px-4 py-2 shadow-lg transform translate-y-8">
                      <span className="text-sm font-medium text-gray-700">▶ Watch Demo Video</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid - Redesigned */}
      <div className="py-20 md:py-24 bg-gradient-to-br from-gray-50 to-blue-50/50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-10 w-20 h-20 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-bounce"></div>
          <div className="absolute top-3/4 right-10 w-32 h-32 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-bounce delay-1000"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16 md:mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
              <Star className="h-4 w-4 mr-2" />
              Premium Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Why Choose <span className="text-blue-600">Yadaphone</span><br />
              for International Calls?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the next generation of international calling with advanced features designed for modern communication needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="md:col-span-2 bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-blue-100/50 group">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 w-16 h-16 mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Call Anywhere, From Anywhere</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">Make international calls to any country without restrictions, directly from your browser with enterprise-grade quality.</p>
              <Link href="#" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700 group-hover:translate-x-1 transition-all">
                Visit Free Caller Registry
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
            
            <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-blue-100/50 group hover:-translate-y-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 w-16 h-16 mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">No Country Restrictions</h3>
              <p className="text-gray-600">Our service works globally, connecting you with people and institutions worldwide.</p>
            </div>
            
            <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-blue-100/50 group hover:-translate-y-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 w-16 h-16 mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">No Apps or Subscriptions</h3>
              <p className="text-gray-600">Start calling in 2 minutes directly from your browser without installing apps or subscriptions.</p>
            </div>
            
            <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-blue-100/50 group hover:-translate-y-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 w-16 h-16 mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Credit Based, No Subscription</h3>
              <p className="text-gray-600">Pay only for what you use with our flexible credit system - no recurring fees or contracts.</p>
            </div>
            
            <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-blue-100/50 group hover:-translate-y-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 w-16 h-16 mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Buy Phone Numbers</h3>
              <p className="text-gray-600">Purchase virtual phone numbers from various countries for your business needs.</p>
            </div>
            
            <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-blue-100/50 group hover:-translate-y-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 w-16 h-16 mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <User className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Custom Caller ID</h3>
              <p className="text-gray-600">Set your own caller ID for outgoing calls to maintain professional identity.</p>
            </div>
            
            <div className="md:col-span-2 bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-blue-100/50 group">
              <div className="flex items-start space-x-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 w-16 h-16 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure and Private</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">All calls are encrypted end-to-end and your data is protected with enterprise-grade security protocols.</p>
                  <Link href="#" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700 group-hover:translate-x-1 transition-all">
                    Learn about privacy
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-blue-100/50 group hover:-translate-y-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 w-16 h-16 mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Radio className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Receive Calls In Browser</h3>
              <p className="text-gray-600">Accept incoming calls directly in your browser with seamless call management.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Explore Yadaphone CTA - Redesigned */}
      <div className="py-20 md:py-24 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
              <Zap className="h-4 w-4 mr-2" />
              Start Your Journey
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Explore <span className="text-blue-200">Yadaphone</span>
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              Test our premium features with a free account and experience the future of international calling.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href={getCallUrl()} 
              className="inline-flex items-center space-x-3 bg-white text-blue-600 px-10 py-4 rounded-2xl text-lg font-semibold hover:bg-blue-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              <Phone className="h-5 w-5" />
              <span>{session ? "Go to Dialer" : "Get started"}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            
            <div className="flex items-center space-x-4 text-blue-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">No credit card required</span>
              </div>
              <div className="w-px h-4 bg-blue-300"></div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Free first call</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table - Redesigned */}
      <div className="py-20 md:py-24 bg-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-40 h-40 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16 md:mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
              <Phone className="h-4 w-4 mr-2" />
              Ready to Start?
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Ready to make your <span className="text-blue-600">first call?</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Experience the simplicity of browser-based calling with crystal-clear audio quality and affordable international rates.
            </p>
            <Link 
              href={getCallUrl()} 
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-10 py-4 rounded-2xl text-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              <span>{session ? "Start Calling" : "Start calling"}</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Why Choose <span className="text-blue-600">Yadaphone?</span>
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Compare our features with popular alternatives and see why we're the top choice for international calling.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-3xl shadow-2xl overflow-hidden border border-blue-100/50">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <tr>
                    <th className="px-6 py-6 text-left text-sm font-bold text-gray-700 w-1/3">Features</th>
                    <th className="px-6 py-6 text-center text-sm font-bold text-blue-600 bg-blue-500/10 border-x-2 border-blue-200">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="bg-blue-500 rounded-full p-1">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <span>Yadaphone</span>
                      </div>
                    </th>
                    <th className="px-6 py-6 text-center text-sm font-medium text-gray-500">Google Voice</th>
                    <th className="px-6 py-6 text-center text-sm font-medium text-gray-500">Viber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-6">
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">Browser-Based</div>
                        <div className="text-sm text-gray-500">Make calls directly from your web browser, no apps required</div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center bg-blue-50/30">
                      <div className="bg-blue-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="bg-blue-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="bg-red-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-6">
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">No Phone Authentication Required</div>
                        <div className="text-sm text-gray-500">Start calling immediately without verifying your phone number</div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center bg-blue-50/30">
                      <div className="bg-blue-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="bg-red-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="bg-red-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-6">
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">Global Coverage</div>
                        <div className="text-sm text-gray-500">Call any country worldwide without restrictions</div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center bg-blue-50/30">
                      <div className="bg-blue-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="bg-red-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="bg-blue-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-6">
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">Instant Setup</div>
                        <div className="text-sm text-gray-500">No waiting time or verification process</div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center bg-blue-50/30">
                      <div className="bg-blue-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="bg-red-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="bg-red-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-6">
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">No Subscription Required</div>
                        <div className="text-sm text-gray-500">Pay only for what you use</div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center bg-blue-50/30">
                      <div className="bg-blue-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="bg-blue-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="bg-red-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-6">
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">Competitive Rates</div>
                        <div className="text-sm text-gray-500">Best-in-class pricing for international calls</div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center bg-blue-50/30">
                      <div className="bg-blue-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="bg-red-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="bg-red-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-6">
                      <div>
                        <div className="font-semibold text-gray-900 mb-1">No Restrictions</div>
                        <div className="text-sm text-gray-500">No country or usage limitations</div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center bg-blue-50/30">
                      <div className="bg-blue-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="bg-red-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="bg-red-500 rounded-full p-2 w-8 h-8 mx-auto">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-gradient-to-r from-blue-50/50 to-blue-100/50 hover:from-blue-100/50 hover:to-blue-150/50 transition-colors">
                    <td className="px-6 py-6">
                      <div className="font-bold text-gray-900">Pricing Model</div>
                    </td>
                    <td className="px-6 py-6 text-center bg-blue-100/50">
                      <div className="text-sm font-semibold text-blue-700 bg-blue-200/50 rounded-lg px-3 py-2">
                        Pay-as-you-go with competitive rates
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="text-sm text-gray-600 bg-gray-100 rounded-lg px-3 py-2">
                        Free for US calls, international rates apply
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="text-sm text-gray-600 bg-gray-100 rounded-lg px-3 py-2">
                        Subscription + per-minute rates
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Ready to Experience Section - Redesigned */}
      <div className="py-20 md:py-24 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-bounce"></div>
          <div className="absolute top-1/2 right-20 w-24 h-24 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-bounce"></div>
          <div className="absolute bottom-20 left-1/3 w-20 h-20 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-bounce"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl border border-blue-200/50">
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium mb-6">
                <Zap className="h-4 w-4 mr-2" />
                Experience the Difference
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Ready to experience the<br />
                <span className="text-blue-600">Yadaphone difference?</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Start making cheap international calls today with no setup, no subscriptions, and no restrictions. Join thousands of satisfied users worldwide.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
              <Link 
                href={getCallUrl()} 
                className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-10 py-4 rounded-2xl text-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <Phone className="h-5 w-5" />
                <span>{session ? "Go to Dialer" : "Try Yadaphone Now"}</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <div className="text-gray-500 text-sm">or</div>
              
              <Link href="/rates" className="text-blue-600 font-semibold hover:text-blue-700 underline underline-offset-4">
                View all international rates
              </Link>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>180+ countries supported</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>50% cheaper than carriers</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Crystal clear quality</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Calculator Section - Redesigned */}
      <div className="py-20 md:py-24 bg-white relative overflow-hidden">
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
              <BarChart3 className="h-4 w-4 mr-2" />
              Pricing Calculator
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Calculate Your <span className="text-blue-600">Call Cost</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get instant pricing for international calls to any destination with our transparent rate calculator.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-2 shadow-2xl border border-blue-200/50">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
              <RateCalculator />
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section - Redesigned */}
      <div className="py-20 md:py-24 bg-gradient-to-br from-gray-50 to-blue-50/30 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-40 h-40 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
              <MessageSquare className="h-4 w-4 mr-2" />
              Support Center
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Frequently Asked <span className="text-blue-600">Questions</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Find answers to common questions about Yadaphone's international calling service.
            </p>
            
            {/* Enhanced Search FAQ */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-2 border-blue-200 rounded-2xl px-6 py-4 text-gray-800 focus:border-blue-500 outline-none bg-white/80 backdrop-blur-sm shadow-lg"
                />
                <div className="absolute right-4 top-4">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredFaqItems.map((item, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-blue-50/50 rounded-2xl transition-colors"
                >
                  <span className="font-semibold text-gray-900 text-lg">{item.question}</span>
                  <div className={`bg-blue-100 rounded-full p-2 transition-transform duration-300 ${
                    openFaq === index ? 'rotate-180 bg-blue-200' : ''
                  }`}>
                    <ChevronDown className="h-5 w-5 text-blue-600" />
                  </div>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <div className="bg-blue-50/50 rounded-xl p-4 mb-4">
                      <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-block bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                        {item.category}
                      </span>
                      <div className="text-xs text-gray-500">
                        Was this helpful? 
                        <button className="ml-2 text-blue-600 hover:text-blue-700">👍</button>
                        <button className="ml-1 text-blue-600 hover:text-blue-700">👎</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {filteredFaqItems.length === 0 && (
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-blue-200/50">
              <div className="text-gray-500 mb-4">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No questions found</h3>
                <p>No questions found matching "{searchQuery}"</p>
              </div>
              <button 
                onClick={() => setSearchQuery("")}
                className="text-blue-600 font-medium hover:text-blue-700"
              >
                Clear search
              </button>
            </div>
          )}
          
          {/* Help CTA */}
          <div className="text-center mt-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-200/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Still have questions?</h3>
              <p className="text-gray-600 mb-4">Our support team is here to help you 24/7</p>
              <Link href="/contact" className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors">
                <Headphones className="h-5 w-5" />
                <span>Contact Support</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section - Redesigned */}
      <div className="py-20 md:py-24 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-10 w-32 h-32 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
          <div className="absolute top-3/4 right-10 w-40 h-40 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse delay-2000"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16 md:mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-blue-700 text-sm font-medium mb-6 shadow-lg">
              <Star className="h-4 w-4 mr-2 text-yellow-500" />
              Customer Stories
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              What Our <span className="text-blue-600">Users Say</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of satisfied customers who've revolutionized their international calling experience with Yadaphone.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 border border-blue-200/50 hover:border-blue-300 transform hover:-translate-y-2">
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <div className="relative">
                  <div className="absolute -top-2 -left-2 text-6xl text-blue-200 font-serif">"</div>
                  <p className="text-gray-700 italic text-lg leading-relaxed pl-6">
                    Yadaphone works great! The sound quality is better than the alternatives and much easier to use. Will be using from now on!
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">N</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Nicolas P.</div>
                  <div className="text-sm text-gray-600 flex items-center">
                    <span className="mr-1">🇨🇾</span> Cyprus
                  </div>
                </div>
              </div>
            </div>
            
            <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 border border-blue-200/50 hover:border-blue-300 transform hover:-translate-y-2">
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <div className="relative">
                  <div className="absolute -top-2 -left-2 text-6xl text-blue-200 font-serif">"</div>
                  <p className="text-gray-700 italic text-lg leading-relaxed pl-6">
                    I use Yadaphone weekly to call my family abroad. It's much more affordable than my phone carrier's international rates.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Miguel R.</div>
                  <div className="text-sm text-gray-600 flex items-center">
                    <span className="mr-1">🇨🇦</span> Canada
                  </div>
                </div>
              </div>
            </div>
            
            <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 border border-blue-200/50 hover:border-blue-300 transform hover:-translate-y-2">
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <div className="relative">
                  <div className="absolute -top-2 -left-2 text-6xl text-blue-200 font-serif">"</div>
                  <p className="text-gray-700 italic text-lg leading-relaxed pl-6">
                    I lost access to my bank while nomading in Southeast Asia. I stumbled upon Yadaphone, called my bank, and solved everything in no time!
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">J</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">James M.</div>
                  <div className="text-sm text-gray-600 flex items-center">
                    <span className="mr-1">🇺🇸</span> United States
                  </div>
                </div>
              </div>
            </div>
            
            <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 border border-blue-200/50 hover:border-blue-300 transform hover:-translate-y-2">
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <div className="relative">
                  <div className="absolute -top-2 -left-2 text-6xl text-blue-200 font-serif">"</div>
                  <p className="text-gray-700 italic text-lg leading-relaxed pl-6">
                    I had to call the tax authorities in my base country from abroad. I've spent hours talking to the officials on Yadaphone and only spent a couple of dollars. Everything was perfect and it saved me a lot of nerves!
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Thomas L.</div>
                  <div className="text-sm text-gray-600 flex items-center">
                    <span className="mr-1">🇩🇪</span> Germany
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-16 text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-200/50 inline-block">
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">10,000+ Happy Customers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">4.9/5 Average Rating</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-green-500" />
                  <span className="font-medium">180+ Countries Served</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
