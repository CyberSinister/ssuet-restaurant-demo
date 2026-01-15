
import { House, ShoppingCart, MapPin, User, Receipt } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChartPie } from '@phosphor-icons/react'

interface SidebarNavProps {
  currentView: 'home' | 'orders' | 'profile' | string
  setView: (view: string) => void
  cartCount: number
}

export function SidebarNav({ currentView, setView, cartCount }: SidebarNavProps) {
  const { data: session } = useSession()
  const router = useRouter()
  
  const navItems = [
    { id: 'home', label: 'Order', icon: House, action: 'home' },
    { id: 'cart', label: 'Cart', icon: ShoppingCart, action: 'cart', badge: cartCount },
    { id: 'locations', label: 'Locations', icon: MapPin, action: 'locations' },
    { id: 'orders', label: 'Orders', icon: Receipt, action: 'orders' },
    { id: 'profile', label: 'Profile', icon: User, action: 'profile' },
  ]

  return (
    <aside className="fixed left-0 top-0 h-full w-20 md:w-24 bg-card border-r border-border flex flex-col items-center py-6 z-50">
      {/* Brand Icon */}
      <div className="mb-8">
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center transform hover:rotate-3 transition-transform">
           <span className="font-black text-black text-xl">B</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 w-full space-y-4 flex flex-col items-center">
        {navItems.map((item) => {
          const isActive = currentView === item.id || (item.id === 'home' && currentView === 'home')
          
          return (
            <div key={item.id} className="relative group w-full flex justify-center">
              <button
                onClick={() => setView(item.action)}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-200 group-hover:bg-accent",
                  isActive 
                    ? "text-primary bg-accent/50" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon 
                  weight={isActive ? "fill" : "regular"} 
                  className={cn("h-7 w-7 mb-1", isActive && "text-primary")} 
                />
                <span className="text-[10px] uppercase font-medium tracking-wide">{item.label}</span>
                
                {/* Badge for Cart */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-2 right-4 h-5 w-5 bg-primary text-black text-xs font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
              
              {/* Active Indicator Strip */}
              {isActive && (
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
              )}
            </div>
          )
        })}
      </nav>

      {/* Settings / Menu */}
      <div className="mt-auto flex flex-col items-center gap-4">
        <ThemeSwitcher />
        
        {/* Admin Link if logged in */}
        {session?.user && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={() => router.push('/admin')}
            title="Admin Dashboard"
          >
            <ChartPie className="h-6 w-6" />
          </Button>
        )}
      </div>
    </aside>
  )
}
