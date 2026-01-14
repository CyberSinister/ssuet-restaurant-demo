'use client'

import { useState } from 'react'
import CustomerPortal from '@/components/customer/CustomerPortal'
import { useMenu } from '@/lib/hooks/use-menu'
import { useCategories } from '@/lib/hooks/use-categories'
import { useSettings } from '@/lib/hooks/use-settings'
import { useLandingPageStore } from '@/lib/stores/landing-page-store'
import type { Order } from '@/lib/types'

export default function HomePage() {
  const { data: menuItems = [] } = useMenu()
  const { data: categories = [] } = useCategories()
  const { data: settings } = useSettings()
  
  // Local state for orders (could be replaced by useOrders if user is persistent)
  const [orders, setOrders] = useState<Order[]>([])

  const {
    heroConfig,
    promotions,
    featuredItems,
    banners,
    landingPageConfig,
  } = useLandingPageStore()

  // Loading state handling could be added here, but for now we render what we have
  if (!settings) {
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading...</div>
  }

  return (
    <CustomerPortal
      menuItems={menuItems}
      categories={categories}
      orders={orders}
      setOrders={setOrders}
      settings={settings}
      onAdminClick={() => console.log('Admin clicked')}
      heroConfig={heroConfig}
      promotions={promotions}
      featuredItems={featuredItems}
      banners={banners}
      landingPageConfig={landingPageConfig}
    />
  )
}
