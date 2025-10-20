'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { SettingsIcon, BarChart3, Users, Phone, LogOut } from 'lucide-react'

export default function AdminNavigation() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/admin" className="flex items-center group">
              <SettingsIcon className="h-8 w-8 text-white group-hover:text-blue-200 transition-colors" />
              <span className="ml-2 text-xl font-bold text-white">Skyphone Admin</span>
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden md:flex space-x-6">
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors ${
                  pathname === '/admin'
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-500'
                }`}
              >
                <SettingsIcon className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              
              <Link
                href="/admin/analytics"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors ${
                  pathname === '/admin/analytics'
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-500'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </Link>
              
              <Link
                href="/rates/all"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors ${
                  pathname === '/rates/all'
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-blue-500'
                }`}
              >
                <Phone className="h-4 w-4" />
                <span>All Rates</span>
              </Link>
            </div>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-sm text-right">
              <div className="font-medium text-white">{session?.user?.name}</div>
              <div className="text-blue-200 text-xs">{session?.user?.email}</div>
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white hover:bg-red-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors shadow-md"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}