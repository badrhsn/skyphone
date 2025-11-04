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
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Prevent hydration mismatch by only checking pathname after hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  // During SSR and before hydration, check for dialer page
  if (!isHydrated) {
    // Check for dialer page during SSR
    const isDialerPageSSR = typeof window === 'undefined' && pathname === '/dashboard/dialer'
    
    if (isDialerPageSSR) {
      return (
        <div className="min-h-screen bg-white flex flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </div>
      )
    }
    
    // Default: render with header/footer (most common case)
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
  
  // After hydration, check if we're on an admin page or dialer page
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