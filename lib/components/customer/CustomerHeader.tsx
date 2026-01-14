
import { SidebarNav } from '@/components/customer/SidebarNav'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/stores/cart-store'

export default function CustomerHeader() {
  // Since SidebarNav expects 'view' state, we can map routes to views
  // But SidebarNav is designed for the single-page CustomerPortal approach.
  // For the App Router layout, we should probably render a simplified header instead of SidebarNav
  // OR adapt SidebarNav.
  
  // However, the design seems to rely on SidebarNav being on the left.
  // The 'layout.tsx' renders <CustomerHeader /> then <main> then <CartDrawer />
  // If we render SidebarNav inside CustomerHeader, it might work if positioned fixed.
  
  const router = useRouter()
  const { cart } = useCartStore()
  const cartCount = cart.reduce((a, b) => a + b.quantity, 0)
  
  const handleSetView = (view: string) => {
    // Map internal views to routes
    switch(view) {
      case 'home': router.push('/'); break;
      case 'orders': router.push('/orders'); break;
      case 'profile': router.push('/profile'); break; // Assuming /profile exists or will exist
      case 'locations': router.push('/#locations'); break;
      case 'cart': 
        // Trigger cart drawer? 
        // The sidebar 'cart' action usually opens the drawer.
        // We can dispatch a custom event or use a UI store.
        break;
      default: router.push('/');
    }
  }

  return (
    <>
      <SidebarNav 
        currentView="home" // Dynamic based on path?
        setView={handleSetView}
        cartCount={cartCount}
      />
    </>
  )
}
