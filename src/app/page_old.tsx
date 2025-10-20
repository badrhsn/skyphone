"use client";

import { Phone, CheckCircle, ArrowRight, X, Plus, User, CreditCard, Shield, Clock, MessageSquare, Globe, Star, Building, Zap, HeadphonesIcon } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Rate {
  id: string;
  country: string;
  countryCode: string;
  mobileRate: number;
  landlineRate: number;
  isActive: boolean;
}

function HomeRateCalculator() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("United States");
  const [callType, setCallType] = useState<"mobile" | "landline">("mobile");
  const [loading, setLoading] = useState(true);

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
    : 0;

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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading rates...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center space-x-4 mb-6">
        <span className="text-lg font-medium text-gray-700">I'm calling</span>
        <select 
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="border border-blue-300 rounded-lg px-4 py-2 bg-white text-gray-800 focus:border-blue-500"
        >
          {rates.length > 0 ? (
            rates.slice(0, 10).map((rate) => (
              <option key={rate.id} value={rate.country}>
                {getCountryFlag(rate.country)} {rate.country}
              </option>
            ))
          ) : (
            <option value="United States">🇺🇸 United States</option>
          )}
        </select>
      </div>
      
      <div className="flex justify-center space-x-4 mb-8">
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
      
      <div className="bg-white rounded-2xl p-6 text-center">
        <p className="text-gray-600 mb-2">Your call will cost</p>
        <p className="text-4xl font-bold text-gray-800 mb-4">
          ${typeof currentRate === 'number' ? currentRate.toFixed(3) : '0.000'} <span className="text-lg font-normal text-gray-600">per minute</span>
        </p>
        <Link href="/auth/signup" className="bg-blue-500 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-blue-600 transition-colors">
          Call {getCountryFlag(selectedCountry)} {selectedCountry} now
        </Link>
      </div>
    </>
  );
}

export default function Home() {

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-white to-gray-50 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8 text-center lg:text-left">
              <div>
                <h1 className="text-6xl lg:text-7xl font-normal text-gray-900 leading-tight tracking-tight">
                  Continue calling<br />
                  <span className="font-light">on Mac</span>
                </h1>
              </div>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg font-light">
                With Skyphone, start a call on your iPhone and continue the conversation on your Mac nearby.
              </p>
              
              <div className="space-y-6">
                <p className="text-base text-gray-500">
                  Requires macOS 12.1 or newer.
                </p>
                
                <p className="text-sm text-gray-500">
                  By installing Skyphone, you agree to our{" "}
                  <Link href="/terms-and-conditions" className="text-blue-600 hover:underline">Terms</Link>
                  {" "}&{" "}
                  <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                </p>
                
                <Link 
                  href="/auth/signup" 
                  className="inline-flex items-center space-x-3 bg-blue-500 hover:bg-blue-600 text-white px-10 py-4 rounded-full text-lg font-medium transition-all transform hover:scale-105 shadow-lg"
                >
                  <Download className="h-5 w-5" />
                  <span>Download app</span>
                </Link>
              </div>
            </div>
            
            {/* Right Content - Device Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                {/* Main Device Frame */}
                <div className="bg-gray-100 rounded-2xl p-6 shadow-2xl border border-gray-200 max-w-sm mx-auto transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-white rounded-xl p-4 shadow-inner">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <MessageCircle className="h-5 w-5 text-white" />
                          </div>
                          <span className="font-medium text-gray-900">Chats</span>
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                      
                      {/* Contact List */}
                      <div className="space-y-3">
                        {["Alice Johnson", "Bob Smith", "Carol Wilson", "David Brown"].map((name, i) => (
                          <div key={i} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">{name[0]}</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">{name}</p>
                              <p className="text-gray-500 text-xs">Online</p>
                            </div>
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <Phone className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Phone */}
                <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-gray-200 transform -rotate-12 hover:rotate-0 transition-transform duration-500">
                  <div className="w-16 h-24 bg-gray-900 rounded-lg flex items-center justify-center">
                    <div className="text-blue-400">
                      <Phone className="h-8 w-8" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Calculator Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-light text-gray-900 mb-4">
              Calculate Your Call Cost
            </h2>
            <p className="text-lg text-gray-600">
              See how affordable international calling can be
            </p>
          </div>
          
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <HomeRateCalculator />
          </div>
        </div>
      </div>
    </div>
  );
}
          </div>
        </div>
      </div>

      {/* 3 Steps Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            How to Make International Calls in 3 Simple Steps
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-blue-50 rounded-2xl p-8 text-center">
            <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Sign Up</h3>
            <p className="text-gray-600 mb-4">Sign up in seconds with just your email - no phone verification needed</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>No authentication required</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>No phone numbers required</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-8 text-center">
            <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Credits</h3>
            <p className="text-gray-600 mb-4">Purchase credits and only pay for the minutes you actually use</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>No subscriptions or recurring fees</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>Pay only for minutes you use</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-8 text-center">
            <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Phone className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Call Anywhere</h3>
            <p className="text-gray-600 mb-4">Call any landline or institution worldwide directly from your browser</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>Available in all countries</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>Calls routed through a secure system</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/auth/signup" className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors">
            Get started
          </Link>
        </div>
      </div>

      {/* Business Section */}
      <div className="bg-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Building className="h-8 w-8 text-blue-500" />
              <h2 className="text-3xl font-bold text-gray-800">Skyphone for business</h2>
            </div>
            <p className="text-lg text-gray-600">Cheap calls to 180+ countries from browser</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-blue-100 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-3">
                <CheckCircle className="h-6 w-6 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-800">Record calls</h3>
              </div>
              <p className="text-gray-600">and access AI transcripts</p>
            </div>
            
            <div className="bg-blue-100 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-3">
                <CheckCircle className="h-6 w-6 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-800">Add free unlimited members</h3>
              </div>
              <p className="text-gray-600">in one account and one corporate wallet</p>
            </div>
            
            <div className="bg-blue-100 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-3">
                <CheckCircle className="h-6 w-6 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-800">Get priority support</h3>
              </div>
              <p className="text-gray-600">we're just a message away — 24/7</p>
            </div>
            
            <div className="bg-blue-100 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-3">
                <CheckCircle className="h-6 w-6 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-800">Customize your setup</h3>
              </div>
              <p className="text-gray-600">with features your business needs</p>
            </div>
          </div>
          
          <div className="text-center">
            <Link href="/enterprise" className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors">
              See enterprise plans
            </Link>
          </div>
        </div>
      </div>

      {/* Why Choose Skyphone Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Why Choose Skyphone for International Calls?
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-blue-50 rounded-2xl p-8">
            <div className="flex items-center space-x-4 mb-4">
              <Globe className="h-8 w-8 text-blue-500" />
              <h3 className="text-xl font-bold text-gray-800">Call Anywhere, From Anywhere</h3>
            </div>
            <p className="text-gray-600 mb-4">Make international calls to any country without restrictions, directly from your browser.</p>
            <p className="text-sm text-blue-600 font-medium">Get Free Caller Registry</p>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-8">
            <div className="flex items-center space-x-4 mb-4">
              <Shield className="h-8 w-8 text-blue-500" />
              <h3 className="text-xl font-bold text-gray-800">No Country Restrictions</h3>
            </div>
            <p className="text-gray-600">Our service works globally, allowing you to connect with people and institutions worldwide</p>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-8">
            <div className="flex items-center space-x-4 mb-4">
              <Zap className="h-8 w-8 text-blue-500" />
              <h3 className="text-xl font-bold text-gray-800">No Apps or Subscriptions</h3>
            </div>
            <p className="text-gray-600">Start calling in 2 minutes directly from your browser without installing any apps or committing to subscriptions</p>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-8">
            <div className="flex items-center space-x-4 mb-4">
              <CreditCard className="h-8 w-8 text-blue-500" />
              <h3 className="text-xl font-bold text-gray-800">Credit Based, No Subscription</h3>
            </div>
            <p className="text-gray-600">Pay only for what you use with our flexible credit system - no recurring fees or contracts</p>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-8">
            <div className="flex items-center space-x-4 mb-4">
              <Phone className="h-8 w-8 text-blue-500" />
              <h3 className="text-xl font-bold text-gray-800">Buy Phone Numbers</h3>
            </div>
            <p className="text-gray-600">Purchase virtual phone numbers from various countries</p>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-8">
            <div className="flex items-center space-x-4 mb-4">
              <User className="h-8 w-8 text-blue-500" />
              <h3 className="text-xl font-bold text-gray-800">Custom Caller ID</h3>
            </div>
            <p className="text-gray-600">Set your own caller ID for outgoing calls</p>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-8">
            <div className="flex items-center space-x-4 mb-4">
              <Shield className="h-8 w-8 text-blue-500" />
              <h3 className="text-xl font-bold text-gray-800">Secure and Private</h3>
            </div>
            <p className="text-gray-600 mb-4">All calls are encrypted and your data is protected</p>
            <p className="text-sm text-blue-600 font-medium">Learn about privacy</p>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-8">
            <div className="flex items-center space-x-4 mb-4">
              <HeadphonesIcon className="h-8 w-8 text-blue-500" />
              <h3 className="text-xl font-bold text-gray-800">Receive Calls In Browser</h3>
            </div>
            <p className="text-gray-600">Accept incoming calls directly in your browser</p>
          </div>
        </div>
        
        <div className="text-center mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 inline-block">
            <p className="text-gray-600 mb-4">Test our features with a free account.</p>
            <Link href="/auth/signup" className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">
              What Our Users Say
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-100 rounded-2xl p-8">
              <div className="flex items-start space-x-3 mb-4">
                <MessageSquare className="h-6 w-6 text-blue-500 mt-1" />
                <p className="text-gray-700 italic">
                  "Skyphone works great! The sound quality is better than the alternatives and much easier to use. Will be using from now on!"
                </p>
              </div>
              <div className="ml-9">
                <p className="font-semibold text-gray-800">Nicolas P.</p>
                <p className="text-sm text-gray-600">Cyprus</p>
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-2xl p-8">
              <div className="flex items-start space-x-3 mb-4">
                <MessageSquare className="h-6 w-6 text-blue-500 mt-1" />
                <p className="text-gray-700 italic">
                  "I use Skyphone weekly to call my family abroad. It's much more affordable than my phone carrier's international rates."
                </p>
              </div>
              <div className="ml-9">
                <p className="font-semibold text-gray-800">Miguel R.</p>
                <p className="text-sm text-gray-600">Canada</p>
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-2xl p-8">
              <div className="flex items-start space-x-3 mb-4">
                <MessageSquare className="h-6 w-6 text-blue-500 mt-1" />
                <p className="text-gray-700 italic">
                  "I lost access to my bank while nomading in Southeast Asia. I stumbled upon Skyphone, called my bank, and solved everything in no time!"
                </p>
              </div>
              <div className="ml-9">
                <p className="font-semibold text-gray-800">James M.</p>
                <p className="text-sm text-gray-600">United States</p>
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-2xl p-8">
              <div className="flex items-start space-x-3 mb-4">
                <MessageSquare className="h-6 w-6 text-blue-500 mt-1" />
                <p className="text-gray-700 italic">
                  "I had to call the tax authorities in my base country from abroad. I've spent hours talking to tax officials on Skyphone and only spent a couple of dollars. Everything was perfect and it saved me a lot of!"
                </p>
              </div>
              <div className="ml-9">
                <p className="font-semibold text-gray-800">Thomas L.</p>
                <p className="text-sm text-gray-600">Germany</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ready to Call CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Ready to make your first call?
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          See the simplicity of browser-based calling with crystal-clear audio quality and affordable international rates yourself.
        </p>
        <Link href="/auth/signup" className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors">
          Start calling
        </Link>
      </div>

      {/* Comparison Table */}
      <div className="bg-blue-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">
              Why Choose Skyphone?
            </h2>
          </div>
          
          <div className="bg-white rounded-2xl p-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-800">Features</th>
                  <th className="text-center py-4 px-6 font-semibold text-blue-600">Skyphone</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-600">Google Voice</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-600">Viber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-800">Browser-Based</p>
                      <p className="text-xs text-gray-500">Make calls directly from your web browser, no apps required</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-800">No Phone Authentication Required</p>
                      <p className="text-xs text-gray-500">Start calling immediately without verifying your phone number</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-800">Global Coverage</p>
                      <p className="text-xs text-gray-500">Call any country worldwide without restrictions</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-800">Instant Setup</p>
                      <p className="text-xs text-gray-500">No waiting time or verification</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-800">No Subscription Required</p>
                      <p className="text-xs text-gray-500">Pay only for what you use</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-800">Competitive Rates</p>
                      <p className="text-xs text-gray-500">Best affordable calling for international numbers</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-800">No Restrictions</p>
                      <p className="text-xs text-gray-500">No country or usage limitations</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <X className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                </tr>
                <tr className="bg-blue-50">
                  <td className="py-4 px-6 font-semibold text-gray-800">Pricing Model</td>
                  <td className="py-4 px-6 text-center text-sm">
                    <span className="text-blue-600 font-medium">Pay-as-you-go with competitive rates</span>
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-gray-600">
                    Free for US calls, international rates apply
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-gray-600">
                    Subscription + per-minute rates
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Ready to experience the Skyphone difference?
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Start making cheap international calls today with no setup, no subscriptions, and no restrictions.
        </p>
        <Link href="/auth/signup" className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors">
          Try Skyphone Now
        </Link>
      </div>

      {/* Rate Calculator */}
      <div className="bg-blue-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Calculate Your Call Cost
            </h2>
            <div className="inline-block bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-sm text-gray-600 mb-2">Need Skyphone for the team?</p>
              <Link href="/enterprise" className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                See enterprise plans
              </Link>
            </div>
          </div>
          
          <div className="bg-blue-100 rounded-3xl p-8">
            <div className="max-w-2xl mx-auto">
              <HomeRateCalculator />
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Frequently Asked Questions
          </h2>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200">
              <button
                onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-800">{faq}</span>
                <ArrowRight className={`h-5 w-5 text-gray-400 transition-transform ${faqOpen === index ? 'rotate-90' : ''}`} />
              </button>
              {faqOpen === index && (
                <div className="px-6 pb-4 text-gray-600">
                  <p>This is a placeholder answer for the FAQ question. The actual implementation would include detailed answers for each question.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
