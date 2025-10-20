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
  
  // During SSR and before hydration, render with header/footer (most common case)
  if (!isHydrated) {
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
  
  // After hydration, check if we're on an admin page
  const isAdminPage = pathname?.startsWith('/admin')
  
  if (isAdminPage) {
    // For admin pages, render without header and footer
    return <>{children}</>
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