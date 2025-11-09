'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Header from "./components/Header"
import Footer from "./components/Footer"

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  // Prevent hydration mismatch by only checking pathname after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Before mounting, render default layout to match SSR
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    )
  }
  
  // After mounting, apply conditional logic
  const isAdminPage = pathname?.startsWith('/admin')
  const isDialerPage = pathname === '/dashboard/dialer'
  
  if (isAdminPage) {
    // For admin pages, render without header and footer
    return <>{children}</>
  }
  
  if (isDialerPage) {
    // For dialer page, render with header but without footer
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </div>
    )
  }
  
  // For regular pages, render with header and footer
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}