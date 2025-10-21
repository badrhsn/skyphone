"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Mail, Twitter, MessageCircle, Linkedin, Phone, Globe, Star, Shield, Zap, Users, Award, ArrowUpRight } from "lucide-react";

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
    <footer className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-10"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-10"></div>
        
        <div className="absolute inset-0 opacity-3">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
      </div>

      {/* Compact Main Footer Content */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-2">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Yadaphone</h3>
            </div>
            <p className="text-blue-200 text-sm mb-6 leading-relaxed">
              International calling with crystal-clear quality and unbeatable rates.
            </p>
            
            {/* Compact Trust Badges */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center space-x-2 text-sm">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-blue-200">Bank-grade security</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-blue-200">{currentStats.successRate.display} success rate</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-3">
              <a href="https://twitter.com/yadaphone" className="bg-slate-800/50 hover:bg-slate-700/70 p-2 rounded-lg transition-all duration-300">
                <Twitter className="h-4 w-4 text-blue-400" />
              </a>
              <a href="https://linkedin.com/company/yadaphone" className="bg-slate-800/50 hover:bg-slate-700/70 p-2 rounded-lg transition-all duration-300">
                <Linkedin className="h-4 w-4 text-blue-400" />
              </a>
              <a href="https://reddit.com/r/yadaphone" className="bg-slate-800/50 hover:bg-slate-700/70 p-2 rounded-lg transition-all duration-300">
                <MessageCircle className="h-4 w-4 text-blue-400" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Services</h4>
            <ul className="space-y-3">
              {[
                { href: "/dashboard/dialer", label: "Voice Calling" },
                { href: "/dashboard/add-credits", label: "Credit Plans" },
                { href: "/dashboard/buy-number", label: "Virtual Numbers" },
                { href: "/rates", label: "Global Rates" },
                { href: "/earn-credits", label: "Affiliate Program" },
              ].map((item, index) => (
                <li key={index}>
                  <Link href={item.href} className="text-blue-200 hover:text-white transition-colors text-sm">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Destinations */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Popular Destinations</h4>
            <div className="space-y-2">
              {popularCountries.length > 0 ? (
                popularCountries.slice(0, 5).map((country, index) => (
                  <Link key={index} href={`/rates?country=${country.name}`} className="flex items-center justify-between text-sm hover:bg-slate-800/30 rounded-lg p-2 transition-all duration-300">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{country.flag}</span>
                      <span className="text-blue-200">{country.name}</span>
                    </div>
                    <span className="text-green-400 font-medium">{country.formattedRate}</span>
                  </Link>
                ))
              ) : (
                <div className="text-blue-300 text-sm">Loading destinations...</div>
              )}
            </div>
            <Link href="/rates" className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm mt-3">
              <span>View all countries</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
            <div className="space-y-3 mb-6">
              <div className="flex items-start space-x-2">
                <Mail className="h-4 w-4 text-blue-400 mt-0.5" />
                <div>
                  <div className="text-blue-200 text-xs">Email Support</div>
                  <a href="mailto:info@yadaphone.com" className="text-white hover:text-blue-300 text-sm transition-colors">
                    info@yadaphone.com
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-blue-400 mt-0.5" />
                <div>
                  <div className="text-blue-200 text-xs">Location</div>
                  <span className="text-white text-sm">Vienna, Austria</span>
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
                <Link key={index} href={item.href} className="block text-blue-200 hover:text-white text-sm transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Bottom Section */}
      <div className="relative border-t border-blue-800/30 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <div className="text-blue-200 text-sm">
                © {new Date().getFullYear()} Yadaphone. All rights reserved.
              </div>
              <div className="flex items-center space-x-4 text-xs text-blue-300">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${systemStatus === 'operational' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                  <span>System {systemStatus}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-xs text-blue-300">
                Built with ❤️ in Vienna
              </div>
              <div className="flex space-x-2">
                <a href="#" className="bg-slate-800/50 hover:bg-slate-700/70 rounded-lg px-3 py-2 text-xs text-white transition-all duration-300">
                  iOS App
                </a>
                <a href="#" className="bg-slate-800/50 hover:bg-slate-700/70 rounded-lg px-3 py-2 text-xs text-white transition-all duration-300">
                  Android App
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}