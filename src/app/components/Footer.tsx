"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Mail, Twitter, MessageCircle, Linkedin, Phone, Globe, Star, Shield, Zap, Users, Award, ArrowUpRight, CreditCard, Gift } from "lucide-react";

interface Stats {
  users: { total: number; recent: number; display: string };
  countries: { total: number; display: string };
  uptime: { percentage: number; display: string };
  rating: { score: number; display: string };
  calls: { total: number; recent: number; display: string };
  revenue: { total: number; display: string };
  successRate: { percentage: number; display: string };
}

interface PopularCountry {
  code: string;
  name: string;
  flag: string;
  rate: number;
  formattedRate: string;
  currency: string;
}

export default function Footer() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [popularCountries, setPopularCountries] = useState<PopularCountry[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [systemStatus, setSystemStatus] = useState<string>("operational");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    // Fetch dynamic stats
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    // Fetch popular countries
    const fetchPopularCountries = async () => {
      try {
        const response = await fetch('/api/popular-countries');
        const result = await response.json();
        if (result.success) {
          setPopularCountries(result.data);
        }
      } catch (error) {
        console.error('Error fetching popular countries:', error);
      }
    };

    // Fetch system status
    const fetchSystemStatus = async () => {
      try {
        const response = await fetch('/api/system-status');
        const result = await response.json();
        if (result.success) {
          setSystemStatus(result.data.status);
        }
      } catch (error) {
        console.error('Error fetching system status:', error);
        setSystemStatus("unknown");
      }
    };

    fetchStats();
    fetchPopularCountries();
    fetchSystemStatus();
    setLastUpdated(new Date());

    // Update stats every 5 minutes
    const interval = setInterval(() => {
      fetchStats();
      fetchPopularCountries();
      fetchSystemStatus();
      setLastUpdated(new Date());
    }, 5 * 60 * 1000);

    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Default fallback data
  const defaultStats: Stats = {
    users: { total: 1000, recent: 50, display: "1K+" },
    countries: { total: 247, display: "247+" },
    uptime: { percentage: 99.9, display: "99.9%" },
    rating: { score: 4.9, display: "4.9/5" },
    calls: { total: 10000, recent: 500, display: "10K+" },
    revenue: { total: 50000, display: "$50K+" },
    successRate: { percentage: 99.9, display: "99.9%" }
  };

  const currentStats = stats || defaultStats;

  return (
    <footer className="bg-[#f7fbff] border-t border-[#e6fbff] relative">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300aff0' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Main Footer Content */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-[#00aff0] to-[#0099d6] rounded-xl p-2">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Yadaphone</h3>
            </div>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              International calling with crystal-clear quality and unbeatable rates.
            </p>
            
            {/* Trust Badges */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-2 text-sm">
                <div className="bg-[#f3fbff] rounded-full p-1">
                  <Shield className="h-4 w-4 text-[#00aff0]" />
                </div>
                <span className="text-gray-700">Bank-grade security</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="bg-[#f3fbff] rounded-full p-1">
                  <Zap className="h-4 w-4 text-[#00aff0]" />
                </div>
                <span className="text-gray-700">{currentStats.successRate.display} success rate</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-3">
              <a href="https://twitter.com/yadaphone" className="bg-white border border-[#e6fbff] hover:bg-[#f3fbff] p-2 rounded-xl transition-colors">
                <Twitter className="h-4 w-4 text-[#00aff0]" />
              </a>
              <a href="https://linkedin.com/company/yadaphone" className="bg-white border border-[#e6fbff] hover:bg-[#f3fbff] p-2 rounded-xl transition-colors">
                <Linkedin className="h-4 w-4 text-[#00aff0]" />
              </a>
              <a href="https://reddit.com/r/yadaphone" className="bg-white border border-[#e6fbff] hover:bg-[#f3fbff] p-2 rounded-xl transition-colors">
                <MessageCircle className="h-4 w-4 text-[#00aff0]" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Services</h4>
            <ul className="space-y-3">
              {[
                { href: "/dashboard/dialer", label: "Voice Calling", icon: Phone },
                { href: "/dashboard/add-credits", label: "Credit Plans", icon: CreditCard },
                { href: "/dashboard/buy-number", label: "Virtual Numbers", icon: Globe },
                { href: "/rates", label: "Global Rates", icon: Star },
                { href: "/earn-credits", label: "Affiliate Program", icon: Gift },
              ].map((item, index) => (
                <li key={index}>
                  <Link href={item.href} className="flex items-center space-x-2 text-gray-600 hover:text-[#00aff0] transition-colors text-sm group">
                    <item.icon className="h-4 w-4 text-gray-400 group-hover:text-[#00aff0] transition-colors" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Destinations */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Popular Destinations</h4>
            <div className="space-y-2">
              <Link href="/rates?country=UAE" className="flex items-center space-x-2 text-sm hover:bg-[#f3fbff] rounded-xl p-2 transition-all duration-300 border border-transparent hover:border-[#e6fbff]">
                <span className="text-base">🇦🇪</span>
                <span className="text-gray-600">UAE</span>
              </Link>
              <Link href="/rates?country=USA" className="flex items-center space-x-2 text-sm hover:bg-[#f3fbff] rounded-xl p-2 transition-all duration-300 border border-transparent hover:border-[#e6fbff]">
                <span className="text-base">🇺🇸</span>
                <span className="text-gray-600">USA</span>
              </Link>
              <Link href="/rates?country=India" className="flex items-center space-x-2 text-sm hover:bg-[#f3fbff] rounded-xl p-2 transition-all duration-300 border border-transparent hover:border-[#e6fbff]">
                <span className="text-base">🇮🇳</span>
                <span className="text-gray-600">India</span>
              </Link>
              <Link href="/rates?country=UK" className="flex items-center space-x-2 text-sm hover:bg-[#f3fbff] rounded-xl p-2 transition-all duration-300 border border-transparent hover:border-[#e6fbff]">
                <span className="text-base">🇬🇧</span>
                <span className="text-gray-600">UK</span>
              </Link>
              <Link href="/rates?country=Philippines" className="flex items-center space-x-2 text-sm hover:bg-[#f3fbff] rounded-xl p-2 transition-all duration-300 border border-transparent hover:border-[#e6fbff]">
                <span className="text-base">🇵🇭</span>
                <span className="text-gray-600">Philippines</span>
              </Link>
              <Link href="/rates?country=Pakistan" className="flex items-center space-x-2 text-sm hover:bg-[#f3fbff] rounded-xl p-2 transition-all duration-300 border border-transparent hover:border-[#e6fbff]">
                <span className="text-base">🇵🇰</span>
                <span className="text-gray-600">Pakistan</span>
              </Link>
              <Link href="/rates?country=Nigeria" className="flex items-center space-x-2 text-sm hover:bg-[#f3fbff] rounded-xl p-2 transition-all duration-300 border border-transparent hover:border-[#e6fbff]">
                <span className="text-base">🇳🇬</span>
                <span className="text-gray-600">Nigeria</span>
              </Link>
              <Link href="/rates?country=Mexico" className="flex items-center space-x-2 text-sm hover:bg-[#f3fbff] rounded-xl p-2 transition-all duration-300 border border-transparent hover:border-[#e6fbff]">
                <span className="text-base">🇲🇽</span>
                <span className="text-gray-600">Mexico</span>
              </Link>
            </div>
            <Link href="/rates" className="inline-flex items-center space-x-1 text-[#00aff0] hover:text-[#0099d6] text-sm mt-3 bg-white border border-[#e6fbff] hover:bg-[#f3fbff] px-3 py-2 rounded-xl transition-colors">
              <span>View All Rates</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Support</h4>
            <div className="space-y-3 mb-6">
              <div className="bg-white border border-[#e6fbff] rounded-xl p-3">
                <div className="flex items-start space-x-2">
                  <div className="bg-[#f3fbff] rounded-full p-1">
                    <Mail className="h-4 w-4 text-[#00aff0]" />
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Email Support</div>
                    <a href="mailto:info@yadaphone.com" className="text-gray-900 hover:text-[#00aff0] text-sm transition-colors">
                      info@yadaphone.com
                    </a>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-[#e6fbff] rounded-xl p-3">
                <div className="flex items-start space-x-2">
                  <div className="bg-[#f3fbff] rounded-full p-1">
                    <MapPin className="h-4 w-4 text-[#00aff0]" />
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Location</div>
                    <span className="text-gray-900 text-sm">Vienna, Austria</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { href: "/faq", label: "FAQ" },
                { href: "/contact", label: "Contact" },
                { href: "/privacy-policy", label: "Privacy" },
                { href: "/terms-and-conditions", label: "Terms" },
              ].map((item, index) => (
                <Link key={index} href={item.href} className="block text-gray-600 hover:text-[#00aff0] text-sm transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="relative border-t border-[#e6fbff] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <div className="text-gray-600 text-sm">
              © {new Date().getFullYear()} Yadaphone. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}