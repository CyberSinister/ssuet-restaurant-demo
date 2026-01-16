'use client'

import { useRouter } from 'next/navigation'
import {
  House,
  ShoppingCart,
  ForkKnife,
  Tag,
  MapPin,
  Gear,
  PaintBrush,
  Layout,
  ChartPie,
  SignOut,
  CaretDoubleLeft,
  CaretDoubleRight
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ weight?: 'regular' | 'fill'; className?: string }>
  href: string
  badge?: number
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: ChartPie, href: '/admin' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, href: '/admin?tab=orders' },
  { id: 'menu', label: 'Menu Items', icon: ForkKnife, href: '/admin?tab=menu' },
  { id: 'categories', label: 'Categories', icon: Tag, href: '/admin?tab=categories' },
  { id: 'locations', label: 'Locations', icon: MapPin, href: '/admin?tab=locations' },
  { id: 'landing', label: 'Landing Page', icon: Layout, href: '/admin?tab=landing' },
  { id: 'branding', label: 'Branding', icon: PaintBrush, href: '/admin?tab=branding' },
  { id: 'settings', label: 'Settings', icon: Gear, href: '/admin?tab=settings' },
]

interface AdminSidebarProps {
  activeTab?: string
  pendingOrdersCount?: number
  isCollapsed: boolean
  onToggle: () => void
}

export function AdminSidebar({
  activeTab = 'dashboard',
  pendingOrdersCount = 0,
  isCollapsed,
  onToggle
}: AdminSidebarProps) {
  const router = useRouter()

  const handleNavClick = (item: NavItem) => {
    router.push(item.href)
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  // Update nav items with badges
  const navItemsWithBadges = navItems.map(item => ({
    ...item,
    badge: item.id === 'orders' ? pendingOrdersCount : undefined
  }))

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-card border-r border-border flex flex-col z-50 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo / Brand */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-6 border-b border-border",
        isCollapsed ? "justify-center" : "justify-start"
      )}>
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
          <span className="font-black text-black text-lg">B</span>
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold text-foreground truncate">Admin Panel</h1>
            <p className="text-xs text-muted-foreground truncate">Restaurant Management</p>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            "flex-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
            isCollapsed ? "justify-center" : "justify-end"
          )}
        >
          {isCollapsed ? (
            <CaretDoubleRight className="h-4 w-4" />
          ) : (
            <>
              <span className="text-xs mr-2">Collapse</span>
              <CaretDoubleLeft className="h-4 w-4" />
            </>
          )}
        </Button>
        {!isCollapsed && <ThemeSwitcher />}
      </div>

      {isCollapsed && (
        <div className="px-3 py-2 border-b border-border flex justify-center">
          <ThemeSwitcher />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        <div className={cn("mb-3", !isCollapsed && "px-3")}>
          {!isCollapsed && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Main Navigation
            </span>
          )}
        </div>

        {navItemsWithBadges.map((item) => {
          const isActive = activeTab === item.id || (item.id === 'dashboard' && activeTab === 'dashboard')

          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => handleNavClick(item)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <div className="relative">
                  <item.icon
                    weight={isActive ? "fill" : "regular"}
                    className={cn(
                      "h-5 w-5 transition-colors flex-shrink-0",
                      isActive ? "text-primary" : "group-hover:text-primary/70"
                    )}
                  />
                  {/* Badge */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>

                {!isCollapsed && (
                  <span className={cn(
                    "text-sm font-medium truncate",
                    isActive && "text-foreground"
                  )}>
                    {item.label}
                  </span>
                )}

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
                )}
              </button>

              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-popover border border-border rounded-lg text-sm text-popover-foreground whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-2 text-xs text-red-400">({item.badge})</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-3">
        {/* Back to Store */}
        <button
          onClick={() => router.push('/')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 mb-2",
            isCollapsed && "justify-center px-0"
          )}
        >
          <House className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">View Store</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200",
            isCollapsed && "justify-center px-0"
          )}
        >
          <SignOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
