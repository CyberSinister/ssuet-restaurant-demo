'use client'

import { useSearchParams } from 'next/navigation'
import { AdminSidebar } from '@/src/components/admin/AdminSidebar'
import { useOrders } from '@/lib/hooks/use-orders'
import { useState, useEffect, Suspense } from 'react'

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'dashboard'
  const { data: orders } = useOrders()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const pendingOrdersCount = orders?.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled'
  ).length || 0

  // Initialize from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed')
    if (saved !== null) {
      setIsCollapsed(saved === 'true')
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('admin-sidebar-collapsed', String(newState))
    // Trigger storage event for other tabs
    window.dispatchEvent(new Event('storage'))
  }

  // Listen for sidebar collapse changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin-sidebar-collapsed') {
        setIsCollapsed(e.newValue === 'true')
      }
    }
    
    window.addEventListener('storage', handleStorageChange as any)
    return () => window.removeEventListener('storage', handleStorageChange as any)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <AdminSidebar 
        activeTab={activeTab} 
        pendingOrdersCount={pendingOrdersCount}
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
      />
      
      {/* Main Content Area */}
      <main className={`
        min-h-screen transition-all duration-300 ease-in-out
        ${isCollapsed ? 'pl-20' : 'pl-64'}
      `}>
        <div className="max-w-[1600px] mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  )
}
