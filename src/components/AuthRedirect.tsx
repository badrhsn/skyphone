'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    // Skip redirect logic for admin pages (they have their own layout)
    if (pathname.startsWith('/admin')) return

    // Allow users to stay on home page - no automatic redirect from home page
    // Users can access the home page dialer even when logged in

    // If admin tries to access regular dashboard, redirect to admin
    if (session?.user?.isAdmin && pathname === '/dashboard') {
      router.push('/admin')
    }

    // If regular user tries to access admin, redirect to dashboard
    if (session?.user && !session.user.isAdmin && pathname.startsWith('/admin')) {
      router.push('/dashboard')
    }
  }, [session, status, pathname, router])

  return null // This component doesn't render anything
}