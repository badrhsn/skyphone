"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Phone, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PurchasedNumber {
  phoneNumber: string;
  country: string;
  type: string;
  monthlyPrice: number;
  setupFee: number;
}

export default function PurchaseSuccessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [purchasedNumber, setPurchasedNumber] = useState<PurchasedNumber | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (session) {
      // In a real implementation, you could fetch the purchase details
      // from the session ID passed in the URL parameters
      const sessionId = searchParams.get("session_id");
      if (sessionId) {
        // For now, we'll show a generic success message
        setLoading(false);
      } else {
        // No session ID, redirect to buy number page
        router.push("/dashboard/buy-number");
      }
    }
  }, [status, session, router, searchParams]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing your purchase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Success Icon */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Purchase Successful!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your phone number has been successfully purchased and is now active.
          </p>

          {/* Purchase Details Card */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-8 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Your New Number
            </h2>
            
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">Phone Number</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Country:</span>
                <span className="font-medium">US/Canada</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Billing:</span>
                <span className="font-medium">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 mb-8">
            <h3 className="text-lg font-bold text-blue-900 mb-3">What's Next?</h3>
            <div className="space-y-2 text-sm text-blue-800 text-left max-w-md mx-auto">
              <p>• Your number is now active and ready to use</p>
              <p>• Use it as your caller ID for outgoing calls</p>
              <p>• Access your numbers from the dashboard</p>
              <p>• Set up voicemail and call forwarding (coming soon)</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/dashboard/dialer"
              className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              Make a Call
            </Link>
            <Link
              href="/dashboard/buy-number"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors px-4 py-3"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Buy Another Number</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}