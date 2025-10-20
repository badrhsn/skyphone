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
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Stats Section */}
      <div className="relative border-b border-blue-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Trusted by Thousands Worldwide
            </h2>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto">
              Join {currentStats.users.display} users who choose Yadaphone for reliable, affordable international communication
            </p>
            <div className="mt-4 text-xs text-blue-300">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-6 backdrop-blur-sm border border-blue-400/20 group-hover:border-blue-400/40 transition-all duration-300">
                <Globe className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{currentStats.countries.display}</div>
                <div className="text-blue-200 text-sm">Countries</div>
              </div>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl p-6 backdrop-blur-sm border border-green-400/20 group-hover:border-green-400/40 transition-all duration-300">
                <Users className="h-8 w-8 text-green-400 mx-auto mb-3" />
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{currentStats.users.display}</div>
                <div className="text-green-200 text-sm">Active Users</div>
              </div>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 backdrop-blur-sm border border-purple-400/20 group-hover:border-purple-400/40 transition-all duration-300">
                <Phone className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{currentStats.uptime.display}</div>
                <div className="text-purple-200 text-sm">Uptime</div>
              </div>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-6 backdrop-blur-sm border border-orange-400/20 group-hover:border-orange-400/40 transition-all duration-300">
                <Star className="h-8 w-8 text-orange-400 mx-auto mb-3" />
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{currentStats.rating.display}</div>
                <div className="text-orange-200 text-sm">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                Yadaphone
              </h3>
              <p className="text-blue-200 leading-relaxed mb-6">
                Revolutionary international calling platform that connects you globally with crystal-clear quality and unbeatable rates.
              </p>
            </div>
            
            {/* Dynamic Trust Badges */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-green-400" />
                <span className="text-blue-200 text-sm">Bank-grade security</span>
              </div>
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span className="text-blue-200 text-sm">
                  {currentStats.successRate.display} success rate
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-purple-400" />
                <span className="text-blue-200 text-sm">
                  {currentStats.calls.display} calls completed
                </span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              <a href="https://twitter.com/yadaphone" className="bg-blue-800/30 hover:bg-blue-700/50 p-3 rounded-xl transition-all duration-300 hover:scale-110">
                <Twitter className="h-5 w-5 text-blue-400" />
              </a>
              <a href="https://linkedin.com/company/yadaphone" className="bg-blue-800/30 hover:bg-blue-700/50 p-3 rounded-xl transition-all duration-300 hover:scale-110">
                <Linkedin className="h-5 w-5 text-blue-400" />
              </a>
              <a href="https://reddit.com/r/yadaphone" className="bg-blue-800/30 hover:bg-blue-700/50 p-3 rounded-xl transition-all duration-300 hover:scale-110">
                <MessageCircle className="h-5 w-5 text-blue-400" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full mr-3"></div>
              Services
            </h4>
            <ul className="space-y-4">
              {[
                { href: "/dashboard/dialer", label: "Voice Calling", icon: Phone },
                { href: "/dashboard/add-credits", label: "Credit Plans", icon: Star },
                { href: "/dashboard/buy-number", label: "Virtual Numbers", icon: Globe },
                { href: "/rates", label: `Global Rates (${currentStats.countries.total} countries)`, icon: Zap },
                { href: "/earn-credits", label: "Affiliate Program", icon: Users },
              ].map((item, index) => (
                <li key={index}>
                  <Link href={item.href} className="flex items-center space-x-3 text-blue-200 hover:text-white transition-all duration-300 group">
                    <item.icon className="h-4 w-4 text-blue-400 group-hover:text-blue-300" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">{item.label}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Dynamic Popular Destinations */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-blue-400 rounded-full mr-3"></div>
              Popular Destinations
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {popularCountries.length > 0 ? (
                popularCountries.map((country, index) => (
                  <Link key={index} href={`/rates?country=${country.name}`} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl hover:bg-slate-700/50 transition-all duration-300 group">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{country.flag}</span>
                      <span className="text-blue-200 text-sm group-hover:text-white">{country.name}</span>
                    </div>
                    <span className="text-green-400 text-xs font-medium">{country.formattedRate}</span>
                  </Link>
                ))
              ) : (
                // Fallback content while loading
                <div className="text-blue-300 text-sm">Loading destinations...</div>
              )}
            </div>
            <Link href="/rates" className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm font-medium mt-4 group">
              <span>View all {currentStats.countries.display} countries</span>
              <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
            </Link>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6 flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full mr-3"></div>
              Support
            </h4>
            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-blue-200 text-sm">Email Support</div>
                  <a href="mailto:info@yadaphone.com" className="text-white hover:text-blue-300 text-sm font-medium transition-colors">
                    info@yadaphone.com
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-blue-200 text-sm">Headquarters</div>
                  <span className="text-white text-sm">Vienna, Austria</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { href: "/faq", label: "FAQ" },
                { href: "/contact", label: "Contact Us" },
                { href: "/privacy-policy", label: "Privacy Policy" },
                { href: "/terms-and-conditions", label: "Terms of Service" },
              ].map((item, index) => (
                <Link key={index} href={item.href} className="block text-blue-200 hover:text-white text-sm transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Powered By Section */}
      <div className="relative border-t border-blue-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-blue-300 text-sm mb-4">Powered by industry-leading technology</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <span className="text-blue-200 text-sm font-medium">Twilio</span>
              <span className="text-blue-200 text-sm font-medium">Stripe</span>
              <span className="text-blue-200 text-sm font-medium">WebRTC</span>
              <span className="text-blue-200 text-sm font-medium">Next.js</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="relative border-t border-blue-800/30 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="text-blue-300 text-sm mb-4 md:mb-0">
              © 2025 Yadaphone. All rights reserved. Built with ❤️ for global communication.
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  !isOnline ? 'bg-red-400' : 
                  systemStatus === 'operational' ? 'bg-green-400' : 
                  systemStatus === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span className={`text-sm font-medium ${
                  !isOnline ? 'text-red-400' : 
                  systemStatus === 'operational' ? 'text-green-400' : 
                  systemStatus === 'degraded' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {!isOnline ? 'Connection issues' : 
                   systemStatus === 'operational' ? 'All systems operational' :
                   systemStatus === 'degraded' ? 'Some systems degraded' : 'System issues detected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}