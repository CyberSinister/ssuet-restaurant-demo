'use client'

import { Bell, MagnifyingGlass, User, Gear, CaretDown } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface AdminHeaderProps {
  title?: string
  subtitle?: string
  restaurantName?: string
  isCollapsed?: boolean
}

export function AdminHeader({
  title = 'Dashboard',
  subtitle,
  restaurantName = 'Restaurant',
  isCollapsed = false
}: AdminHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <header className={cn(
      "sticky top-0 z-40 h-16 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-[#2a2a2a]/50 transition-all duration-300",
      isCollapsed ? "ml-20" : "ml-64"
    )}>
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Side - Title */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-3">
          {/* Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-muted-foreground hover:text-white hover:bg-[#2a2a2a] hover:border-[#3a3a3a] transition-all"
          >
            <MagnifyingGlass className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-muted-foreground hover:text-white hover:bg-[#2a2a2a] hover:border-[#3a3a3a] transition-all relative"
          >
            <Bell className="h-4 w-4" />
            {/* Notification dot */}
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
          </Button>

          {/* Divider */}
          <div className="h-8 w-px bg-[#2a2a2a]" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#2a2a2a] hover:border-[#3a3a3a] transition-all group">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center">
                  <User className="h-4 w-4 text-black" weight="bold" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-white leading-tight">Admin</p>
                  <p className="text-xs text-muted-foreground leading-tight truncate max-w-24">{restaurantName}</p>
                </div>
                <CaretDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-white transition-colors ml-1" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-[#2a2a2a]">
              <DropdownMenuLabel className="text-white">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#2a2a2a]" />
              <DropdownMenuItem
                className="text-muted-foreground hover:text-white hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] cursor-pointer"
                onClick={() => router.push('/admin?tab=settings')}
              >
                <Gear className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-muted-foreground hover:text-white hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] cursor-pointer"
                onClick={() => router.push('/')}
              >
                <User className="mr-2 h-4 w-4" />
                View Store
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#2a2a2a]" />
              <DropdownMenuItem
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer"
                onClick={handleLogout}
              >
                <span className="mr-2">🚪</span>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
