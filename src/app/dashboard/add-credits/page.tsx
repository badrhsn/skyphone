"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  CreditCard, 
  
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
  { amount: 5, label: "$5", bonus: 0, popular: false, calls: "~25 minutes", description: "Perfect for trying out" },
  { amount: 10, label: "$10", bonus: 0, popular: false, calls: "~50 minutes", description: "Great for occasional calls" },
  { amount: 20, label: "$20", bonus: 0, popular: true, calls: "~100 minutes", description: "Most Popular" },
  { amount: 50, label: "$50", bonus: 5, popular: false, calls: "~250 minutes", description: "5% free" },
  { amount: 100, label: "$100", bonus: 10, popular: false, calls: "~500 minutes", description: "10% free" }
];

export default function AddCredits() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState(20);
  const [customAmount, setCustomAmount] = useState("");
  const [autoTopup, setAutoTopup] = useState(false);
  const [autoTopupThreshold, setAutoTopupThreshold] = useState(5); // when balance <= this value
  const [autoTopupAmount, setAutoTopupAmount] = useState(20); // amount to top-up
  const [invoiceRequired, setInvoiceRequired] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Save auto-topup preferences immediately when changed
  const saveAutoTopupPreferences = async (prefs: { enabled?: boolean; threshold?: number; amount?: number }) => {
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoTopupEnabled: prefs.enabled,
          autoTopupThreshold: prefs.threshold,
          autoTopupAmount: prefs.amount,
        }),
      });
    } catch (err) {
      console.error('Failed to save auto-topup preferences', err);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00aff0] mx-auto"></div>
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
        body: JSON.stringify({
          amount,
          autoTopup,
          autoTopupThreshold,
          autoTopupAmount,
          invoiceRequired,
          promoCode,
        }),
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
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-[#00aff0]" />
            <h1 className="text-2xl font-semibold text-gray-900">Select Your Credit Amount</h1>
          </div>

          <div className="mt-4 p-4 rounded-lg border border-dashed flex items-center justify-between" style={{ borderColor: '#cfeeff', backgroundColor: '#f5fbff' }}>
            <div className="text-gray-700">Need Yadaphone for the team?</div>
            <Link href="/dashboard/enterprise" className="inline-flex items-center text-white px-4 py-2 rounded-full font-semibold" style={{ backgroundColor: '#00aff0' }}>
              See enterprise plans
            </Link>
          </div>

          <p className="mt-4 text-lg text-gray-700">Your credits are used to make international calls at competitive rates. <Link href="/rates" className="underline text-[#00aff0]">View our detailed rate calculator →</Link></p>
        </div>

        {/* Simple Plans Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {creditOptions.slice(0,4).map((opt) => (
            <button
              key={opt.amount}
              onClick={() => handleAmountSelect(opt.amount)}
              className={`w-full text-left p-3 rounded-xl border ${selectedAmount === opt.amount && !customAmount ? 'border-[#00aff0] bg-[#e6fbff]' : 'border-gray-200 bg-white'} hover:shadow transition`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">{opt.description}</div>
                  <div className="text-lg font-bold text-gray-900">${opt.amount}</div>
                </div>
                <div className="text-right text-xs text-gray-400">{opt.calls}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Amount */}
          <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Custom amount (min $5)</label>
          <div className="flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">$</span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              min={5}
              step="0.01"
              className="flex-1 block w-full rounded-r-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
              style={{ boxShadow: '0 0 0 3px rgba(0,175,240,0.06)' }}
              placeholder="Enter amount"
            />
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-6 p-4 rounded-xl border border-gray-100" style={{ backgroundColor: '#f3fbff' }}>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Instant activation — start calling immediately</li>
            <li>• Works in 190+ countries</li>
            <li>• Secure payments via Stripe (PCI compliant)</li>
          </ul>
        </div>

        {/* Auto top-up, invoice and promo code */}
        <div className="mb-6 grid grid-cols-1 gap-4">
          <div>
            <label className="flex items-start space-x-3">
              <input type="checkbox" checked={autoTopup} onChange={(e) => setAutoTopup(e.target.checked)} className="mt-1" />
              <div>
                <div className="text-sm font-medium text-gray-900">Enable Auto Top-up</div>
                <div className="text-sm text-gray-600">Avoid interrupting an important call</div>
              </div>
            </label>

            {autoTopup && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Top-up threshold (USD)</label>
                  <input
                    type="number"
                    min={1}
                    step="0.5"
                    value={autoTopupThreshold}
                    onChange={e => {
                      const val = parseFloat(e.target.value || '0');
                      setAutoTopupThreshold(val);
                      saveAutoTopupPreferences({ threshold: val });
                    }}
                    className="w-full rounded-md border border-gray-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
                  />
                  <p className="text-xs text-gray-500">Trigger when balance ≤ this amount</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Top-up amount (USD)</label>
                  <input
                    type="number"
                    min={5}
                    step="1"
                    value={autoTopupAmount}
                    onChange={e => {
                      const val = parseFloat(e.target.value || '0');
                      setAutoTopupAmount(val);
                      saveAutoTopupPreferences({ amount: val });
                    }}
                    className="w-full rounded-md border border-gray-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
                  />
                  <p className="text-xs text-gray-500">Amount to add automatically</p>
                </div>
              </div>
            )}
          </div>

          <label className="flex items-start space-x-3">
            <input type="checkbox" checked={invoiceRequired} onChange={(e) => setInvoiceRequired(e.target.checked)} className="mt-1" />
            <div>
              <div className="text-sm font-medium text-gray-900">Issue tax-deductible invoice</div>
              <div className="text-sm text-gray-600">(address required)</div>
            </div>
          </label>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Promo Code (Optional)"
              className="flex-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00aff0]"
            />
            <button onClick={() => {/* promo apply placeholder */}} className="px-3 py-2 bg-[#eaf7ff] rounded-md text-sm text-[#00aff0]">Apply</button>
          </div>
        </div>

        {/* Summary & CTA */}
        <div className="mb-6 p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">Amount</div>
            <div className="text-lg font-semibold text-gray-900">${customAmount ? parseFloat(customAmount || '0').toFixed(2) : (selectedAmount || 0).toFixed(2)}</div>
          </div>
          <div className="text-sm text-gray-500 mb-4">You will be redirected to Stripe to complete the purchase.</div>

          {error && (
            <div className="mb-3 text-sm text-red-600">{error}</div>
          )}

          <button
            onClick={handlePayment}
            disabled={isLoading || (selectedAmount === 0 && !customAmount)}
            className="w-full inline-flex items-center justify-center px-4 py-3 bg-[#00aff0] text-white rounded-xl hover:bg-[#0095d6] disabled:opacity-50 shadow-md hover:shadow-lg transition-transform"
            style={{ transform: 'translateZ(0)' }}
          >
            {isLoading ? (
              <span>Processing…</span>
            ) : (
              <span>Checkout — Pay ${customAmount ? parseFloat(customAmount || '0').toFixed(2) : (selectedAmount || 0).toFixed(2)}</span>
            )}
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-[#00aff0]" />
              <span>Secure Checkout</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="text-sm">100% Money Back Guarantee. No Questions Asked.</div>
          </div>

          <div className="text-xs text-gray-500 text-center">*VAT may be added depending on your country and payment method</div>

          <div className="pt-6 border-t border-gray-100">
            <div className="bg-[#f3fbff] border border-[#e6fbff] rounded-2xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Frequently Asked Questions</h3>
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <div className="font-medium text-gray-900">How do credits work?</div>
                  <p className="mt-1 text-gray-600">Credits are added to your account balance immediately and automatically used when you make calls.</p>
                </div>

                <div>
                  <div className="font-medium text-gray-900">Can I get a refund?</div>
                  <p className="mt-1 text-gray-600">We offer full no-questions-asked refunds and make up credits for the calls that don't work as expected. Please contact our support team if you experience any issues. We aim to provide the best service possible.</p>
                </div>

                <div>
                  <div className="font-medium text-gray-900">How are call rates calculated?</div>
                  <p className="mt-1 text-gray-600">Rates vary by country. Check our rate calculator for specific pricing.</p>
                </div>

                <div>
                  <div className="font-medium text-gray-900">Is there a minimum purchase?</div>
                  <p className="mt-1 text-gray-600">Yes, the minimum purchase amount is $5 to cover processing fees.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">By continuing you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</div>
        </div>
      </div>
    </div>
  );
}
