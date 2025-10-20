"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Plus,
  History,
  Contact,
  CreditCard,
  MessageCircle,
  Clock,
  DollarSign,
  Globe
} from "lucide-react";

interface CallRate {
  id: string;
  country: string;
  countryCode: string;
  rate: number;
  currency: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  isAdmin: boolean;
}

export default function Dialer() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [rates, setRates] = useState<CallRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<CallRate | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [callerIdOption, setCallerIdOption] = useState<"public" | "custom" | "bought">("public");
  const [customCallerId, setCustomCallerId] = useState("");
  const [showCallerOptions, setShowCallerOptions] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ name: "United States", flag: "🇺🇸", code: "+1" });
  const [showCountryOptions, setShowCountryOptions] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [selectedCallerId, setSelectedCallerId] = useState<string>("");

  // Common countries with flags and codes
  const countries = [
    { name: "United States", flag: "🇺🇸", code: "+1" },
    { name: "Canada", flag: "🇨🇦", code: "+1" },
    { name: "United Kingdom", flag: "🇬🇧", code: "+44" },
    { name: "France", flag: "🇫🇷", code: "+33" },
    { name: "Germany", flag: "🇩🇪", code: "+49" },
    { name: "Spain", flag: "🇪🇸", code: "+34" },
    { name: "Italy", flag: "🇮🇹", code: "+39" },
    { name: "Netherlands", flag: "🇳🇱", code: "+31" },
    { name: "Australia", flag: "🇦🇺", code: "+61" },
    { name: "Japan", flag: "🇯🇵", code: "+81" },
    { name: "South Korea", flag: "🇰🇷", code: "+82" },
    { name: "China", flag: "🇨🇳", code: "+86" },
    { name: "India", flag: "🇮🇳", code: "+91" },
    { name: "Brazil", flag: "🇧🇷", code: "+55" },
    { name: "Mexico", flag: "🇲🇽", code: "+52" },
    { name: "Morocco", flag: "🇲🇦", code: "+212" },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchRates();
      fetchUserData();
      fetchAvailableNumbers();
    }
  }, [status, router]);

  // Handle phone number from URL params (e.g., from contacts)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const numberParam = urlParams.get('number');
    if (numberParam) {
      setPhoneNumber(numberParam);
      const rate = detectCountry(numberParam);
      setSelectedRate(rate);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCallerOptions) {
        setShowCallerOptions(false);
      }
      if (showCountryOptions) {
        setShowCountryOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCallerOptions, showCountryOptions]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCalling && callStatus === "answered") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCalling, callStatus]);

  const fetchRates = async () => {
    try {
      const response = await fetch("/api/rates");
      if (response.ok) {
        const data = await response.json();
        setRates(data);
      }
    } catch (error) {
      console.error("Error fetching rates:", error);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const fetchAvailableNumbers = async () => {
    try {
      const response = await fetch("/api/user/phone-numbers");
      if (response.ok) {
        const numbers = await response.json();
        setAvailableNumbers(numbers);
        
        // Set default caller ID if user has bought numbers
        if (numbers.length > 0 && !selectedCallerId) {
          setSelectedCallerId(numbers[0].phoneNumber);
          setCallerIdOption("bought");
        }
      }
    } catch (error) {
      console.error("Failed to fetch available numbers:", error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const detectCountry = (number: string) => {
    const cleanNumber = number.replace(/\D/g, "");
    
    // Sort rates by country code length (longest first) for better matching
    const sortedRates = [...rates].sort((a, b) => 
      b.countryCode.replace("+", "").length - a.countryCode.replace("+", "").length
    );
    
    for (const rate of sortedRates) {
      const countryCodeDigits = rate.countryCode.replace("+", "");
      if (cleanNumber.startsWith(countryCodeDigits)) {
        // Update selected country to match detected rate
        const matchingCountry = countries.find(c => c.code === rate.countryCode);
        if (matchingCountry) {
          setSelectedCountry(matchingCountry);
        }
        return rate;
      }
    }
    return null;
  };

  const handleNumberInput = (digit: string) => {
    if (isCalling) return;
    setPhoneNumber(prev => {
      let newNumber = prev + digit;
      
      // Auto-format number based on selected country
      if (prev === "" && selectedCountry && !newNumber.startsWith("+")) {
        // Add country code if starting fresh
        newNumber = selectedCountry.code + newNumber;
      }
      
      const rate = detectCountry(newNumber);
      setSelectedRate(rate);
      return newNumber;
    });
  };

  const handleNumberChange = (value: string) => {
    if (isCalling) return;
    setPhoneNumber(value);
    const rate = detectCountry(value);
    setSelectedRate(rate);
  };

  const clearNumber = () => {
    if (isCalling) return;
    setPhoneNumber("");
    setSelectedRate(null);
  };

  const deleteLastDigit = () => {
    if (isCalling) return;
    setPhoneNumber(prev => {
      const newNumber = prev.slice(0, -1);
      const rate = detectCountry(newNumber);
      setSelectedRate(rate);
      return newNumber;
    });
  };

  const clearAllDigits = () => {
    if (isCalling) return;
    setPhoneNumber("");
    setSelectedRate(null);
  };

  const initiateCall = async () => {
    if (!phoneNumber || !user) return;

    // Check if we have a rate for this number
    if (!selectedRate) {
      alert("Unable to determine rates for this number. Please check the number format.");
      return;
    }

    // Check balance
    const estimatedCost = selectedRate.rate * 0.5; // Minimum 30 seconds
    if (user.balance < estimatedCost) {
      const confirmed = confirm(
        `Insufficient balance for this call. You need at least $${estimatedCost.toFixed(3)} but have $${user.balance.toFixed(2)}.\n\nWould you like to add credits now?`
      );
      if (confirmed) {
        router.push("/dashboard/add-credits");
      }
      return;
    }

    setIsCalling(true);
    setCallStatus("initiating");

    try {
      const callerInfo = {
        type: callerIdOption,
        customId: callerIdOption === "custom" ? customCallerId : null,
      };

      const response = await fetch("/api/calls/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phoneNumber,
          from: callerInfo.type === "custom" && callerInfo.customId 
            ? callerInfo.customId 
            : "+1234567890", // Default number
          callerIdType: callerIdOption,
        }),
      });

      if (response.ok) {
        setCallStatus("ringing");
        // Simulate call progression
        setTimeout(() => {
          setCallStatus("answered");
          // Start billing simulation
          const interval = setInterval(() => {
            if (user) {
              const currentCost = (callDuration / 60) * selectedRate.rate;
              if (user.balance - currentCost <= 0) {
                alert("Call ended: Insufficient balance");
                endCall();
                clearInterval(interval);
              }
            }
          }, 10000); // Check every 10 seconds
        }, 3000);
      } else {
        const errorData = await response.json();
        alert(`Call failed: ${errorData.error || "Unknown error"}`);
        setCallStatus("failed");
        setIsCalling(false);
      }
    } catch (error) {
      console.error("Call initiation error:", error);
      alert("Call failed: Network error. Please try again.");
      setCallStatus("failed");
      setIsCalling(false);
    }
  };

  const endCall = async () => {
    setIsCalling(false);
    setCallStatus("");
    setCallDuration(0);
    // Keep the number for easy redial
    setSelectedRate(null);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  // iPhone-style keypad
  const keypadButtons = [
    { digit: "1", letters: "" },
    { digit: "2", letters: "ABC" },
    { digit: "3", letters: "DEF" },
    { digit: "4", letters: "GHI" },
    { digit: "5", letters: "JKL" },
    { digit: "6", letters: "MNO" },
    { digit: "7", letters: "PQRS" },
    { digit: "8", letters: "TUV" },
    { digit: "9", letters: "WXYZ" },
    { digit: "*", letters: "" },
    { digit: "0", letters: "+" },
    { digit: "#", letters: "" },
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      {isCalling ? (
        // Full Screen Call Interface with iPhone shadows and Skype green  
        <div className="w-full max-w-md min-h-screen flex flex-col bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-white">
          {/* Call Status Header */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8">
            <div className="text-center mb-6 sm:mb-8 bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-2xl border border-white/30">
              <div className="text-xs sm:text-sm text-blue-800 mb-2 uppercase tracking-wide font-bold">
                {callStatus}
              </div>
              <div className="text-2xl sm:text-3xl font-bold mb-2 text-blue-900">
                {phoneNumber}
              </div>
              {selectedRate && (
                <div className="text-base sm:text-lg text-blue-700 font-medium">
                  {selectedRate.country}
                </div>
              )}
            </div>

            {/* Call Duration */}
            <div className="text-4xl sm:text-6xl font-bold mb-8 sm:mb-12 text-blue-900 bg-blue-100/30 backdrop-blur-sm rounded-2xl px-6 sm:px-8 py-3 sm:py-4 shadow-2xl">
              {callStatus === "answered" ? formatDuration(callDuration) : ""}
            </div>

            {/* Cost Display */}
            {selectedRate && callDuration > 0 && (
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl px-4 sm:px-6 py-3 sm:py-4 mb-6 sm:mb-8 shadow-2xl border-2 sm:border-4 border-white animate-pulse max-w-xs w-full">
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-white font-bold">Call Cost</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    ${((callDuration / 60) * selectedRate.rate).toFixed(4)}
                  </div>
                  <div className="text-xs text-green-100 font-medium">
                    Rate: ${selectedRate.rate.toFixed(3)}/min
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* iPhone-style Call Controls with Skype blue */}
          <div className="pb-8 sm:pb-12 px-4 sm:px-8">
            <div className="flex justify-center items-center space-x-8 sm:space-x-16">
              <button
                onClick={toggleMute}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 active:scale-95 border-2 sm:border-4 border-white touch-manipulation ${
                  isMuted 
                    ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700" 
                    : "bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
                }`}
              >
                {isMuted ? <MicOff className="h-6 w-6 sm:h-8 sm:w-8" /> : <Mic className="h-6 w-6 sm:h-8 sm:w-8" />}
              </button>

              <button
                onClick={endCall}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white w-20 h-20 sm:w-28 sm:h-28 rounded-full hover:from-red-600 hover:to-red-700 flex items-center justify-center transition-all duration-300 shadow-2xl hover:shadow-red-500/50 active:scale-95 transform border-2 sm:border-4 border-white touch-manipulation"
              >
                <PhoneOff className="h-8 w-8 sm:h-12 sm:w-12" />
              </button>

              <button
                onClick={toggleSpeaker}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 active:scale-95 border-2 sm:border-4 border-white touch-manipulation ${
                  isSpeakerOn 
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800" 
                    : "bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600"
                }`}
              >
                {isSpeakerOn ? <Volume2 className="h-6 w-6 sm:h-8 sm:w-8" /> : <VolumeX className="h-6 w-6 sm:h-8 sm:w-8" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // iPhone-style dialer with Skype blue colors and shadows
        <div className="w-full max-w-md min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-3xl shadow-2xl border border-blue-200">
          {/* Status and Balance */}
          <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-3 sm:pb-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/25"></div>
              <button 
                onClick={() => router.push("/dashboard/add-credits")}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 touch-manipulation"
              >
                Balance: ${user ? user.balance.toFixed(2) : "0.00"} +
              </button>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-white mb-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full px-4 py-2 shadow-xl">
                <div className="text-white animate-bounce">✓</div>
                <span className="text-sm font-medium">1 min test call available</span>
              </div>
            </div>
          </div>

          {/* Compact Phone Number Input */}
          <div className="px-4 sm:px-6 mb-3 sm:mb-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-blue-400 overflow-hidden">
              {/* Main Input Row */}
              <div className="flex items-stretch">
                {/* Country Code Selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowCountryOptions(!showCountryOptions)}
                    className="h-14 flex items-center space-x-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 border-r border-blue-400"
                  >
                    <span className="text-base">{selectedCountry.flag}</span>
                    <span className="text-sm font-bold">{selectedCountry.code}</span>
                    <svg className={`h-3 w-3 transition-transform ${showCountryOptions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Compact Country Dropdown */}
                  {showCountryOptions && (
                    <div className="absolute top-full left-0 mt-1 w-60 bg-white rounded-xl shadow-2xl border border-blue-200 py-1 z-50 max-h-48 overflow-y-auto">
                      {countries.map((country) => (
                        <button
                          key={country.code + country.name}
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowCountryOptions(false);
                          }}
                          className={`w-full flex items-center space-x-2 px-3 py-2 hover:bg-blue-50 transition-colors text-sm ${
                            selectedCountry.code === country.code ? "bg-blue-100 text-blue-700" : "text-gray-700"
                          }`}
                        >
                          <span className="text-base">{country.flag}</span>
                          <span className="font-medium truncate">{country.name}</span>
                          <span className="text-blue-600 font-bold ml-auto">{country.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone Number Input */}
                <div className="flex-1 px-4">
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Phone number"
                    className="w-full h-14 text-xl font-medium border-none outline-none bg-transparent text-gray-800 placeholder-gray-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex">
                  <button
                    onClick={deleteLastDigit}
                    disabled={!phoneNumber || isCalling}
                    className="h-14 w-12 flex items-center justify-center disabled:opacity-30 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-all border-l border-blue-200"
                    title="Delete"
                  >
                    <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                    </svg>
                  </button>
                  <button
                    onClick={clearAllDigits}
                    disabled={!phoneNumber || isCalling}
                    className="h-14 w-12 flex items-center justify-center disabled:opacity-30 bg-red-50 hover:bg-red-100 active:bg-red-200 transition-all border-l border-red-200"
                    title="Clear"
                  >
                    <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Optional: Number formatting hint */}
              {phoneNumber && (
                <div className="px-4 pb-2">
                  <div className="text-xs text-blue-600 font-medium">
                    {selectedCountry.code} {phoneNumber}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Call From Options */}
          <div className="px-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-700 text-sm font-medium">Call from:</span>
              <div className="relative">
                <button 
                  onClick={() => setShowCallerOptions(!showCallerOptions)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full px-4 py-2 text-sm shadow-xl hover:shadow-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                >
                  <Globe className="h-4 w-4 text-white" />
                  <span className="font-bold">
                    {callerIdOption === "public" && "Public number"}
                    {callerIdOption === "custom" && customCallerId ? customCallerId : "Custom caller ID"}
                    {callerIdOption === "bought" && selectedCallerId ? selectedCallerId : "Bought number"}
                  </span>
                  <svg className={`h-4 w-4 text-white transition-transform ${showCallerOptions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dynamic Dropdown Menu */}
                {showCallerOptions && (
                  <div className="absolute right-0 mt-2 w-72 bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl border border-blue-200 py-2 z-50 animate-in slide-in-from-top-2 max-h-96 overflow-y-auto">
                    
                    {/* Public Numbers Section */}
                    <div className="px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-gray-100">
                      Public Numbers
                    </div>
                    
                    {availableNumbers.filter(num => num.type === 'public').map((number) => (
                      <button 
                        key={number.id}
                        onClick={() => {
                          setCallerIdOption("public");
                          setSelectedCallerId(number.phoneNumber);
                          setShowCallerOptions(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                          callerIdOption === "public" && selectedCallerId === number.phoneNumber ? "bg-blue-100 border-r-2 border-blue-500" : ""
                        }`}
                      >
                        <Globe className="h-5 w-5 text-blue-600" />
                        <div className="flex-1 text-left">
                          <div className="text-gray-900 font-medium">{number.phoneNumber}</div>
                          <div className="text-xs text-gray-500">{number.country}</div>
                        </div>
                        {callerIdOption === "public" && selectedCallerId === number.phoneNumber && 
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        }
                      </button>
                    ))}

                    {/* Bought Numbers Section */}
                    {availableNumbers.filter(num => num.type === 'premium').length > 0 && (
                      <>
                        <div className="px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-gray-100 mt-2">
                          Your Numbers
                        </div>
                        
                        {availableNumbers.filter(num => num.type === 'premium').map((number) => (
                          <button 
                            key={number.id}
                            onClick={() => {
                              setCallerIdOption("bought");
                              setSelectedCallerId(number.phoneNumber);
                              setShowCallerOptions(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                              callerIdOption === "bought" && selectedCallerId === number.phoneNumber ? "bg-blue-100 border-r-2 border-blue-500" : ""
                            }`}
                          >
                            <Phone className="h-5 w-5 text-green-600" />
                            <div className="flex-1 text-left">
                              <div className="text-gray-900 font-medium">{number.phoneNumber}</div>
                              <div className="text-xs text-green-600">${number.monthlyFee}/month</div>
                            </div>
                            {callerIdOption === "bought" && selectedCallerId === number.phoneNumber && 
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            }
                          </button>
                        ))}
                      </>
                    )}
                    
                    {/* Custom Caller ID Option */}
                    <div className="px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-gray-100 mt-2">
                      Custom Options
                    </div>
                    
                    <button 
                      onClick={() => {
                        setCallerIdOption("custom");
                        setShowCallerOptions(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                        callerIdOption === "custom" ? "bg-blue-100 border-r-2 border-blue-500" : ""
                      }`}
                    >
                      <MessageCircle className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-900 font-medium">Custom caller ID</span>
                      {callerIdOption === "custom" && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>}
                    </button>
                    
                    {/* Buy More Numbers */}
                    <button 
                      onClick={() => {
                        router.push("/dashboard/buy-number");
                        setShowCallerOptions(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-green-50 transition-colors border-2 border-dashed border-green-200 mx-2 my-2 rounded-xl"
                    >
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-gray-900 font-medium">Buy phone number</span>
                      <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">NEW</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Custom Caller ID Input */}
            {callerIdOption === "custom" && (
              <div className="mb-4">
                <input
                  type="tel"
                  value={customCallerId}
                  onChange={(e) => setCustomCallerId(e.target.value)}
                  placeholder="Enter custom caller ID"
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            <button 
              onClick={() => router.push("/dashboard/contacts")}
              className="flex items-center space-x-2 text-green-600 text-sm font-medium hover:text-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add contact</span>
            </button>
          </div>

          {selectedRate && (
            <div className="px-6 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl px-4 py-3 border border-blue-200 shadow-sm">
                <div className="flex items-center justify-center space-x-3">
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-700">
                    {selectedRate.country} - ${selectedRate.rate.toFixed(3)}/min
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* iPhone-style Keypad with Skype green accents */}
          <div className="flex-1 px-6">
            <div className="grid grid-cols-3 gap-6 mb-8">
              {keypadButtons.map((button) => (
                <button
                  key={button.digit}
                  onClick={() => handleNumberInput(button.digit)}
                  className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 active:from-blue-200 active:to-blue-300 active:scale-95 transition-all duration-200 flex flex-col items-center justify-center shadow-2xl hover:shadow-blue-500/25 border-2 border-blue-300 hover:border-blue-400"
                  disabled={isCalling}
                >
                  <span className="text-3xl font-light text-blue-800">{button.digit}</span>
                  {button.letters && (
                    <span className="text-xs text-blue-600 -mt-1 font-bold">{button.letters}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-8">
            <div className="flex items-center justify-center space-x-8 mb-6">
              {/* Contacts Button */}
              <button
                onClick={() => router.push("/dashboard/contacts")}
                className="w-16 h-16 flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-200 rounded-full shadow-xl hover:shadow-2xl transition-all hover:from-blue-200 hover:to-blue-300 active:scale-95 border-2 border-blue-300"
                title="Contacts"
              >
                <svg className="h-7 w-7 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Call Button - iPhone style with blue theme */}
              <button
                onClick={initiateCall}
                disabled={!phoneNumber || isCalling}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white w-20 h-20 rounded-full hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 active:scale-95 transform border-3 border-blue-400"
              >
                <Phone className="h-9 w-9" />
              </button>

              {/* Call History Button */}
              <button
                onClick={() => router.push("/dashboard/history")}
                className="w-16 h-16 flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-200 rounded-full shadow-xl hover:shadow-2xl transition-all hover:from-blue-200 hover:to-blue-300 active:scale-95 border-2 border-blue-300"
                title="Call History"
              >
                <svg className="h-7 w-7 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {/* Rate Information Card */}
            {selectedRate && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 shadow-2xl p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
                    <span className="text-sm font-bold text-blue-800">Rate Information</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <span className="text-blue-900 font-bold">{selectedRate.country}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-700">${selectedRate.rate.toFixed(3)}</div>
                      <div className="text-xs text-blue-600 font-medium">per minute</div>
                    </div>
                  </div>
                  
                  {/* Estimated cost for 1 minute */}
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700 font-medium">Est. 1 min call:</span>
                      <span className="font-bold text-blue-800">${selectedRate.rate.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => {
                    setPhoneNumber(prev => prev + "123");
                    const rate = detectCountry(phoneNumber + "123");
                    setSelectedRate(rate);
                  }}
                  className="flex flex-col items-center justify-center p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl shadow-lg hover:shadow-xl transition-all hover:from-blue-200 hover:to-blue-300 active:scale-95 border border-blue-300"
                >
                  <span className="text-blue-700 font-bold text-sm">123</span>
                  <span className="text-xs text-blue-600 mt-1">Quick</span>
                </button>

                <button
                  onClick={() => router.push("/dashboard/settings")}
                  className="flex flex-col items-center justify-center p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl shadow-lg hover:shadow-xl transition-all hover:from-blue-200 hover:to-blue-300 active:scale-95 border border-blue-300"
                >
                  <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs text-blue-600 mt-1">Settings</span>
                </button>

                <button
                  onClick={() => router.push("/dashboard/add-credits")}
                  className="flex flex-col items-center justify-center p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-xl shadow-lg hover:shadow-xl transition-all hover:from-green-200 hover:to-green-300 active:scale-95 border border-green-300"
                >
                  <svg className="h-5 w-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-xs text-green-600 mt-1">Credits</span>
                </button>

                <button
                  onClick={() => router.push("/rates")}
                  className="flex flex-col items-center justify-center p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl shadow-lg hover:shadow-xl transition-all hover:from-blue-200 hover:to-blue-300 active:scale-95 border border-blue-300"
                >
                  <svg className="h-5 w-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-6a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-xs text-blue-600 mt-1">Rates</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
