"use client";

import AdminNavigation from "@/components/AdminNavigation";
import Link from "next/link";
import { Settings, Shield } from "lucide-react";

export default function AdminConfigPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />

      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/admin" className="text-blue-600 hover:text-blue-700">
            <Settings className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
            <p className="text-gray-600">This project now uses environment variables only. No database-stored provider config.</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold">How configuration works</h2>
          </div>
          <p className="text-gray-700 mb-4">
            All API credentials are read from environment variables at runtime. There is no UI to create or edit
            provider settings. Update your hosting provider’s environment settings and redeploy.
          </p>
          <div className="space-y-2">
            <p className="font-medium">Required variables:</p>
            <ul className="list-disc list-inside text-gray-700">
              <li>Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER</li>
              <li>Stripe: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET</li>
              <li>Google OAuth: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET</li>
              <li>NextAuth: NEXTAUTH_URL, NEXTAUTH_SECRET</li>
              <li>Database: DATABASE_URL</li>
            </ul>
          </div>
          <p className="text-gray-700 mt-4">
            See PRODUCTION_SETUP.md or .env.production.template for the full list and descriptions.
          </p>
        </div>
      </div>
    </div>
  );
}