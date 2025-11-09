"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [amount, setAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    
    if (sessionId) {
      // In a real implementation, you would verify the payment with Stripe
      // and update the user's balance
      setAmount(10); // Placeholder amount
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Success Animation */}
          <div className="relative mb-8">
            <div className="mx-auto w-32 h-32 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
              <CheckCircle className="h-16 w-16 text-white" />
            </div>
            <div className="absolute inset-0 w-32 h-32 mx-auto bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-ping opacity-75"></div>
          </div>

          {/* Success Message */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              🎉 Payment <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">Successful!</span>
            </h1>
            
            <div className="max-w-2xl mx-auto mb-8">
              <p className="text-xl text-gray-700 mb-4">
                Fantastic! Your account has been credited with <span className="font-bold text-green-600">${amount}</span>
              </p>
              <p className="text-gray-600">
                You're all set to make crystal-clear international calls to over 150 countries!
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-6">
                <div className="text-3xl font-bold text-green-600 mb-2">${amount}</div>
                <div className="text-sm text-green-700">Credits Added</div>
              </div>
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">150+</div>
                <div className="text-sm text-blue-700">Countries Available</div>
              </div>
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">Instant</div>
                <div className="text-sm text-purple-700">Activation</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard/dialer"
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:from-green-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                🚀 Start Calling Now
              </Link>
              <Link
                href="/dashboard"
                className="bg-white text-gray-700 px-8 py-4 rounded-xl text-lg font-medium hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-left max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">💡 Quick Tips</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start space-x-3">
                <span className="text-blue-500">•</span>
                <span>Your credits never expire - use them whenever you need to make calls</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-blue-500">•</span>
                <span>Check your balance anytime from the dashboard</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-blue-500">•</span>
                <span>View detailed call history and costs in your account</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
