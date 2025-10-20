import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "./providers";
import ConditionalLayout from "./ConditionalLayout";
import AuthRedirect from "@/components/AuthRedirect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skyphone - International Calling Made Simple",
  description: "Make international calls from your browser with competitive rates and crystal clear quality.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-white`}
      >
        <ClientProviders>
          <AuthRedirect />
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </ClientProviders>
      </body>
    </html>
  );
}
