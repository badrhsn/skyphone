"use client";

import Link from "next/link";
import { MapPin, Mail, Twitter, MessageCircle, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-blue-50 mt-16">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* About Us */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">About Us</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              We provide affordable international calling services directly from your browser, 
              helping you stay connected with loved ones and institutions worldwide. Yadaphone is 
              built by a team of developers with experience in the telecommunications industry.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard/dialer" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                  Make a Call
                </Link>
              </li>
              <li>
                <Link href="/dashboard/add-credits" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                  Buy Credits
                </Link>
              </li>
              <li>
                <Link href="/rates" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                  Rates
                </Link>
              </li>
              <li>
                <Link href="/earn-credits" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                  Affiliate Program
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/dashboard/buy-number" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                  Virtual Numbers
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 text-sm">Webgasse 8, 1060 Vienna, Austria</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <a href="mailto:info@yadaphone.com" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  info@yadaphone.com
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Twitter className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <a href="https://twitter.com/yadaphone" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  Follow @Yadaphone on X
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <a href="https://reddit.com/r/yadaphone" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  Join us on Reddit
                </a>
              </div>
              <div>
                <Link href="/contact" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://www.twilio.com" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                  Powered by Twilio
                </a>
              </li>
              <li>
                <a href="https://stripe.com" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                  Secure Payments by Stripe
                </a>
              </li>
              <li>
                <a href="https://webrtc.org" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                  WebRTC Technology
                </a>
              </li>
              <li>
                <a href="/caller-registry" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                  Free Caller Registry
                </a>
              </li>
              <li>
                <a href="https://linkedin.com/company/yadaphone" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                  Connect on LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call Major Companies Section */}
      <div className="border-t border-blue-200 bg-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Call Major Companies</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Support</h4>
              <ul className="space-y-1">
                <li>
                  <a href="/call/apple" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                    Apple
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Customer Service</h4>
              <ul className="space-y-1">
                <li>
                  <a href="/call/santander" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                    Santander
                  </a>
                </li>
                <li>
                  <a href="/call/bnp-paribas" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                    BNP Paribas
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Countries Section */}
      <div className="border-t border-blue-200 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Popular Countries</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Link href="/rates?country=UAE" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline flex items-center space-x-1">
                <span>🇦🇪</span>
                <span>UAE</span>
              </Link>
              <Link href="/rates?country=Philippines" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline flex items-center space-x-1">
                <span>🇵🇭</span>
                <span>Philippines</span>
              </Link>
              <Link href="/rates" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline flex items-center space-x-1">
                <span>🌍</span>
                <span>All Countries</span>
              </Link>
            </div>
            <div className="space-y-2">
              <Link href="/rates?country=USA" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline flex items-center space-x-1">
                <span>🇺🇸</span>
                <span>USA</span>
              </Link>
              <Link href="/rates?country=Pakistan" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline flex items-center space-x-1">
                <span>🇵🇰</span>
                <span>Pakistan</span>
              </Link>
            </div>
            <div className="space-y-2">
              <Link href="/rates?country=India" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline flex items-center space-x-1">
                <span>🇮🇳</span>
                <span>India</span>
              </Link>
              <Link href="/rates?country=Nigeria" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline flex items-center space-x-1">
                <span>🇳🇬</span>
                <span>Nigeria</span>
              </Link>
            </div>
            <div className="space-y-2">
              <Link href="/rates?country=UK" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline flex items-center space-x-1">
                <span>🇬🇧</span>
                <span>UK</span>
              </Link>
              <Link href="/rates?country=Mexico" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline flex items-center space-x-1">
                <span>🇲🇽</span>
                <span>Mexico</span>
              </Link>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/rates" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
              View All Rates
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-blue-200 bg-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-gray-600 text-sm mb-4 md:mb-0">
              © 2025 All Rights Reserved
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy-policy" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                Privacy Policy
              </Link>
              <Link href="/terms-and-conditions" className="text-gray-600 hover:text-blue-600 text-sm transition-colors underline">
                Terms and Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}