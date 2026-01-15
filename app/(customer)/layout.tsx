'use client'

import { useEffect, useState } from 'react'
import CustomerHeader from '@/lib/components/customer/CustomerHeader'
import CartDrawer from '@/lib/components/customer/CartDrawer'
import { useBrandingStore } from '@/lib/stores/branding-store'
import { useLandingPageStore } from '@/lib/stores/landing-page-store'
import CustomerLoading from './loading'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [brandingHydrated, setBrandingHydrated] = useState(false)
  const [landingHydrated, setLandingHydrated] = useState(false)

  useEffect(() => {
    const unsubBranding = useBrandingStore.persist.onFinishHydration(() => setBrandingHydrated(true))
    const unsubLanding = useLandingPageStore.persist.onFinishHydration(() => setLandingHydrated(true))

    if (useBrandingStore.persist.hasHydrated()) {
      setBrandingHydrated(true)
    }
    
    if (useLandingPageStore.persist.hasHydrated()) {
      setLandingHydrated(true)
    }

    return () => {
      unsubBranding()
      unsubLanding()
    }
  }, [])

  if (!brandingHydrated || !landingHydrated) {
    return <CustomerLoading />
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
      <CartDrawer />
    </div>
  )
}
