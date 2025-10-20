"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  CreditCard, 
  ArrowLeft, 
  Zap, 
  Gift, 
  TrendingUp, 
  Shield, 
  Star,
  Check,
  Sparkles,
  Phone,
  ArrowRight,
  Globe,
  Clock
} from "lucide-react";
import Link from "next/link";

const creditOptions = [
  { amount: 5, label: "Starter", bonus: 0, popular: false, calls: "~25 minutes", description: "Perfect for trying out" },
  { amount: 10, label: "Basic", bonus: 1, popular: false, calls: "~50 minutes", description: "Great for occasional calls" },
  { amount: 25, label: "Popular", bonus: 5, popular: true, calls: "~125 minutes", description: "Most chosen plan" },
  { amount: 50, label: "Pro", bonus: 10, popular: false, calls: "~250 minutes", description: "For regular callers" },
  { amount: 100, label: "Business", bonus: 25, popular: false, calls: "~500 minutes", description: "For heavy users" }
];

export default function AddCredits() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    if (value) {
      setSelectedAmount(0);
    }
  };

  const handlePayment = async () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
    
    if (amount < 5) {
      setError("Minimum amount is $5");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const data = await response.json();
        setError(data.error || "Payment failed");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            <span>Add Credits</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Power Up Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Calling</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from our flexible credit packages and start making international calls instantly
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
              {error}
            </div>
          </div>
        )}

        {/* Beautiful Credit Packages */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {creditOptions.map((option, index) => (
            <div
              key={option.amount}
              className={`group relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50 rounded-3xl border transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer ${
                selectedAmount === option.amount && !customAmount
                  ? "border-blue-400 shadow-2xl shadow-blue-200/50 ring-2 ring-blue-200 scale-105"
                  : "border-gray-200 hover:border-blue-300 hover:shadow-xl"
              } ${option.popular ? "ring-2 ring-gradient-to-r from-purple-400 to-pink-400" : ""}`}
              onClick={() => handleAmountSelect(option.amount)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Popular Badge */}
              {option.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg animate-pulse">
                    <Star className="h-3 w-3" />
                    <span>MOST POPULAR</span>
                  </div>
                </div>
              )}

              {/* Best Value Badge */}
              {option.amount >= 50 && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg transform rotate-12">
                  BEST VALUE
                </div>
              )}
              
              <div className="relative p-6 z-10">
                {/* Price Section */}
                <div className="text-center mb-6">
                  <div className="relative">
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                      ${option.amount}
                    </div>
                    <div className="absolute -top-2 -right-2 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                  </div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full inline-block">
                    {option.label}
                  </div>
                </div>
                
                {/* Bonus Section */}
                {option.bonus > 0 && (
                  <div className="bg-gradient-to-r from-green-100 via-emerald-50 to-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-center mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 opacity-50"></div>
                    <div className="relative flex items-center justify-center space-x-2">
                      <Gift className="h-4 w-4 animate-bounce" />
                      <span className="text-sm font-black">+${option.bonus} FREE BONUS</span>
                      <Sparkles className="h-3 w-3 text-green-500" />
                    </div>
                  </div>
                )}
                
                {/* Features List */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                      <Phone className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium">{option.calls}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                      <Globe className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="font-medium">190+ countries</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center">
                      <Zap className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-medium">Instant activation</span>
                  </div>
                </div>
                
                {/* Description */}
                <div className="text-xs text-gray-500 text-center mb-6 font-medium leading-relaxed">
                  {option.description}
                </div>
                
                {/* Selection Indicator */}
                {selectedAmount === option.amount && !customAmount && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl"></div>
                )}
                
                {selectedAmount === option.amount && !customAmount && (
                  <div className="flex items-center justify-center space-x-2 text-blue-600 bg-blue-50 py-2 px-4 rounded-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-bold">SELECTED</span>
                  </div>
                )}
              </div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
            </div>
          ))}
        </div>

        {/* Beautiful Custom Amount Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-gradient-to-r from-white via-blue-50/30 to-white rounded-3xl shadow-xl border border-blue-100 p-8 relative overflow-hidden hover:shadow-2xl transition-all duration-500">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 opacity-60"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 text-gray-700 px-6 py-3 rounded-full text-sm font-semibold mb-4 shadow-lg">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  <span>Custom Amount</span>
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Need a Different Amount?</h3>
              <p className="text-gray-600">Enter any amount from $5 to $1000</p>
            </div>
            
            <div className="relative group">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-bold group-focus-within:text-blue-500 transition-colors duration-300">$</span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="Enter custom amount"
                min="5"
                max="1000"
                step="0.01"
                className="w-full pl-12 pr-4 py-5 text-2xl font-bold text-center border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-gray-300 transition-all duration-300 placeholder-gray-400 shadow-sm hover:shadow-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* Compact Payment Summary */}
        {(selectedAmount > 0 || customAmount) && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    Up to <strong>3,000</strong> minutes of international calling time
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-green-600">
                  <span className="text-xs font-medium">+5% bonus minutes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Beautiful Payment Button */}
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handlePayment}
            disabled={isLoading || (selectedAmount === 0 && !customAmount)}
            className="group relative w-full bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:from-green-600 hover:via-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                <span>Processing Payment...</span>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Secure Checkout</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            )}
          </button>
          
          <div className="text-center mt-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span>256-bit SSL encryption</span>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <span>PCI DSS compliant</span>
            </div>
            <p className="text-xs text-gray-500">
              Secure payment powered by Stripe. Your payment information is encrypted and secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
