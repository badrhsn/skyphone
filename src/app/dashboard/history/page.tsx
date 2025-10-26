"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { History, Phone, PhoneOff, Clock, DollarSign, PhoneCall } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/PageLayout";

interface Call {
  id: string;
  fromNumber: string;
  toNumber: string;
  country: string;
  duration: number;
  cost: number;
  status: string;
  createdAt: string;
  endedAt?: string;
}

export default function CallHistory() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchCalls();
    }
  }, [status, router]);

  const fetchCalls = async () => {
    try {
      const response = await fetch("/api/calls/history");
      if (response.ok) {
        const data = await response.json();
        setCalls(data);
      } else {
        setError("Failed to fetch call history");
      }
    } catch (error) {
      console.error("Error fetching calls:", error);
      setError("An error occurred while fetching call history");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "text-[#00aff0] bg-[#e6fbff]";
      case "failed":
        return "text-red-600 bg-red-100";
      case "cancelled":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-[#00aff0] bg-[#e6fbff]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Phone className="h-4 w-4 text-[#00aff0]" />;
      case "failed":
      case "cancelled":
        return <PhoneOff className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-[#00aff0]" />;
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00aff0] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-[#00aff0]" />
            <h1 className="text-2xl font-semibold text-gray-900">Call History</h1>
          </div>

          <div className="mt-4 p-4 rounded-lg border border-dashed flex items-center justify-between bg-[#f3fbff] border-[#e6fbff]">
            <div className="text-gray-700">Need Yadaphone for the team?</div>
            <Link href="/dashboard/enterprise" className="inline-flex items-center text-white px-4 py-2 rounded-full font-semibold bg-gradient-to-r from-[#00aff0] to-[#0099d6]">
              See enterprise plans
            </Link>
          </div>

          <p className="mt-4 text-lg text-gray-700">View your call logs and statistics</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {calls.length === 0 ? (
          <Card className="p-12 text-center bg-[#f3fbff] border border-[#e6fbff]">
            <div className="relative mb-6">
              <div className="w-12 h-12 bg-[#e6fbff] rounded-full flex items-center justify-center mx-auto">
                <History className="h-5 w-5 text-[#00aff0]" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No calls yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start making calls to see your call history and statistics here.
            </p>
            <Link
              href="/dashboard/dialer"
              className="bg-gradient-to-r from-[#00aff0] to-[#0099d6] text-white px-6 py-2 rounded-2xl font-medium hover:from-[#0099d6] hover:to-[#0086c2] transition-all inline-flex items-center space-x-2"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Make Your First Call</span>
            </Link>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Call History</h3>
              <div className="space-y-3">
                {calls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-[#f3fbff] transition-all">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center border border-gray-100">
                          {getStatusIcon(call.status)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{call.toNumber}</div>
                          <div className="text-sm text-gray-500 truncate">{call.country}</div>
                        </div>
                      </div>
                    </div>

                    <div className="hidden sm:flex sm:items-center sm:space-x-6">
                      <div className="text-sm text-gray-900">{formatDuration(call.duration)}</div>
                      <div className="text-sm font-medium text-gray-900">${call.cost.toFixed(4)}</div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                          <span className="ml-1 capitalize">{call.status.toLowerCase()}</span>
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">{formatDate(call.createdAt)}</div>
                    </div>

                    <div className="ml-4 sm:ml-0">
                      <button onClick={() => router.push(`/dashboard/call/${call.id}`)} className="text-[#00aff0] hover:text-[#008fcf] px-3 py-1 rounded-full hover:bg-[#f3fbff] transition-colors text-sm font-medium">
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
