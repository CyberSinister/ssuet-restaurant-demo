import { useState, useEffect } from 'react'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { Toaster } from '@/components/ui/sonner'
import CustomerPortal from '@/components/customer/CustomerPortal'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { MenuItem, Order, RestaurantSettings, Category, HeroConfig, Promotion, FeaturedItem, Banner, LandingPageConfig } from '@/lib/types'
import { sampleMenuItems, sampleCategories, defaultRestaurantSettings, defaultHeroConfig, defaultLandingPageConfig, samplePromotions, sampleFeaturedItems, sampleBanners } from '@/lib/sample-data'

function App() {
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', sampleCategories)
  const [menuItems, setMenuItems] = useLocalStorage<MenuItem[]>('menu-items', sampleMenuItems)
  const [orders, setOrders] = useLocalStorage<Order[]>('orders', [])
  const [settings, setSettings] = useLocalStorage<RestaurantSettings>('restaurant-settings', defaultRestaurantSettings)
  const [isAdminView, setIsAdminView] = useState(false)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)

  // Landing page state
  const [heroConfig, setHeroConfig] = useLocalStorage<HeroConfig>('hero-config', defaultHeroConfig)
  const [promotions, setPromotions] = useLocalStorage<Promotion[]>('promotions', samplePromotions)
  const [featuredItems, setFeaturedItems] = useLocalStorage<FeaturedItem[]>('featured-items', sampleFeaturedItems)
  const [banners, setBanners] = useLocalStorage<Banner[]>('banners', sampleBanners)
  const [landingPageConfig, setLandingPageConfig] = useLocalStorage<LandingPageConfig>('landing-page-config', defaultLandingPageConfig)

  // Syncer: Fetch real data from Prisma API on mount
  useEffect(() => {
    async function syncData() {
      try {
        console.log('Syncing data from API...')

        // 1. Fetch Categories
        const catRes = await fetch('/api/categories?includeInactive=true')
        if (catRes.ok) {
          const catData = await catRes.json()
          if (catData && catData.length > 0) setCategories(catData)
        }

        // 2. Fetch Menu Items
        const menuRes = await fetch('/api/menu?includeInactive=true')
        if (menuRes.ok) {
          const menuData = await menuRes.json()
          if (menuData && menuData.length > 0) setMenuItems(menuData)
        }

        // 3. Fetch Settings
        const settingsRes = await fetch('/api/settings')
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          if (settingsData) setSettings(settingsData)
        }

        // 4. Fetch Orders
        const ordersRes = await fetch('/api/orders')
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          if (ordersData.data && Array.isArray(ordersData.data)) {
            setOrders(ordersData.data)
          }
        }
      } catch (error) {
        console.error('Failed to sync data from API:', error)
      }
    }

    syncData()
  }, [setCategories, setMenuItems, setOrders, setSettings])

  if (!menuItems || !orders || !settings || !categories || !heroConfig || !promotions || !featuredItems || !banners || !landingPageConfig) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <>
      {isAdminView ? (
        <AdminDashboard
          menuItems={menuItems}
          setMenuItems={setMenuItems}
          categories={categories}
          setCategories={setCategories}
          orders={orders}
          setOrders={setOrders}
          settings={settings}
          setSettings={setSettings}
          isAuthenticated={isAdminAuthenticated}
          setIsAuthenticated={setIsAdminAuthenticated}
          onBackToCustomer={() => setIsAdminView(false)}
          heroConfig={heroConfig}
          setHeroConfig={setHeroConfig}
          promotions={promotions}
          setPromotions={setPromotions}
          featuredItems={featuredItems}
          setFeaturedItems={setFeaturedItems}
          banners={banners}
          setBanners={setBanners}
          landingPageConfig={landingPageConfig}
          setLandingPageConfig={setLandingPageConfig}
        />
      ) : (
        <CustomerPortal
          menuItems={menuItems}
          categories={categories}
          orders={orders}
          setOrders={setOrders}
          settings={settings}
          onAdminClick={() => setIsAdminView(true)}
          heroConfig={heroConfig}
          promotions={promotions}
          featuredItems={featuredItems}
          banners={banners}
          landingPageConfig={landingPageConfig}
        />
      )}
      <Toaster />
    </>
  )
}

export default App