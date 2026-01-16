'use client'

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useOrders } from '@/lib/hooks/use-orders'
import { useSettings } from '@/lib/hooks/use-settings'
import { useCategories } from '@/lib/hooks/use-categories'
import { useMenu } from '@/lib/hooks/use-menu'
import OrdersManagement from '@/lib/components/admin/OrdersManagement'
import MenuManagement from '@/lib/components/admin/MenuManagement'
import CategoryManagement from '@/lib/components/admin/CategoryManagement'
import SettingsManagement from '@/lib/components/admin/SettingsManagement'
import LandingPageManagement from '@/lib/components/admin/LandingPageManagement'
import BrandingManagement from '@/lib/components/admin/BrandingManagement'
import LocationsManagement from '@/lib/components/admin/LocationsManagement'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ShoppingCart,
  ForkKnife,
  Tag,
  ChartLine,
  TrendUp,
  Users,
  CurrencyDollar
} from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'

function AdminDashboardContent() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'dashboard'

  const { data: orders } = useOrders()
  const { data: settings } = useSettings()
  const { data: categories } = useCategories()
  const { data: menuItems } = useMenu()

  // Redirect to login if not authenticated
  if (status === 'loading') {
    return <AdminDashboardSkeleton />
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  const pendingOrders = orders?.filter(
    (o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
  ) || []

  const completedOrders = orders?.filter(o => o.status === 'COMPLETED') || []
  const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0)

  // Get page title and subtitle based on active tab
  const getPageInfo = () => {
    switch (activeTab) {
      case 'orders':
        return { title: 'Orders Management', subtitle: 'Monitor and manage customer orders' }
      case 'menu':
        return { title: 'Menu Items', subtitle: 'Add and manage your menu items' }
      case 'categories':
        return { title: 'Categories', subtitle: 'Organize your menu categories' }
      case 'locations':
        return { title: 'Locations', subtitle: 'Manage restaurant branches and profiles' }
      case 'landing':
        return { title: 'Landing Page', subtitle: 'Customize your homepage appearance' }
      case 'branding':
        return { title: 'Branding', subtitle: 'Configure your brand identity' }
      case 'settings':
        return { title: 'Settings', subtitle: 'Restaurant settings and configuration' }
      default:
        return { title: 'Dashboard', subtitle: `Welcome back, ${settings?.name || 'Restaurant Owner'}` }
    }
  }

  const { title, subtitle } = getPageInfo()

  // Render content based on activeTab
  const renderContent = () => {
    switch (activeTab) {
      case 'orders':
        return <OrdersManagement />
      case 'menu':
        return <MenuManagement />
      case 'categories':
        return <CategoryManagement />
      case 'locations':
        return <LocationsManagement />
      case 'landing':
        return <LandingPageManagement />
      case 'branding':
        return <BrandingManagement />
      case 'settings':
        return <SettingsManagement />
      default:
        return <DashboardOverview
          orders={orders}
          ordersCount={orders?.length || 0}
          pendingOrdersCount={pendingOrders.length}
          menuItemsCount={menuItems?.length || 0}
          categoriesCount={categories?.length || 0}
          totalRevenue={totalRevenue}
        />
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {renderContent()}
      </div>
    </div>
  )
}

interface DashboardOverviewProps {
  orders: any[] | undefined
  ordersCount: number
  pendingOrdersCount: number
  menuItemsCount: number
  categoriesCount: number
  totalRevenue: number
}

function DashboardOverview({
  orders,
  ordersCount,
  pendingOrdersCount,
  menuItemsCount,
  categoriesCount,
  totalRevenue
}: DashboardOverviewProps) {
  const router = useRouter()

  const statsCards = [
    {
      title: 'Total Orders',
      value: ordersCount.toString(),
      change: '+12%',
      changeType: 'positive' as const,
      icon: ShoppingCart,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      onClick: () => router.push('/admin?tab=orders')
    },
    {
      title: 'Pending Orders',
      value: pendingOrdersCount.toString(),
      change: pendingOrdersCount > 0 ? 'Needs attention' : 'All clear',
      changeType: pendingOrdersCount > 0 ? 'warning' as const : 'positive' as const,
      icon: ChartLine,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      onClick: () => router.push('/admin?tab=orders')
    },
    {
      title: 'Menu Items',
      value: menuItemsCount.toString(),
      change: `${categoriesCount} categories`,
      changeType: 'neutral' as const,
      icon: ForkKnife,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      onClick: () => router.push('/admin?tab=menu')
    },
    {
      title: 'Total Revenue',
      value: `Rs. ${totalRevenue.toLocaleString()}`,
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: CurrencyDollar,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      onClick: () => router.push('/admin?tab=orders')
    },
  ]

  // Get recent 5 orders sorted by date
  const recentActivity = orders
    ? [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)
    : []

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <button
            key={card.title}
            onClick={card.onClick}
            className="group relative bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all duration-300 text-left overflow-hidden shadow-sm"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Gradient Overlay */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-5 rounded-full translate-x-8 -translate-y-8 group-hover:opacity-10 transition-opacity`} />

            {/* Icon */}
            <div className={`${card.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
              <card.icon className={`h-6 w-6 bg-gradient-to-r ${card.color} bg-clip-text text-foreground`} weight="duotone" />
            </div>

            {/* Content */}
            <p className="text-muted-foreground text-sm mb-1">{card.title}</p>
            <p className="text-2xl font-bold text-foreground mb-2">{card.value}</p>

            {/* Change Indicator */}
            <div className="flex items-center gap-1">
              {card.changeType === 'positive' && (
                <TrendUp className="h-4 w-4 text-green-400" weight="bold" />
              )}
              <span className={`text-xs font-medium ${card.changeType === 'positive' ? 'text-green-400' :
                card.changeType === 'warning' ? 'text-amber-400' :
                  'text-muted-foreground'
                }`}>
                {card.change}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" weight="duotone" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickActionButton
            label="View Orders"
            onClick={() => router.push('/admin?tab=orders')}
            icon={ShoppingCart}
          />
          <QuickActionButton
            label="Add Menu Item"
            onClick={() => router.push('/admin?tab=menu')}
            icon={ForkKnife}
          />
          <QuickActionButton
            label="Manage Categories"
            onClick={() => router.push('/admin?tab=categories')}
            icon={Tag}
          />
          <QuickActionButton
            label="Edit Branding"
            onClick={() => router.push('/admin?tab=branding')}
            icon={Users}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ChartLine className="h-5 w-5 text-primary" weight="duotone" />
          Recent Activity
        </h2>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No recent activity</div>
          ) : (
            recentActivity.map((order) => (
              <div key={order.id} className="flex items-center gap-4 p-3 rounded-xl bg-background border border-border hover:border-primary/20 transition-colors cursor-pointer" onClick={() => router.push('/admin?tab=orders')}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                    order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                      'bg-primary/10 text-primary'
                  }`}>
                  <ShoppingCart className="h-5 w-5" weight="fill" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground font-medium">
                    {order.customerName || 'Guest Customer'}
                    <span className="text-muted-foreground font-normal"> placed a new order</span>
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })} • {order.orderType}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground block">Rs. {order.total.toLocaleString()}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' :
                      order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-600' :
                        'bg-blue-500/10 text-blue-600'
                    }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface QuickActionButtonProps {
  label: string
  onClick: () => void
  icon: React.ComponentType<{ className?: string; weight?: 'regular' | 'duotone' }>
}

function QuickActionButton({ label, onClick, icon: Icon }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-accent transition-all duration-200"
    >
      <Icon className="h-4 w-4" weight="duotone" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 bg-muted" />
        <Skeleton className="h-4 w-64 mt-2 bg-muted" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl bg-muted" />
        ))}
      </div>

      <Skeleton className="h-64 rounded-2xl bg-muted" />
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  )
}
