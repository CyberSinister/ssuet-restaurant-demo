import { create } from 'zustand'

interface UIStore {
  isCartOpen: boolean
  setCartOpen: (open: boolean) => void
  currentView: 'menu' | 'orders'
  setCurrentView: (view: 'menu' | 'orders') => void
}

export const useUIStore = create<UIStore>((set) => ({
  isCartOpen: false,
  setCartOpen: (open) => set({ isCartOpen: open }),
  currentView: 'menu',
  setCurrentView: (view) => set({ currentView: view }),
}))
