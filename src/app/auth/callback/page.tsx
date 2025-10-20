"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") {
      return; // Still loading
    }

    if (status === "unauthenticated") {
      // Not authenticated, redirect to signin
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && session?.user) {
      // Check if user is admin and redirect accordingly
      const isAdmin = session.user.isAdmin || session.user.email === 'admin@yadaphone.com';
      
      if (isAdmin) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}