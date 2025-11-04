"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { Phone, MessageCircle, HelpCircle, Download, Menu, X, ChevronDown, DollarSign, Globe, Settings, Sun, Moon, User } from "lucide-react";

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      // Close mobile menu when clicking outside
      if (mobileMenuOpen && !(event.target as Element).closest('[data-mobile-menu]')) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Handle loading state to prevent hydration mismatch
  if (status === "loading") {
    return (
      <nav className="bg-gradient-to-r from-[#f3fbff] to-[#f7fbff] border-b border-[#e6fbff] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">ya</span>
              </div>
              <span className="text-lg sm:text-xl font-semibold text-gray-900">Yadaphone</span>
            </Link>
            
            {/* Loading skeleton */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex space-x-4">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gradient-to-r from-[#f3fbff] to-[#f7fbff] border-b border-[#e6fbff] shadow-sm relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">ya</span>
              </div>
              <span className="text-lg sm:text-xl font-semibold text-gray-900">Yadaphone</span>
            </Link>
          </div>

          {session ? (
            <>
              {/* Logged in navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <Link 
                  href="/dashboard/dialer" 
                  className="bg-[#00aff0] text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-[#0099d6] transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                  <span>Make a Call</span>
                </Link>
                
                <Link 
                  href="/dashboard/contacts" 
                  className="text-gray-700 hover:text-[#00aff0] hover:underline font-medium flex items-center space-x-2 cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Contacts</span>
                </Link>
                
                <Link 
                  href="/dashboard/add-credits" 
                  className="text-gray-700 hover:text-[#00aff0] hover:underline font-medium flex items-center space-x-2 cursor-pointer"
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Buy Credits</span>
                </Link>
                
                <Link 
                  href="/dashboard/buy-number" 
                  className="text-gray-700 hover:text-[#00aff0] hover:underline font-medium flex items-center space-x-2 cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                  <span>Buy Number</span>
                </Link>
              </div>

              {/* User menu */}
              <div className="flex items-center space-x-4">
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 relative z-50"
                  >
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      {session.user?.image ? (
                        <img 
                          src={session.user.image} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[60]">
                      <Link 
                        href="/dashboard/settings" 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                      <Link 
                        href="/rates" 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <DollarSign className="h-4 w-4" />
                        <span>Rates</span>
                      </Link>
                      <Link 
                        href="/dashboard/history" 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>History</span>
                      </Link>
                      <Link 
                        href="/contact" 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <HelpCircle className="h-4 w-4" />
                        <span>Support</span>
                      </Link>
                      <div className="border-t border-gray-200 my-2"></div>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Auth buttons and Rates */}
              <div className="flex items-center space-x-4">
                <Link 
                  href="/rates" 
                  className="text-gray-700 hover:text-[#00aff0] hover:underline font-medium flex items-center cursor-pointer"
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Rates</span>
                </Link>
                <Link 
                  href="/auth/signin" 
                  className="text-gray-700 hover:text-[#00aff0] hover:underline font-medium cursor-pointer"
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="bg-[#00aff0] hover:bg-[#0099d6] text-white px-6 py-2 rounded-full font-medium transition-colors cursor-pointer"
                >
                  Sign Up
                </Link>
              </div>
            </>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden" data-mobile-menu>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 p-2 hover:bg-[#f7fbff] rounded-lg transition-colors relative z-50"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#e6fbff] bg-white relative z-50" data-mobile-menu>
          <div className="px-4 py-3 space-y-1">
            {session ? (
              <>
                <Link 
                  href="/dashboard/dialer" 
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#f7fbff] hover:text-[#00aff0] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Phone className="h-4 w-4" />
                  <span>Make a Call</span>
                </Link>
                
                <Link 
                  href="/dashboard/contacts" 
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#f7fbff] hover:text-[#00aff0] hover:underline transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Contacts</span>
                </Link>
                
                <Link 
                  href="/dashboard/add-credits" 
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#f7fbff] hover:text-[#00aff0] hover:underline transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Buy Credits</span>
                </Link>
                
                <Link 
                  href="/dashboard/buy-number" 
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#f7fbff] hover:text-[#00aff0] hover:underline transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Phone className="h-4 w-4" />
                  <span>Buy Number</span>
                </Link>
                
                <div className="border-t border-[#e6fbff] mt-3 pt-3">
                  <Link 
                    href="/dashboard/settings" 
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#f7fbff] hover:text-[#00aff0] hover:underline transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                  
                  <Link 
                    href="/rates" 
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#f7fbff] hover:text-[#00aff0] hover:underline transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Rates</span>
                  </Link>
                  
                  <Link 
                    href="/dashboard/history" 
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#f7fbff] hover:text-[#00aff0] hover:underline transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>History</span>
                  </Link>
                  
                  <Link 
                    href="/contact" 
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#f7fbff] hover:text-[#00aff0] hover:underline transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Support</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <User className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  href="/rates" 
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#f7fbff] hover:text-[#00aff0] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Rates</span>
                </Link>
                
                <div className="border-t border-[#e6fbff] mt-3 pt-3">
                  <Link 
                    href="/auth/signin" 
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-[#f7fbff] hover:text-[#00aff0] hover:underline transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>Sign In</span>
                  </Link>
                  
                  <Link 
                    href="/auth/signup" 
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-[#00aff0] text-white hover:bg-[#0099d6] transition-colors mt-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>Sign Up</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}


