"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Phone, ArrowLeft } from "lucide-react";
import Link from "next/link";
import PageLayout, { Card, Button } from "../../../../components/PageLayout";

interface PurchasedNumber {
  id: string;
  phoneNumber: string;
  country: string;
  countryCode: string;
  city: string;
  type: string;
  monthlyPrice: number;
  setupFee: number;
  isActive: boolean;
  capabilities: any;
  purchaseDate: string;
  nextBilling: string;
}

interface PurchaseStatus {
  success: boolean;
  processing?: boolean;
  message?: string;
  purchaseType?: string;
  phoneNumber?: PurchasedNumber;
  totalPaid?: number;
  paymentStatus?: string;
  metadata?: {
    phoneNumber: string;
    country: string;
    monthlyPrice: number;
    setupFee: number;
  };
}

export default function PurchaseSuccessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseStatus = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/user/phone-numbers/purchase-status?session_id=${sessionId}`);
      const data = await response.json();
      
      if (response.ok) {
        setPurchaseStatus(data);
        
        // If still processing, retry after a delay
        if (data.processing) {
          setTimeout(() => fetchPurchaseStatus(sessionId), 3000);
        }
      } else {
        setError(data.error || "Failed to fetch purchase details");
      }
    } catch (err) {
      console.error("Error fetching purchase status:", err);
      setError("Failed to fetch purchase details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (session) {
      const sessionId = searchParams.get("session_id");
      if (sessionId) {
        fetchPurchaseStatus(sessionId);
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
          <p className="mt-4 text-gray-600">
            {purchaseStatus?.processing ? "Processing your purchase..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <PageLayout
        title="Purchase Error"
        description="There was an issue processing your purchase"
        icon={CheckCircle}
      >
        <div className="text-center space-y-6">
          <Card className="max-w-md mx-auto">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Purchase Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link href="/dashboard/buy-number">
                <Button>Try Again</Button>
              </Link>
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (purchaseStatus?.processing) {
    return (
      <PageLayout
        title="Processing Purchase"
        description="Your phone number purchase is being processed"
        icon={CheckCircle}
      >
        <div className="text-center space-y-6">
          <Card className="max-w-md mx-auto">
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Processing Your Purchase</h2>
              <p className="text-gray-600 mb-6">
                {purchaseStatus.message || "We're setting up your new phone number. This usually takes a few moments."}
              </p>
              {purchaseStatus.metadata && (
                <div className="text-left space-y-2 bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number:</span>
                    <span className="font-medium">{purchaseStatus.metadata.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Country:</span>
                    <span className="font-medium">{purchaseStatus.metadata.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">
                      ${(purchaseStatus.metadata.monthlyPrice + purchaseStatus.metadata.setupFee).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const phoneNumber = purchaseStatus?.phoneNumber;

  return (
    <PageLayout
      title="Purchase Successful!"
      description="Your phone number has been successfully purchased and is now active"
      icon={CheckCircle}
    >
      <div className="text-center space-y-8">

        {/* Purchase Details Card */}
        <Card className="max-w-md mx-auto">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Phone className="h-8 w-8 text-white" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Your New Number
            </h2>
            
            {phoneNumber && (
              <div className="text-2xl font-bold text-blue-600 mb-6">
                {phoneNumber.phoneNumber}
              </div>
            )}
            
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                  {phoneNumber?.isActive ? "Active" : "Setting up..."}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium text-gray-900">
                  {phoneNumber?.type === "TOLL_FREE" ? "Toll-Free" : "Local"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Country:</span>
                <span className="font-medium text-gray-900">
                  {phoneNumber?.country || "US/Canada"}
                </span>
              </div>
              {phoneNumber?.city && (
                <div className="flex justify-between">
                  <span className="text-gray-600">City:</span>
                  <span className="font-medium text-gray-900">{phoneNumber.city}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Cost:</span>
                <span className="font-medium text-gray-900">${phoneNumber?.monthlyPrice?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Setup Fee:</span>
                <span className="font-medium text-gray-900">${phoneNumber?.setupFee?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-gray-900">Total Paid:</span>
                <span className="text-gray-900">${purchaseStatus?.totalPaid?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Next Billing:</span>
                <span className="font-medium text-gray-900">
                  {phoneNumber?.nextBilling ? new Date(phoneNumber.nextBilling).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">What's Next?</h3>
            <div className="space-y-3 text-sm text-gray-700 max-w-md mx-auto">
              <div className="flex items-start space-x-3">
                <span className="text-green-500 font-bold">•</span>
                <span>Your number is now active and ready to use</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-blue-500 font-bold">•</span>
                <span>Use it as your caller ID for outgoing calls</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-purple-500 font-bold">•</span>
                <span>Access your numbers from the dashboard</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-indigo-500 font-bold">•</span>
                <span>Set up voicemail and call forwarding (coming soon)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button className="w-full sm:w-auto">
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/dialer">
            <Button variant="secondary" className="w-full sm:w-auto">
              Make a Call
            </Button>
          </Link>
          <Link
            href="/dashboard/buy-number"
            className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors px-4 py-3 rounded-xl hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Buy Another Number</span>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}