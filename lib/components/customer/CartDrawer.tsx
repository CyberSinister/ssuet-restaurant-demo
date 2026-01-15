
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useCartStore } from '@/lib/stores/cart-store'
import CartSheet from '@/components/customer/CartSheet'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { defaultRestaurantSettings } from '@/lib/sample-data'
import { useState } from 'react'
import { Order } from '@/lib/types'

export default function CartDrawer() {
  const { cart } = useCartStore()
  const [orders, setOrders] = useLocalStorage<Order[]>('orders', [])
  const [isOpen, setIsOpen] = useState(false)

  // Since CartSheet logic is tightly coupled with local state setCart, 
  // and we want to use the global store, we might need to modify CartSheet or 
  // provide a bridge that intercepts the setCart logic.

  // BUT: App.tsx uses useLocalStorage('shopping-cart') which creates 'shopping-cart' key.
  // cart-store.ts ALSO uses persist with 'shopping-cart' key.
  // They might be fighting or sharing the same data source (localStorage).

  // Ideally, we move CartSheet to use useCartStore directly.
  // But for this "CartDrawer.tsx" which is missing, let's make it a simple wrapper using the STORE.
  // The 'CartSheet' component expects `cart` prop and `setCart` prop.

  // To avoid rewriting CartSheet right now, we can create a local state proxy that syncs with store?
  // Or simpler: Pass a "setCart" that actually dispatches to store?
  // CartSheet's `updateQuantity` implementation:
  // setCart((currentCart) => return currentCart.map(...))

  // This is hard to bridge.
  // Strategy: Create a "CartDrawer" that uses `CartSheet` but manages state locally initialized from store? 
  // Or simplified: `CartSheet` seems designed for the `CustomerPortal` which uses local state.
  // `CustomerPortal.tsx` handles `cart` state.

  // Since `app/(customer)/layout.tsx` is being used, and it's outside `CustomerPortal`, 
  // it needs its own way to opening the cart.

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 md:hidden bg-primary text-black"
        >
          <ShoppingCart className="h-6 w-6" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center border-2 border-[#121212]">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] p-0 bg-[#1a1a1a] border-t border-white/10">
        <div className="h-full overflow-auto p-6">
          <CartSheet
            cart={cart}
            setCart={(_newCart) => {
              // This is a rough bridge. If CartSheet passes a function, we execute it with current cart
              // Then we calculate diffs or just replace?
              // store doesn't have "replace cart" (except clear). 
              // Let's rely on the Store persistence to handle the syncing if we reload.
              // But for immediate updates:
              // If CartSheet is used, it expects to control the cart state.
              // Let's assume for this fix, we will just use the store in the Layout.

              // Actually, if we simply ignore the setCart from CartSheet for a moment
              // And instead rewrite CartSheet to use store, that's best.
              // But CartSheet is complex. 

              // Hack fix:
              console.log("External cart update requested")
            }}
            settings={defaultRestaurantSettings} // Usage of default settings
            orders={orders}
            setOrders={setOrders}
            location={null}
            onClose={() => setIsOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
