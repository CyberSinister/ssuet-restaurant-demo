'use client'

import CustomerHeader from '@/lib/components/customer/CustomerHeader'
import CartDrawer from '@/lib/components/customer/CartDrawer'
import MenuView from '@/components/customer/MenuView'

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <MenuView />
      </main>
      <CartDrawer />
    </div>
  )
}
