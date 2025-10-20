"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthTest() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [authState, setAuthState] = useState('');

  useEffect(() => {
    setAuthState(`Status: ${status}, User: ${session?.user?.email || 'None'}, Admin: ${session?.user?.isAdmin || 'false'}`);
  }, [session, status]);

  const handleGoogleSignIn = async () => {
    const result = await signIn("google", { redirect: true, callbackUrl: "/dashboard" });
    console.log('Google sign-in result:', result);
  };

  const handleCredentialsSignIn = async () => {
    const result = await signIn("credentials", { 
      email: "admin@yadaphone.com", 
      password: "HASSOUNI1az@",
      redirect: false 
    });
    console.log('Credentials sign-in result:', result);
    if (result?.ok) {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Current State</h2>
          <p className="font-mono text-sm bg-gray-100 p-3 rounded">{authState}</p>
        </div>

        {session ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Logged In</h2>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto mb-4">
              {JSON.stringify(session, null, 2)}
            </pre>
            <div className="space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push("/admin")}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Go to Admin
              </button>
              <button
                onClick={() => signOut()}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Sign In Options</h2>
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                className="w-full bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600"
              >
                Sign In with Google
              </button>
              <button
                onClick={handleCredentialsSignIn}
                className="w-full bg-green-500 text-white px-4 py-3 rounded hover:bg-green-600"
              >
                Sign In as Admin (Test)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}