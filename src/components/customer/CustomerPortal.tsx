import { useState } from 'react'
import { MenuItem, Order, RestaurantSettings, Category, HeroConfig, Promotion, FeaturedItem, Banner, LandingPageConfig, CartItem } from '@/lib/types'
import OrdersView from './OrdersView'
import { BroadwayLayout } from './BroadwayLayout'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { X } from '@phosphor-icons/react'
import CartSheet from './CartSheet'

import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { ProfileView } from './ProfileView'
import { SidebarNav } from './SidebarNav'
import { LocationModal } from './LocationModal'
import LocationsView from './LocationsView'

interface CustomerPortalProps {
  menuItems: MenuItem[]
  categories: Category[]
  orders: Order[]
  setOrders: (orders: Order[] | ((prev: Order[]) => Order[])) => void
  settings: RestaurantSettings
  onAdminClick: () => void
  heroConfig: HeroConfig
  promotions: Promotion[]
  featuredItems: FeaturedItem[]
  banners: Banner[]
  landingPageConfig: LandingPageConfig
}

export default function CustomerPortal({
  menuItems,
  categories,
  orders,
  setOrders,
  settings,
  onAdminClick: _onAdminClick,
  heroConfig: _heroConfig,
  promotions: _promotions,
  featuredItems: _featuredItems,
  banners,
  landingPageConfig: _landingPageConfig,
}: CustomerPortalProps) {
  const [view, setView] = useState<'home' | 'orders' | 'profile' | 'locations'>('home')
  const [cartRaw, setCart] = useLocalStorage<CartItem[]>('shopping-cart', [])
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Ensure cart is always an array
  const cart = Array.isArray(cartRaw) ? cartRaw : []
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  /* Customer Session State */
  const [customer, setCustomer] = useLocalStorage<any | null>('customer-session', null)

  /* Location State */
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [location, setLocation] = useLocalStorage<{ type: string, country: string, city: string, area: string } | null>('selected-location', null)

  return (
    <div className="min-h-screen bg-background flex">
      <SidebarNav
        currentView={view}
        setView={(v) => {
          if (v === 'cart') {
            setIsCartOpen(true)
          } else if (v === 'landing' || v === 'menu') {
            setView('home')
          } else {
            setView(v as 'home' | 'orders' | 'profile' | 'locations')
          }
        }}
        cartCount={cartItemCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-20 md:ml-24 flex flex-col min-h-screen min-w-0">

        {/* Top Location Bar */}
        {!location && (
          <div
            className="bg-primary text-black py-3 px-4 text-center text-sm font-black tracking-widest sticky top-0 z-40 cursor-pointer hover:bg-primary/90"
            onClick={() => setIsLocationModalOpen(true)}
          >
            SELECT YOUR LOCATION TO ORDER
          </div>
        )}
        {location && (
          <div className="bg-primary text-black py-3 px-4 flex justify-center items-center gap-2 text-sm font-bold tracking-wide sticky top-0 z-40">
            <span className="uppercase">{location.type}: {location.area}, {location.city}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] bg-black/20 hover:bg-black/30 text-black border-none"
              onClick={() => setIsLocationModalOpen(true)}
            >
              CHANGE
            </Button>
          </div>
        )}

        <main className="flex-1 w-full bg-background">
          {view === 'home' ? (
            <BroadwayLayout
              menuItems={menuItems}
              categories={categories}
              banners={banners}
              cart={cart || []}
              setCart={(val) => setCart((prev) => {
                const current = prev || []
                return typeof val === 'function' ? val(current) : val
              })}
              isLocationSet={!!location}
              onRequireLocation={() => setIsLocationModalOpen(true)}
            />
          ) : view === 'orders' ? (
            <div className="max-w-4xl mx-auto px-4 py-8">
              <OrdersView orders={orders} customer={customer} />
            </div>
          ) : view === 'profile' ? (
            <div className="max-w-6xl mx-auto px-4 py-8">
              <ProfileView customer={customer} setCustomer={setCustomer} sessionOrders={orders} />
            </div>
          ) : view === 'locations' ? (
            <LocationsView />
          ) : null}
        </main>
      </div>

      {/* Cart Sheet - Fixed Header with Scrollable Content */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="bottom" className="h-[90vh] md:h-[85vh] w-full flex flex-col p-0 bg-card border-border border-t-2 border-primary/20 text-foreground rounded-t-[3rem] focus:outline-none overflow-hidden">
          {/* Fixed Handle and Header */}
          <div className="shrink-0 bg-card/80 backdrop-blur-xl border-b border-border pt-4 pb-6 z-50 relative">
            <div className="w-16 h-1 bg-muted rounded-full mx-auto mb-6" />

            <SheetClose className="absolute top-8 right-8 p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all focus:outline-none">
              <X size={24} weight="bold" />
            </SheetClose>

            <SheetHeader>
              <SheetTitle className="text-primary font-black uppercase text-3xl tracking-tighter text-center">Your Order</SheetTitle>
            </SheetHeader>
          </div>

          {/* Scrollable Items Area */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="max-w-4xl mx-auto px-6 md:px-10 pb-20">
              <CartSheet
                cart={cart || []}
                setCart={(val) => setCart((prev) => {
                  const current = prev || []
                  return typeof val === 'function' ? val(current) : val
                })}
                settings={settings}
                orders={orders}
                setOrders={setOrders}
                location={location}
                onClose={() => setIsCartOpen(false)}
                customer={customer}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Location Modal */}
      <LocationModal
        open={isLocationModalOpen}
        onOpenChange={setIsLocationModalOpen}
        onLocationConfirm={(details) => {
          setLocation(details)
        }}
      />
    </div>
  )
}
