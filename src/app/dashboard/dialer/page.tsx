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
  const [callerIdOption, setCallerIdOption] = useState<"public" | "bought" | "verified">("public");
  const [showCallerOptions, setShowCallerOptions] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ name: "United States", flag: "🇺🇸", code: "+1" });
  const [showCountryOptions, setShowCountryOptions] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
  const [selectedCallerId, setSelectedCallerId] = useState<string>("");
  const [countrySearch, setCountrySearch] = useState("");
  const [countries, setCountries] = useState<{ name: string; flag: string; code: string }[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [verifiedCallerIds, setVerifiedCallerIds] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [showContactsList, setShowContactsList] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchRates();
      fetchUserData();
      fetchAvailableNumbers();
      fetchCountries();
      fetchVerifiedCallerIds();
      fetchContacts();
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
      const target = event.target as HTMLElement;
      
      // Check if click is outside the country dropdown
      if (showCountryOptions && !target.closest('[data-country-dropdown]')) {
        setShowCountryOptions(false);
      }
      
      // Check if click is outside the caller options dropdown  
      if (showCallerOptions && !target.closest('[data-caller-dropdown]')) {
        setShowCallerOptions(false);
      }
      
      // Check if click is outside the contacts dropdown
      if (showContactsList && !target.closest('[data-contacts-dropdown]')) {
        setShowContactsList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCallerOptions, showCountryOptions, showContactsList]);

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
        
        // Set default caller ID based on priority: public > bought > verified
        if (!selectedCallerId) {
          const publicNumbers = numbers.filter((num: any) => num.type === 'public');
          const boughtNumbers = numbers.filter((num: any) => num.type === 'premium');
          
          if (publicNumbers.length > 0) {
            setSelectedCallerId(publicNumbers[0].phoneNumber);
            setCallerIdOption("public");
          } else if (boughtNumbers.length > 0) {
            setSelectedCallerId(boughtNumbers[0].phoneNumber);
            setCallerIdOption("bought");
          } else {
            // Fallback to default platform number if no numbers in API
            setSelectedCallerId("+12293983710");
            setCallerIdOption("public");
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch available numbers:", error);
    }
  };

  const fetchVerifiedCallerIds = async () => {
    try {
      const response = await fetch("/api/user/caller-ids");
      if (response.ok) {
        const data = await response.json();
        const verified = data.callerIds?.filter((id: any) => id.status === 'VERIFIED') || [];
        setVerifiedCallerIds(verified);
        
        // Set default verified caller ID if no other caller ID is selected
        if (verified.length > 0 && !selectedCallerId && availableNumbers.length === 0) {
          setSelectedCallerId(verified[0].phoneNumber);
          setCallerIdOption("verified");
        }
      }
    } catch (error) {
      console.error("Failed to fetch verified caller IDs:", error);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/user/contacts");
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
      setContacts([]);
    }
  };

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
            const flag = rate.flag || "🌍"; // Use flag from database, fallback to earth emoji
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

  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.includes(countrySearch)
  );

  // Handle country selection
  const handleCountrySelect = (country: { name: string; flag: string; code: string }) => {
    setSelectedCountry(country);
    setShowCountryOptions(false);
    setCountrySearch("");
    
    // If phone number exists and doesn't start with +, prepend the new country code
    if (phoneNumber && !phoneNumber.startsWith("+")) {
      const newNumber = country.code + phoneNumber;
      setPhoneNumber(newNumber);
      const rate = detectCountry(newNumber);
      setSelectedRate(rate);
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

  const handleNumberChange = (value: string) => {
    if (isCalling) return;
    setPhoneNumber(value);
    const rate = detectCountry(value);
    setSelectedRate(rate);
  };

  const handleNumberInput = (digit: string) => {
    if (isCalling) return;
    setPhoneNumber(prev => {
      const newNumber = prev + digit;
      const rate = detectCountry(newNumber);
      setSelectedRate(rate);
      return newNumber;
    });
  };

  const handleContactSelect = (contact: any) => {
    if (isCalling) return;
    setPhoneNumber(contact.phoneNumber);
    const rate = detectCountry(contact.phoneNumber);
    setSelectedRate(rate);
    setShowContactsList(false);
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

  const clearNumber = () => {
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
        verifiedId: callerIdOption === "verified" ? selectedCallerId : null,
      };

      // Determine the "from" number based on caller ID type
      let fromNumber = "+1234567890"; // Default fallback
      if (callerIdOption === "verified" && selectedCallerId) {
        fromNumber = selectedCallerId;
      } else if (callerIdOption === "bought" && selectedCallerId) {
        fromNumber = selectedCallerId;
      }

      const response = await fetch("/api/calls/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phoneNumber,
          from: fromNumber,
          callerIdType: callerIdOption,
          callerIdInfo: callerInfo,
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

          {/* Clean Phone Input Design (matching home page) */}
          <div className="px-4 sm:px-6 mb-6 relative">
            <div className="flex items-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
              {/* Country Selector Button */}
              <button
                type="button"
                onClick={() => setShowCountryOptions(!showCountryOptions)}
                className="flex items-center space-x-2 px-3 sm:px-4 py-3 sm:py-4 bg-blue-50 hover:bg-blue-100 transition-colors border-r border-gray-200"
                disabled={isCalling}
                data-country-dropdown="button"
              >
                <span className="text-xl sm:text-2xl">{selectedCountry.flag}</span>
                <span className="text-sm sm:text-base font-bold text-gray-700">{selectedCountry.code}</span>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${showCountryOptions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Separator */}
              <div className="w-px h-6 bg-gray-300 mx-2"></div>

              {/* Phone Number Input */}
              <input 
                type="tel" 
                value={phoneNumber}
                onChange={(e) => handleNumberChange(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter phone number"
                className="flex-1 border-0 outline-none bg-transparent text-lg sm:text-xl font-mono text-gray-800 placeholder-gray-400"
                disabled={isCalling}
              />

              {/* Clear Button */}
              {phoneNumber && (
                <button
                  type="button"
                  onClick={clearNumber}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  disabled={isCalling}
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Contacts Button */}
              <button
                type="button"
                onClick={() => setShowContactsList(!showContactsList)}
                className="p-1.5 mr-2 hover:bg-blue-50 rounded-full transition-colors text-blue-600 flex-shrink-0"
                disabled={isCalling}
                title="Select from contacts"
              >
                <Contact className="w-5 h-5" />
              </button>
            </div>

            {/* Country Dropdown */}
            {showCountryOptions && (
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
                    filteredCountries.map((country) => (
                      <button
                        key={country.code + country.name}
                        onClick={() => handleCountrySelect(country)}
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
                  {!isLoadingCountries && filteredCountries.length === 0 && countrySearch && (
                    <div className="px-3 py-4 text-gray-500 text-sm text-center">
                      No countries found for "{countrySearch}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contacts Dropdown */}
            {showContactsList && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-72 overflow-hidden z-50" data-contacts-dropdown="menu">
                {/* Search Input */}
                <div className="p-3 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                
                {/* Contacts List */}
                <div className="max-h-48 overflow-y-auto">
                  {contacts.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <Contact className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm mb-3">No contacts yet</p>
                      <button
                        onClick={() => router.push("/dashboard/contacts")}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Add your first contact
                      </button>
                    </div>
                  ) : (
                    (() => {
                      const filteredContacts = contacts.filter(contact =>
                        contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
                        contact.phoneNumber.includes(contactSearch)
                      );
                      
                      return filteredContacts.length === 0 ? (
                        <div className="px-3 py-4 text-gray-500 text-sm text-center">
                          No contacts found for "{contactSearch}"
                        </div>
                      ) : (
                        filteredContacts.map((contact: any) => (
                          <button
                            key={contact.id}
                            onClick={() => handleContactSelect(contact)}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                          >
                            <div className="bg-blue-100 p-2 rounded-full">
                              <Contact className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{contact.name}</p>
                              <p className="text-sm text-gray-500 truncate">{contact.phoneNumber}</p>
                            </div>
                            <Phone className="w-4 h-4 text-green-600" />
                          </button>
                        ))
                      );
                    })()
                  )}
                </div>
              </div>
            )}

            {/* Optional: Number formatting hint */}
            {phoneNumber && (
              <div className="px-4 pb-2">
                <div className="text-xs text-blue-600 font-medium">
                  {selectedCountry.code} {phoneNumber}
                </div>
              </div>
            )}
          </div>

          {/* Call From Options */}
          <div className="px-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-700 text-sm font-medium">Call from:</span>
              <div className="relative">
                <button 
                  onClick={() => setShowCallerOptions(!showCallerOptions)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full px-4 py-2 text-sm shadow-xl hover:shadow-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
                  data-caller-dropdown="button"
                >
                  <Globe className="h-4 w-4 text-white" />
                  <span className="font-bold">
                    {callerIdOption === "public" && (selectedCallerId || "Public number")}
                    {callerIdOption === "bought" && (selectedCallerId || "Bought number")}
                    {callerIdOption === "verified" && (selectedCallerId || "Verified caller ID")}
                  </span>
                  <svg className={`h-4 w-4 text-white transition-transform ${showCallerOptions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dynamic Dropdown Menu */}
                {showCallerOptions && (
                  <div className="absolute right-0 mt-2 w-72 bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl border border-blue-200 py-2 z-50 animate-in slide-in-from-top-2 max-h-96 overflow-y-auto" data-caller-dropdown="menu">
                    
                    {/* Public Numbers Section - Always Available */}
                    <div className="px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-gray-100">
                      🌐 Platform Numbers (Free)
                    </div>
                    
                    {/* Show available public numbers OR fallback option */}
                    {availableNumbers.filter(num => num.type === 'public').length > 0 ? (
                      availableNumbers.filter(num => num.type === 'public').map((number) => (
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
                      ))
                    ) : (
                      /* Fallback: Default platform number */
                      <button 
                        onClick={() => {
                          setCallerIdOption("public");
                          setSelectedCallerId("+12293983710"); // Your default Twilio number
                          setShowCallerOptions(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                          callerIdOption === "public" ? "bg-blue-100 border-r-2 border-blue-500" : ""
                        }`}
                      >
                        <Globe className="h-5 w-5 text-blue-600" />
                        <div className="flex-1 text-left">
                          <div className="text-gray-900 font-medium">+12293983710</div>
                          <div className="text-xs text-gray-500">United States • Default</div>
                        </div>
                        {callerIdOption === "public" && 
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        }
                      </button>
                    )}

                    {/* Bought Numbers Section */}
                    <div className="px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-gray-100 mt-2">
                      📱 Your Bought Numbers
                    </div>
                    
                    {availableNumbers.filter(num => num.type === 'premium').length > 0 ? (
                      availableNumbers.filter(num => num.type === 'premium').map((number) => (
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
                      ))
                    ) : (
                      /* No bought numbers - show buy option */
                      <div className="px-4 py-3 text-gray-500 text-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>No numbers purchased yet</span>
                        </div>
                        <button 
                          onClick={() => {
                            router.push("/dashboard/buy-number");
                            setShowCallerOptions(false);
                          }}
                          className="text-green-600 hover:text-green-700 text-xs font-medium"
                        >
                          → Buy your first number
                        </button>
                      </div>
                    )}
                    
                    {/* Verified Caller IDs Section */}
                    <div className="px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-gray-100 mt-2">
                      ✅ Your Verified Numbers
                    </div>
                    
                    {verifiedCallerIds.length > 0 ? (
                      verifiedCallerIds.map((callerId) => (
                        <button 
                          key={callerId.id}
                          onClick={() => {
                            setCallerIdOption("verified");
                            setSelectedCallerId(callerId.phoneNumber);
                            setShowCallerOptions(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors ${
                            callerIdOption === "verified" && selectedCallerId === callerId.phoneNumber ? "bg-blue-100 border-r-2 border-blue-500" : ""
                          }`}
                        >
                          <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 text-left">
                            <div className="text-gray-900 font-medium">{callerId.phoneNumber}</div>
                            <div className="text-xs text-green-600">✅ Verified • Custom rates may apply</div>
                          </div>
                          {callerIdOption === "verified" && selectedCallerId === callerId.phoneNumber && 
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          }
                        </button>
                      ))
                    ) : (
                      /* No verified caller IDs - show add option */
                      <div className="px-4 py-3 text-gray-500 text-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="h-4 w-4 bg-gray-300 rounded-full flex items-center justify-center">
                            <svg className="h-2 w-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span>No caller IDs verified yet</span>
                        </div>
                        <button 
                          onClick={() => {
                            router.push("/dashboard/settings");
                            setShowCallerOptions(false);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          → Verify your own number
                        </button>
                      </div>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="px-4 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-gray-100 mt-2">
                      🚀 Quick Actions
                    </div>
                    
                    <div className="p-2 space-y-2">
                      {/* Verify Your Own Number */}
                      <button 
                        onClick={() => {
                          router.push("/dashboard/settings");
                          setShowCallerOptions(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-blue-50 transition-colors border border-dashed border-blue-200 rounded-lg"
                      >
                        <div className="h-4 w-4 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="h-2 w-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-700 text-sm font-medium">Verify your number</span>
                        <span className="ml-auto bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">FREE</span>
                      </button>
                      
                      {/* Buy More Numbers */}
                      <button 
                        onClick={() => {
                          router.push("/dashboard/buy-number");
                          setShowCallerOptions(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-green-50 transition-colors border border-dashed border-green-200 rounded-lg"
                      >
                        <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="text-gray-700 text-sm font-medium">Buy phone number</span>
                        <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">PREMIUM</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            

            
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

          {/* Simple Number Keypad */}
          <div className="px-6 mb-6">
            <div className="grid grid-cols-3 gap-4">
              {/* Row 1: 1, 2, 3 */}
              <button
                onClick={() => handleNumberInput("1")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">1</span>
              </button>
              <button
                onClick={() => handleNumberInput("2")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">2</span>
              </button>
              <button
                onClick={() => handleNumberInput("3")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">3</span>
              </button>

              {/* Row 2: 4, 5, 6 */}
              <button
                onClick={() => handleNumberInput("4")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">4</span>
              </button>
              <button
                onClick={() => handleNumberInput("5")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">5</span>
              </button>
              <button
                onClick={() => handleNumberInput("6")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">6</span>
              </button>

              {/* Row 3: 7, 8, 9 */}
              <button
                onClick={() => handleNumberInput("7")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">7</span>
              </button>
              <button
                onClick={() => handleNumberInput("8")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">8</span>
              </button>
              <button
                onClick={() => handleNumberInput("9")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">9</span>
              </button>

              {/* Row 4: *, 0, # */}
              <button
                onClick={() => handleNumberInput("*")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">*</span>
              </button>
              <button
                onClick={() => handleNumberInput("0")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">0</span>
              </button>
              <button
                onClick={() => handleNumberInput("#")}
                disabled={isCalling}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200 disabled:opacity-50"
              >
                <span className="text-2xl font-light text-gray-800">#</span>
              </button>
            </div>
          </div>

          {/* Quick Contacts Section */}
          {contacts.length > 0 && (
            <div className="px-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-700 text-sm font-medium">Quick Contacts</h3>
                <button
                  onClick={() => router.push("/dashboard/contacts")}
                  className="text-blue-600 text-xs hover:text-blue-700 transition-colors"
                >
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {contacts.slice(0, 3).map((contact: any) => (
                  <button
                    key={contact.id}
                    onClick={() => handleContactSelect(contact)}
                    disabled={isCalling}
                    className="w-full flex items-center space-x-3 p-3 bg-white hover:bg-gray-50 rounded-xl transition-colors shadow-sm border border-gray-100 disabled:opacity-50"
                  >
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Contact className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm">{contact.name}</p>
                      <p className="text-xs text-gray-500 truncate">{contact.phoneNumber}</p>
                    </div>
                    <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Simple Call Button */}
          <div className="px-6 pb-6">
            <div className="flex justify-center mb-6">
              <button
                onClick={initiateCall}
                disabled={!phoneNumber || isCalling}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white w-16 h-16 rounded-full hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-95 transform"
              >
                <Phone className="h-7 w-7" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
