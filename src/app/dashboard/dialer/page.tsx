// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
// Import new phone number formatting utilities
import { YA, dL } from "../../../lib/ep";
import { formatNumber } from "libphonenumber-js";
import * as countryFlagEmoji from "country-flag-emoji-polyfill";
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
import { useModal } from "@/components/Modal";
import useCall from '@/lib/useCall';


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


import { parsePhoneNumberFromString, getCountryCallingCode, getCountries } from 'libphonenumber-js';

// Function to detect country from phone number using libphonenumber-js
const detectCountryFromDialingCode = (phoneNumber: string): string | null => {
  const parsed = parsePhoneNumberFromString(phoneNumber);
  return parsed ? parsed.country || null : null;
};


// Get dialing code from country ISO using libphonenumber-js
const getDialingCodeFromCountry = (country: any): string => {
  if (country.code && country.code.startsWith('+')) {
    return country.code;
  }
  if (country.code) {
    try {
      return '+' + getCountryCallingCode(country.code);
    } catch {
      return country.code;
    }
  }
  return '??';
};

// Utility function to parse phone numbers and detect country
const parsePhoneNumber = (phoneNumber: string, countries: any[], rates: any[]) => {
  const cleanNumber = phoneNumber.replace(/\D/g, "");
  
  // If number starts with +, it includes country code
  if (phoneNumber.startsWith('+')) {
    const isoCode = detectCountryFromDialingCode(phoneNumber);
    if (isoCode) {
      const matchingCountry = countries.find(c => c.code === isoCode);
      const matchingRate = rates.find(r => r.countryCode === isoCode);
      
      if (matchingCountry && matchingRate) {
        return {
          country: matchingCountry,
          rate: matchingRate,
          formattedNumber: phoneNumber,
          dialingCode: isoCode ? '+' + getCountryCallingCode(isoCode as any) : ''
        };
      }
    }
  }
  
  // Special handling for common formats
  if (cleanNumber.length === 10 && !phoneNumber.startsWith('+')) {
    // Likely US/Canada number without country code
    const usCountry = countries.find(c => c.code === 'US');
    const usRate = rates.find(r => r.countryCode === 'US');
    if (usCountry && usRate) {
      return {
        country: usCountry,
        rate: usRate,
        formattedNumber: `+1${cleanNumber}`,
        dialingCode: '+1'
      };
    }
  }
  
  return null;
};

export default function Dialer() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showError, showConfirm, ModalComponent } = useModal();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [rates, setRates] = useState<CallRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<CallRate | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [callerIdOption, setCallerIdOption] = useState<"public" | "bought" | "verified">("public");
  const [showCallerOptions, setShowCallerOptions] = useState(false);
  // selectedCountry.code is the ISO (e.g. 'US') and dialingCode is the display dialing prefix (e.g. '+1')
  const [selectedCountry, setSelectedCountry] = useState({ name: "United States", flag: "🇺🇸", code: "US", dialingCode: "+1" });
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

  // Initialize call hook
  const callHook = useCall();
  const { handleCall: hookHandleCall, handleHangUp: hookHangUp, toggleMute: hookToggleMute, acceptIncomingCall, rejectIncomingCall, callStatus: hookCallStatus, isIncomingCallRinging: hookIncomingRinging, isMuted: hookIsMuted, handleDigitInput: hookSendDigits, toggleRecording: hookToggleRecording, call: hookCall, CALL_STATUS } = callHook;

  // Handle phone number from URL params (e.g., from contacts)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const numberParam = urlParams.get('number');
    const countryParam = urlParams.get('country');
    
    console.log('🔍 URL Parameters Check:', {
      numberParam,
      countriesLength: countries.length,
      ratesLength: rates.length,
      urlSearch: window.location.search
    });
    
    if (numberParam && countries.length > 0 && rates.length > 0) {
      console.log('✅ All conditions met, processing phone number:', numberParam);
      setPhoneNumber(numberParam);
      
      // First, always detect rate and update country based on phone number
      const isoCode = detectCountryFromDialingCode(numberParam);
      console.log('🔍 Detected ISO code from phone number:', isoCode);
      
      if (isoCode) {
        // Find the matching rate first (rates has all countries)
        const matchingRate = rates.find(r => r.countryCode === isoCode);
        
        console.log('🌍 Countries available:', countries.map(c => ({ code: c.code, name: c.name, flag: c.flag })));
        console.log('💰 All rates available:', rates.filter(r => r.countryCode === 'MA' || r.countryCode === 'US').map(r => ({ code: r.countryCode, country: r.country, flag: (r as any).flag })));
        console.log('🏳️ Matching rate found:', matchingRate);
        
        if (matchingRate) {
          console.log('✅ Setting rate to:', matchingRate.country);
          setSelectedRate(matchingRate);
          
          // Create a country object from the rate data
          // Find the dialing code for this ISO code
          let dialingCode = matchingRate.countryCode ? '+' + getCountryCallingCode(matchingRate.countryCode as any) : '+1';
          
          const rateBasedCountry = {
            code: dialingCode,  // Use dialing code, not ISO code
            name: matchingRate.country,
            flag: (matchingRate as any).flag || '🌍',
            rate: matchingRate.rate,
            formattedRate: `from $${matchingRate.rate.toFixed(3)}/min`,
            currency: matchingRate.currency
          };
          
          console.log('🌍 Setting country from rate data:', rateBasedCountry);
          setSelectedCountry(rateBasedCountry);
          
          // Also update the phone number display to confirm detection worked
          if (rateBasedCountry.flag === '🇲🇦') {
            console.log('🎉 SUCCESS: Morocco detected and set!');
          }
        } else {
          console.log('❌ No matching rate found for ISO:', isoCode);
          
          // Fallback: try to find in popular countries list
          const matchingCountry = countries.find(c => c.code === isoCode);
          if (matchingCountry) {
            console.log('✅ Using popular country fallback:', matchingCountry.name);
            setSelectedCountry(matchingCountry);
          }
        }
      }
      
      // If we have a country hint from the contact and no phone detection worked, use it as fallback
      if (!isoCode && countryParam) {
        const matchingCountry = countries.find(c => 
          c.name.toLowerCase() === countryParam.toLowerCase()
        );
        if (matchingCountry) {
          setSelectedCountry(matchingCountry);
        }
      }
    }
  }, [countries, rates]); // Dependencies on both countries and rates

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

  // SYNC: Real-time status sync from WebRTC hook to UI
  useEffect(() => {
    if (!hookCallStatus) return;

    // Map hook statuses to UI statuses
    const statusMap: { [key: string]: string } = {
      'pending': 'initiating',
      'ringing': 'calling',
      'early': 'calling',
      'established': 'answered',
      'connected': 'answered',
      'disconnected': 'ended',
      'failed': 'failed',
      'rejected': 'ended',
      'busy': 'failed',
    };

    const mappedStatus = statusMap[hookCallStatus] || hookCallStatus;
    setCallStatus(mappedStatus);

    // Update isCalling based on call status
    if (hookCallStatus === 'established' || hookCallStatus === 'connected') {
      setIsCalling(true);
    } else if (['disconnected', 'failed', 'rejected', 'busy'].includes(hookCallStatus)) {
      setIsCalling(false);
      setCallDuration(0);
    }
  }, [hookCallStatus]);

  // BALANCE: Poll balance every 2 seconds during active calls
  useEffect(() => {
    let balanceInterval: NodeJS.Timeout;

    if (isCalling && callStatus === "answered") {
      balanceInterval = setInterval(async () => {
        try {
          const response = await fetch("/api/user/profile");
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        } catch (error) {
          console.error("Error fetching balance during call:", error);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => clearInterval(balanceInterval);
  }, [isCalling, callStatus]);

  // CONTACT: Auto-detect contact during calls
  useEffect(() => {
    const detectContact = async () => {
      if (!isCalling || !phoneNumber) return;

      try {
        const response = await fetch(`/api/user/contacts/lookup?phone=${encodeURIComponent(phoneNumber)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.found) {
            // Store contact info but don't change UI - contact name could be shown optionally
            console.log('Contact detected during call:', data.contact);
          }
        }
      } catch (error) {
        console.error("Error detecting contact:", error);
      }
    };

    detectContact();
  }, [isCalling, phoneNumber]);

  // RECORD: Save call history when call ends
  useEffect(() => {
    const recordCall = async () => {
      // Record when: call was active, is now not active, and we have necessary data
      if (!isCalling && callStatus === "ended" && phoneNumber && selectedRate && user) {
        try {
          const cost = (callDuration / 60) * selectedRate.rate;

          // Try to detect contact
          let contactId = null;
          try {
            const contactResponse = await fetch(`/api/user/contacts/lookup?phone=${encodeURIComponent(phoneNumber)}`);
            if (contactResponse.ok) {
              const contactData = await contactResponse.json();
              if (contactData.found && contactData.contact?.id) {
                contactId = contactData.contact.id;
                // Update contact's last_called_at
                await fetch(`/api/user/contacts/lookup`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ phoneNumber, contactId }),
                });
              }
            }
          } catch (error) {
            console.error("Error updating contact last_called_at:", error);
          }

          // Record the call via the transactions endpoint
          const response = await fetch("/api/user/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "call",
              toNumber: phoneNumber,
              fromNumber: selectedCallerId,
              country: selectedCountry.name,
              duration: callDuration,
              cost: cost,
              status: "COMPLETED",
              contactId: contactId,
              callerIdType: callerIdOption,
            }),
          });

          if (response.ok) {
            console.log("Call recorded successfully");
            // Refresh user data to update balance
            fetchUserData();
          } else {
            console.error("Failed to record call");
          }
        } catch (error) {
          console.error("Error recording call:", error);
        }
      }
    };

    recordCall();
  }, [isCalling, callStatus, phoneNumber, selectedRate, selectedCountry, selectedCallerId, callerIdOption, callDuration, user]);

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
        const uniqueCountries = new Map();
        data.forEach((rate) => {
          if (!uniqueCountries.has(rate.country)) {
            const flag = rate.flag || "🌍";
            const dialingCode = rate.countryCode ? '+' + getCountryCallingCode(rate.countryCode) : '';
            uniqueCountries.set(rate.country, {
              name: rate.country,
              flag,
              code: rate.countryCode, // ISO code
              dialingCode // Store dialing code explicitly
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
    // If phone number exists, update it with the new dialing code
    if (phoneNumber) {
      const cleanNumber = phoneNumber.replace(/\D/g, "");
      let newNumber = phoneNumber;
      // If number doesn't start with +, prepend the new dialing code
      if (!phoneNumber.startsWith("+")) {
        newNumber = country.dialingCode + cleanNumber;
      } else {
        // Replace existing dialing code with new one
        const currentIsoCode = detectCountryFromDialingCode(phoneNumber);
        if (currentIsoCode) {
          const currentDialingCode = '+' + getCountryCallingCode(currentIsoCode);
          if (currentDialingCode) {
            const currentCodeDigits = currentDialingCode.replace("+", "");
            const nationalNumber = cleanNumber.substring(currentCodeDigits.length);
            newNumber = country.dialingCode + nationalNumber;
          } else {
            newNumber = country.dialingCode + cleanNumber;
          }
        } else {
          newNumber = country.dialingCode + cleanNumber;
        }
      }
      setPhoneNumber(newNumber);
      const rate = detectCountry(newNumber);
      setSelectedRate(rate || null);
    } else {
      // No phone number yet, find the rate for this country using ISO code
      const isoCode = country.code;
      const rate = rates.find(r => r.countryCode === isoCode);
      setSelectedRate(rate || null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const detectCountry = (number: string) => {
    const cleanNumber = number.replace(/\D/g, "");
    
    // If number doesn't start with +, it might be a local number
    if (!number.startsWith('+') && cleanNumber.length <= 10) {
      // Keep current selected country for local numbers
      return rates.find(rate => rate.countryCode === selectedCountry.code);
    }
    // For international numbers, use the dialing code mapping
    if (number.startsWith('+')) {
      const isoCode = detectCountryFromDialingCode(number);
      console.log('detectCountry - number:', number, 'detected ISO:', isoCode);
      if (isoCode) {
        // Find the matching rate using ISO code
        const matchingRate = rates.find(rate => rate.countryCode === isoCode);
        if (matchingRate) {
          // Update selected country to match detected rate - find by ISO code
          const matchingCountry = countries.find(c => c.code === isoCode);
          if (matchingCountry) {
            console.log('detectCountry - updating country to:', matchingCountry);
            setSelectedCountry(matchingCountry);
          }
          return matchingRate;
        }
      }
    }
    // If no match found, try to match by the selected country
    const fallbackRate = rates.find(rate => rate.countryCode === selectedCountry.code);
    return fallbackRate;
  };

  // New: Use custom parser and formatter for input
  const handleNumberChange = (value: string) => {
    if (isCalling) return;
    let inputValue = value;
    let formatted = inputValue;
    // Only auto-format if user has typed a local number for selected country
    // Dynamic local number validation for all countries using libphonenumber-js
    if (
      selectedCountry &&
      inputValue &&
      !inputValue.startsWith("+")
    ) {
      // Use libphonenumber-js to validate local number for selected country
      try {
        const { isValidNumber, parsePhoneNumberFromString } = require('libphonenumber-js');
        const parsed = parsePhoneNumberFromString(inputValue, selectedCountry.code);
        if (!parsed || !parsed.isValid()) {
          setPhoneNumber(value);
          setSelectedRate(null);
          return;
        }
      } catch (err) {
        // Fallback: if validation fails, do not format
        setPhoneNumber(value);
        setSelectedRate(null);
        return;
      }
    }
    if (
      selectedCountry &&
      inputValue &&
      !inputValue.startsWith("+") &&
      inputValue.length >= 9 && inputValue.length <= 12 &&
      selectedCountry.dialingCode
    ) {
      // Remove leading zero if present (common in Morocco and other countries)
      if (inputValue.startsWith("0")) {
        inputValue = inputValue.substring(1);
      }
      // Only prepend dialing code if not already present
      if (!inputValue.startsWith(selectedCountry.dialingCode.replace("+", ""))) {
        formatted = selectedCountry.dialingCode + inputValue;
      } else {
        formatted = "+" + inputValue;
      }
    }
    // If not enough digits, just show raw input (no + or country code)
    if (!formatted.startsWith("+") && formatted.replace(/\D/g, "").length < 9) {
      setPhoneNumber(value);
      setSelectedRate(null);
      return;
    }
    // Use YA to parse input and detect country
    const parsed = YA(formatted, phoneNumber, selectedCountry.code.replace('+', ''));
    const displayValue = dL(parsed.formattedValue, selectedCountry.code.replace('+', ''));
    setPhoneNumber(displayValue);
    // Only switch country if user types a different international code
    if (parsed.shouldUpdateCountry && parsed.detectedCountry && displayValue.startsWith("+")) {
      const detected = countries.find(c => c.code.replace('+', '') === parsed.detectedCountry || c.code === parsed.detectedCountry);
      if (detected && detected.code !== selectedCountry.code) setSelectedCountry(detected);
    }
    // Update rate
    const rate = detectCountry(displayValue);
    setSelectedRate(rate || null);
  };

  const stripFormatting = (s: string) => {
    if (!s) return "";
    // keep leading + if present, remove all other non-digits
    if (s.startsWith("+")) return "+" + s.replace(/[^\d]/g, "").replace(/^\+/, "");
    return s.replace(/[^\d]/g, "");
  };

  const handleNumberInput = (digit: string) => {
    if (isCalling) return;
    // Build the new raw input by removing formatting from the current phoneNumber
    const rawPrev = stripFormatting(phoneNumber || "");
    const newRaw = rawPrev + digit;
    // Delegate to the same formatter as keyboard input so behavior is identical
    handleNumberChange(newRaw);
  };

  const handleContactSelect = (contact: any) => {
    if (isCalling) return;
    setPhoneNumber(contact.phoneNumber);
    const rate = detectCountry(contact.phoneNumber);
    setSelectedRate(rate || null);
    setShowContactsList(false);
  };

  const deleteLastDigit = () => {
    if (isCalling) return;
    setPhoneNumber(prev => {
      const newNumber = prev.slice(0, -1);
      const rate = detectCountry(newNumber);
      setSelectedRate(rate || null);
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
      showError("Rate Not Found", "Unable to determine rates for this number. Please check the number format.");
      return;
    }

    // Check balance
    const estimatedCost = selectedRate.rate * 0.5; // Minimum 30 seconds
    if (user.balance < estimatedCost) {
      showConfirm(
        "Insufficient Balance",
        `Insufficient balance for this call. You need at least $${estimatedCost.toFixed(3)} but have $${user.balance.toFixed(2)}.\n\nWould you like to add credits now?`,
        () => router.push("/dashboard/add-credits"),
        "Add Credits",
        "Cancel"
      );
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

      // Use WebRTC via Twilio Device - pass params with dialed number
      const params = {
        To: phoneNumber,
        From: fromNumber,
        callerIdType: callerIdOption,
        callerIdInfo: JSON.stringify(callerInfo),
        PhoneNumber: phoneNumber, // For tracking
        Country: selectedCountry.name, // For tracking
        Rate: selectedRate.rate, // For cost calculation
      };

      // Call the hook's handleCall method
      await hookHandleCall(params);
      setCallStatus("calling"); // Will sync from hook via useEffect
    } catch (error) {
      console.error("Call initiation error:", error);
      showError("Call Failed", `Call failed: ${error instanceof Error ? error.message : 'WebRTC error'}. Please try again.`);
      setCallStatus("failed");
      setIsCalling(false);
    }
  };

  const endCall = async () => {
    // Use hook to hang up
    try {
      hookHangUp();
      // Set status to ended (will trigger recording via useEffect)
      setCallStatus("ended");
      // Immediately reset UI state
      setIsCalling(false);
      setCallDuration(0);
      setIsMuted(false);
      setIsSpeakerOn(false);
      setIsRecording(false);
    } catch (err) {
      console.error('Hangup error', err);
      // Force reset even on error
      setIsCalling(false);
      setCallDuration(0);
      setIsMuted(false);
      setIsSpeakerOn(false);
      setIsRecording(false);
    }
  };

  const toggleMute = () => {
    // delegate to hook
    try {
      hookToggleMute();
      // UI state will be synced from hook events; optimistic toggle for responsive feel
      setIsMuted(!isMuted);
    } catch (err) {
      console.error('Toggle mute failed', err);
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f3fbff] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00aff0] mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-[#f3fbff] to-white flex items-center justify-center p-4">
      {isCalling ? (
        // Full Screen Call Interface with iPhone shadows and Skype green  
  <div className="w-full max-w-md min-h-screen flex flex-col bg-gradient-to-br from-[#f3fbff] to-[#e6fbff] rounded-lg sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-white">
          {/* Call Status Header */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8">
            <div className="text-center mb-6 sm:mb-8 bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-2xl border border-white/30">
              <div className="text-xs sm:text-sm text-gray-600 mb-2 uppercase tracking-wide font-bold">
                {callStatus}
              </div>
              <div className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">
                {phoneNumber}
              </div>
              {selectedRate && (
                <div className="text-base sm:text-lg text-gray-700 font-medium">
                  {selectedRate.country}
                </div>
              )}
            </div>

              {/* Incoming call banner */}
              {hookIncomingRinging && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white/90 px-4 py-3 rounded-xl shadow-lg border border-gray-200 flex items-center space-x-3 z-50">
                  <div className="text-sm font-medium">Incoming call</div>
                  <button onClick={() => acceptIncomingCall()} className="bg-green-500 text-white px-3 py-1 rounded-lg">Accept</button>
                  <button onClick={() => rejectIncomingCall()} className="bg-red-500 text-white px-3 py-1 rounded-lg">Reject</button>
                </div>
              )}

            {/* Call Duration */}
            <div className="text-4xl sm:text-6xl font-bold mb-8 sm:mb-12 text-gray-900 bg-[#e6fbff]/60 backdrop-blur-sm rounded-2xl px-6 sm:px-8 py-3 sm:py-4 shadow-2xl">
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

          {/* iPhone-style Call Controls with Pill-Shaped Buttons */}
          <div className="pb-8 sm:pb-12 px-4 sm:px-8">
            <div className="flex justify-center items-center gap-4 sm:gap-6">
              {/* Recording toggle - smaller pill button */}
              <button
                onClick={async () => {
                  try {
                    // Attempt to toggle recording via hook
                    await hookToggleRecording(hookCall?.call_twilio_sid);
                    setIsRecording(prev => !prev);
                  } catch (err) {
                    console.error('Recording toggle failed', err);
                  }
                }}
                className={`px-6 sm:px-8 py-3 sm:py-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-xl active:scale-95 border-2 border-white touch-manipulation font-semibold text-sm sm:text-base ${isRecording ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V8a3 3 0 0 0-6 0v3a3 3 0 0 0 3 3z"></path><path d="M19 11v1a7 7 0 0 1-7 7 7 7 0 0 1-7-7v-1"></path></svg>
                <span className="hidden sm:inline">Record</span>
              </button>

              {/* Microphone toggle - pill button */}
              <button
                onClick={toggleMute}
                className={`px-8 sm:px-10 py-4 sm:py-5 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-xl active:scale-95 border-2 border-white touch-manipulation font-semibold text-base sm:text-lg ${
                  isMuted 
                    ? "bg-red-500 text-white hover:bg-red-600" 
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {isMuted ? <MicOff className="h-6 w-6 sm:h-7 sm:w-7" /> : <Mic className="h-6 w-6 sm:h-7 sm:w-7" />}
                <span>{isMuted ? "Muted" : "Mic"}</span>
              </button>

              {/* End Call - large red pill button (center) */}
              <button
                onClick={endCall}
                className="px-10 sm:px-14 py-4 sm:py-5 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 transition-all duration-300 shadow-2xl hover:shadow-red-500/50 active:scale-95 border-2 border-white touch-manipulation font-bold text-lg sm:text-xl"
              >
                <PhoneOff className="h-7 w-7 sm:h-8 sm:w-8" />
                <span>End</span>
              </button>

              {/* Speaker toggle - pill button */}
              <button
                onClick={toggleSpeaker}
                className={`px-8 sm:px-10 py-4 sm:py-5 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-xl active:scale-95 border-2 border-white touch-manipulation font-semibold text-base sm:text-lg ${
                  isSpeakerOn 
                    ? "bg-blue-500 text-white hover:bg-blue-600" 
                    : "bg-blue-400 text-white hover:bg-blue-500"
                }`}
              >
                {isSpeakerOn ? <Volume2 className="h-6 w-6 sm:h-7 sm:w-7" /> : <VolumeX className="h-6 w-6 sm:h-7 sm:w-7" />}
                <span>{isSpeakerOn ? "Speaker" : "Mute"}</span>
              </button>

              {/* Additional control - smaller pill button */}
              <button
                type="button"
                onClick={() => setShowCallerOptions(!showCallerOptions)}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-all duration-300 shadow-xl active:scale-95 border-2 border-white touch-manipulation font-semibold text-sm sm:text-base"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        // iPhone-style dialer with Skype blue colors and shadows
  <div className="w-full max-w-md min-h-screen flex flex-col bg-gradient-to-br from-[#f3fbff] to-white rounded-lg sm:rounded-3xl shadow-2xl border border-gray-200">
          {/* Status and Balance */}
          <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-3 sm:pb-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#00aff0] rounded-full animate-pulse shadow-lg"></div>
              <button 
                onClick={() => router.push("/dashboard/add-credits")}
                className="bg-gradient-to-r from-[#00aff0] to-[#0099d6] hover:from-[#0099d6] hover:to-[#0086c2] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 touch-manipulation"
              >
                Balance: ${user ? user.balance.toFixed(2) : "0.00"} +
              </button>
            </div>
            
              <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-white mb-4 bg-gradient-to-r from-[#00aff0] to-[#0099d6] rounded-full px-4 py-2 shadow-xl">
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
                className="flex items-center space-x-2 px-3 sm:px-4 py-3 sm:py-4 bg-[#f3fbff] hover:bg-[#e6fbff] transition-colors border-r border-gray-200"
                disabled={isCalling}
                data-country-dropdown="button"
              >
                <span className="text-xl sm:text-2xl">{selectedCountry.flag}</span>
                <span className="text-sm sm:text-base font-bold text-gray-700">{getDialingCodeFromCountry(selectedCountry)}</span>
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
                onChange={(e) => handleNumberChange(e.target.value)}
                onPaste={e => {
                  const pastedText = e.clipboardData.getData("text");
                  // Use the same logic as handleNumberChange for consistency
                  const parsed = YA(pastedText, phoneNumber, selectedCountry.code.replace('+', ''));
                  const formatted = dL(parsed.formattedValue, selectedCountry.code.replace('+', ''));
                  setPhoneNumber(formatted);
                  if (parsed.shouldUpdateCountry && parsed.detectedCountry) {
                    const detected = countries.find(c => c.code.replace('+', '') === parsed.detectedCountry || c.code === parsed.detectedCountry);
                    if (detected) setSelectedCountry(detected);
                  }
                  // Always update rate after paste
                  const rate = detectCountry(formatted);
                  setSelectedRate(rate || null);
                  e.preventDefault();
                }}
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
                className="p-1.5 mr-2 hover:bg-[#f3fbff] rounded-full transition-colors text-[#00aff0] flex-shrink-0"
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
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
                    filteredCountries.map((country) => (
                      <button
                        key={country.code + country.name}
                        onClick={() => handleCountrySelect(country)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-[#f3fbff] transition-colors text-left ${
                          selectedCountry.code === country.code ? "bg-[#e6fbff] text-[#00aff0]" : "text-gray-700"
                        }`}
                      >
                        <span className="text-xl">{country.flag}</span>
                        <span className="font-medium flex-1">{country.name}</span>
                        <span className="text-[#00aff0] font-bold">{getDialingCodeFromCountry(country)}</span>
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
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
                        className="bg-[#00aff0] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0099d6] transition-colors"
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
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-[#f3fbff] transition-colors text-left border-b border-gray-100 last:border-b-0"
                          >
                            <div className="bg-[#e6fbff] p-2 rounded-full">
                              <Contact className="w-4 h-4 text-[#00aff0]" />
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
          </div>

          {/* Call From Options */}
          <div className="px-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-700 text-sm font-medium">Call from:</span>
              <div className="relative">
                <button 
                  onClick={() => setShowCallerOptions(!showCallerOptions)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white rounded-full px-4 py-2 text-sm shadow-xl hover:shadow-2xl hover:from-[#0099d6] hover:to-[#0086c2] transition-all duration-300"
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
                  <div className="absolute right-0 mt-2 w-72 bg-gradient-to-br from-[#f3fbff] to-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 max-h-96 overflow-y-auto" data-caller-dropdown="menu">
                    
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
                          className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-[#f3fbff] transition-colors ${
                            callerIdOption === "public" && selectedCallerId === number.phoneNumber ? "bg-[#e6fbff] border-r-2 border-[#00aff0]" : ""
                          }`}
                        >
                          <Globe className="h-5 w-5 text-[#00aff0]" />
                          <div className="flex-1 text-left">
                            <div className="text-gray-900 font-medium">{number.phoneNumber}</div>
                            <div className="text-xs text-gray-500">{number.country}</div>
                          </div>
                          {callerIdOption === "public" && selectedCallerId === number.phoneNumber && 
                            <div className="w-2 h-2 bg-[#00aff0] rounded-full"></div>
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
                        className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-[#f3fbff] transition-colors ${
                          callerIdOption === "public" ? "bg-[#e6fbff] border-r-2 border-[#00aff0]" : ""
                        }`}
                      >
                        <Globe className="h-5 w-5 text-[#00aff0]" />
                        <div className="flex-1 text-left">
                          <div className="text-gray-900 font-medium">+12293983710</div>
                          <div className="text-xs text-gray-500">United States • Default</div>
                        </div>
                        {callerIdOption === "public" && 
                          <div className="w-2 h-2 bg-[#00aff0] rounded-full"></div>
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
                          className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-[#f3fbff] transition-colors ${
                              callerIdOption === "bought" && selectedCallerId === number.phoneNumber ? "bg-[#e6fbff] border-r-2 border-[#00aff0]" : ""
                            }`}
                        >
                            <Phone className="h-5 w-5 text-green-600" />
                          <div className="flex-1 text-left">
                            <div className="text-gray-900 font-medium">{number.phoneNumber}</div>
                            <div className="text-xs text-green-600">${number.monthlyFee}/month</div>
                          </div>
                          {callerIdOption === "bought" && selectedCallerId === number.phoneNumber && 
                              <div className="w-2 h-2 bg-[#00aff0] rounded-full"></div>
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
                          className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-[#f3fbff] transition-colors ${
                              callerIdOption === "verified" && selectedCallerId === callerId.phoneNumber ? "bg-[#e6fbff] border-r-2 border-[#00aff0]" : ""
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
                            <div className="w-2 h-2 bg-[#00aff0] rounded-full"></div>
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
                          className="text-[#00aff0] hover:text-[#0099d6] text-xs font-medium"
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
                        className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-[#f3fbff] transition-colors border border-dashed border-gray-200 rounded-lg"
                      >
                        <div className="h-4 w-4 bg-[#e6fbff] rounded-full flex items-center justify-center">
                          <svg className="h-2 w-2 text-[#00aff0]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-700 text-sm font-medium">Verify your number</span>
                        <span className="ml-auto bg-[#e6fbff] text-[#00aff0] text-xs px-2 py-1 rounded-full font-medium">FREE</span>
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
            

            
          </div>

          {selectedRate && (
            <div className="px-6 mb-6">
              <div className="bg-gradient-to-r from-[#f3fbff] to-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-center space-x-3">
                  <Globe className="h-4 w-4 text-[#00aff0]" />
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
                onClick={() => isCalling ? hookSendDigits("1") : handleNumberInput("1")}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200"
              >
                <span className="text-2xl font-light text-gray-800">1</span>
              </button>
              <button
                onClick={() => isCalling ? hookSendDigits("2") : handleNumberInput("2")}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200"
              >
                <span className="text-2xl font-light text-gray-800">2</span>
              </button>
              <button
                onClick={() => isCalling ? hookSendDigits("3") : handleNumberInput("3")}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200"
              >
                <span className="text-2xl font-light text-gray-800">3</span>
              </button>

              {/* Row 2: 4, 5, 6 */}
              <button
                onClick={() => isCalling ? hookSendDigits("4") : handleNumberInput("4")}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200"
              >
                <span className="text-2xl font-light text-gray-800">4</span>
              </button>
              <button
                onClick={() => isCalling ? hookSendDigits("5") : handleNumberInput("5")}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200"
              >
                <span className="text-2xl font-light text-gray-800">5</span>
              </button>
              <button
                onClick={() => isCalling ? hookSendDigits("6") : handleNumberInput("6")}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200"
              >
                <span className="text-2xl font-light text-gray-800">6</span>
              </button>

              {/* Row 3: 7, 8, 9 */}
              <button
                onClick={() => isCalling ? hookSendDigits("7") : handleNumberInput("7")}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200"
              >
                <span className="text-2xl font-light text-gray-800">7</span>
              </button>
              <button
                onClick={() => isCalling ? hookSendDigits("8") : handleNumberInput("8")}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200"
              >
                <span className="text-2xl font-light text-gray-800">8</span>
              </button>
              <button
                onClick={() => isCalling ? hookSendDigits("9") : handleNumberInput("9")}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200"
              >
                <span className="text-2xl font-light text-gray-800">9</span>
              </button>

              {/* Row 4: *, 0, # */}
              <button
                onClick={() => isCalling ? hookSendDigits("*") : handleNumberInput("*")}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200"
              >
                <span className="text-2xl font-light text-gray-800">*</span>
              </button>
              <button
                onClick={() => isCalling ? hookSendDigits("0") : handleNumberInput("0")}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200"
              >
                <span className="text-2xl font-light text-gray-800">0</span>
              </button>
              <button
                onClick={() => isCalling ? hookSendDigits("#") : handleNumberInput("#")}
                className="w-16 h-16 mx-auto rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 flex items-center justify-center shadow-lg border border-gray-200"
              >
                <span className="text-2xl font-light text-gray-800">#</span>
              </button>
            </div>
          </div>

          {/* Quick Contacts removed as requested */}

          {/* Simple Call Button */}
          <div className="px-6 pb-6">
              <div className="flex justify-center mb-6">
              <button
                onClick={initiateCall}
                disabled={!phoneNumber || isCalling}
                className="bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white w-16 h-16 rounded-full hover:from-[#0099d6] hover:to-[#0086c2] disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-95 transform"
              >
                <Phone className="h-7 w-7" />
              </button>
            </div>
          </div>
        </div>
      )}
      {ModalComponent}
    </div>
  );
}
