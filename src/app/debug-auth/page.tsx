"use client";

import { useSession } from "next-auth/react";
import { signIn, signOut } from "next-auth/react";

export default function DebugAuth() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Session Status</h2>
          <p><strong>Status:</strong> {status}</p>
        </div>

        {session ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Session Data</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
            <button
              onClick={() => signOut()}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Not Signed In</h2>
            <div className="space-y-4">
              <button
                onClick={() => signIn("google")}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-4"
              >
                Sign In with Google
              </button>
              <button
                onClick={() => signIn("credentials")}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Sign In with Credentials
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Environment Check</h2>
          <p><strong>Google Client ID:</strong> {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Set' : 'Not Set'}</p>
          <p><strong>NextAuth URL:</strong> {process.env.NEXTAUTH_URL || 'Not Set'}</p>
        </div>
      </div>
    </div>
  );
}