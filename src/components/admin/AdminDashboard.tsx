import { useState } from 'react'
import { MenuItem, Order, RestaurantSettings, Category, HeroConfig, Promotion, FeaturedItem, Banner, LandingPageConfig } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft } from '@phosphor-icons/react'
import AdminLogin from './AdminLogin'
import OrdersManagement from './OrdersManagement'
import MenuManagement from './MenuManagement'
import CategoryManagement from './CategoryManagement'
import SettingsManagement from './SettingsManagement'
import HeroManagement from './HeroManagement'
import PromotionsManagement from './PromotionsManagement'
import FeaturedItemsManagement from './FeaturedItemsManagement'
import BannersManagement from './BannersManagement'
import LandingPageSettings from './LandingPageSettings'

interface AdminDashboardProps {
  menuItems: MenuItem[]
  setMenuItems: (items: MenuItem[] | ((prev: MenuItem[]) => MenuItem[])) => void
  categories: Category[]
  setCategories: (categories: Category[] | ((prev: Category[]) => Category[])) => void
  orders: Order[]
  setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void
  settings: RestaurantSettings
  setSettings: (settings: RestaurantSettings | ((prev: RestaurantSettings) => RestaurantSettings)) => void
  isAuthenticated: boolean
  setIsAuthenticated: (auth: boolean) => void
  onBackToCustomer: () => void
  heroConfig: HeroConfig
  setHeroConfig: (config: HeroConfig | ((prev: HeroConfig) => HeroConfig)) => void
  promotions: Promotion[]
  setPromotions: (promotions: Promotion[] | ((prev: Promotion[]) => Promotion[])) => void
  featuredItems: FeaturedItem[]
  setFeaturedItems: (items: FeaturedItem[] | ((prev: FeaturedItem[]) => FeaturedItem[])) => void
  banners: Banner[]
  setBanners: (banners: Banner[] | ((prev: Banner[]) => Banner[])) => void
  landingPageConfig: LandingPageConfig
  setLandingPageConfig: (config: LandingPageConfig | ((prev: LandingPageConfig) => LandingPageConfig)) => void
}

export default function AdminDashboard({
  menuItems,
  setMenuItems,
  categories,
  setCategories,
  orders,
  setOrders,
  settings,
  setSettings,
  isAuthenticated,
  setIsAuthenticated,
  onBackToCustomer,
  heroConfig,
  setHeroConfig,
  promotions,
  setPromotions,
  featuredItems,
  setFeaturedItems,
  banners,
  setBanners,
  landingPageConfig,
  setLandingPageConfig,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('orders')

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />
  }

  const pendingOrders = orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBackToCustomer}>
              <ArrowLeft />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">{settings.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="orders" className="relative">
              Orders
              {pendingOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full h-5 w-5 text-xs flex items-center justify-center">
                  {pendingOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
            <TabsTrigger value="landing">Landing Page</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <OrdersManagement orders={orders} setOrders={setOrders} />
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <CategoryManagement categories={categories} setCategories={setCategories} menuItems={menuItems} />
          </TabsContent>

          <TabsContent value="menu" className="mt-6">
            <MenuManagement menuItems={menuItems} setMenuItems={setMenuItems} categories={categories} />
          </TabsContent>

          <TabsContent value="hero" className="mt-6">
            <HeroManagement heroConfig={heroConfig} setHeroConfig={setHeroConfig} />
          </TabsContent>

          <TabsContent value="promotions" className="mt-6">
            <PromotionsManagement promotions={promotions} setPromotions={setPromotions} categories={categories} />
          </TabsContent>

          <TabsContent value="featured" className="mt-6">
            <FeaturedItemsManagement featuredItems={featuredItems} setFeaturedItems={setFeaturedItems} menuItems={menuItems} />
          </TabsContent>

          <TabsContent value="banners" className="mt-6">
            <BannersManagement banners={banners} setBanners={setBanners} categories={categories} />
          </TabsContent>

          <TabsContent value="landing" className="mt-6">
            <LandingPageSettings config={landingPageConfig} setConfig={setLandingPageConfig} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsManagement settings={settings} setSettings={setSettings} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
