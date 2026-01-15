import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { CartItem, MenuItem } from '@/lib/types'

interface CartStore {
  cart: CartItem[]
  addItem: (menuItem: MenuItem) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],

      addItem: (menuItem) =>
        set((state) => {
          const existingItem = state.cart.find(
            (item) => item.menuItem.id === menuItem.id
          )

          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.menuItem.id === menuItem.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            }
          }

          return {
            cart: [...state.cart, { menuItem, quantity: 1 }],
          }
        }),

      removeItem: (menuItemId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.menuItem.id !== menuItemId),
        })),

      updateQuantity: (menuItemId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              cart: state.cart.filter((item) => item.menuItem.id !== menuItemId),
            }
          }

          return {
            cart: state.cart.map((item) =>
              item.menuItem.id === menuItemId
                ? { ...item, quantity }
                : item
            ),
          }
        }),

      clearCart: () => set({ cart: [] }),

      getSubtotal: () => {
        const state = get()
        return state.cart.reduce(
          (sum, item) => sum + item.menuItem.price * item.quantity,
          0
        )
      },

      getItemCount: () => {
        const state = get()
        return state.cart.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'shopping-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
