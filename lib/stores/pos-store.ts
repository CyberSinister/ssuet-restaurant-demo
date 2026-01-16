/**
 * POS Store
 * Zustand store for POS terminal state
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
    id: string
    menuItemId: string
    name: string
    price: number
    quantity: number
    modifiers?: { id: string; name: string; price: number }[]
    notes?: string
}

interface POSState {
    // Terminal
    terminalId: string | null
    terminalName: string | null
    locationId: string | null

    // Shift
    shiftId: string | null
    shiftUserId: string | null

    // Cart
    cart: CartItem[]
    customerId: string | null
    orderType: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY'
    tableId: string | null

    // Discount
    discountType: 'percentage' | 'fixed' | 'coupon' | null
    discountValue: number
    discountCode: string | null

    // Totals
    subtotal: number
    discountAmount: number
    taxRate: number
    taxAmount: number
    total: number

    // Actions
    setTerminal: (id: string, name: string, locationId: string) => void
    clearTerminal: () => void
    setShift: (shiftId: string, userId: string) => void
    clearShift: () => void

    addToCart: (item: Omit<CartItem, 'id'>) => void
    updateCartItem: (id: string, updates: Partial<CartItem>) => void
    removeFromCart: (id: string) => void
    clearCart: () => void

    setOrderType: (type: POSState['orderType']) => void
    setTableId: (tableId: string | null) => void
    setCustomerId: (customerId: string | null) => void

    applyDiscount: (type: POSState['discountType'], value: number, code?: string) => void
    clearDiscount: () => void

    calculateTotals: () => void
    reset: () => void
}

const TAX_RATE = 0.16 // 16% default tax

export const usePOSStore = create<POSState>()(
    persist(
        (set, get) => ({
            // Initial state
            terminalId: null,
            terminalName: null,
            locationId: null,
            shiftId: null,
            shiftUserId: null,
            cart: [],
            customerId: null,
            orderType: 'DINE_IN',
            tableId: null,
            discountType: null,
            discountValue: 0,
            discountCode: null,
            subtotal: 0,
            discountAmount: 0,
            taxRate: TAX_RATE,
            taxAmount: 0,
            total: 0,

            // Terminal actions
            setTerminal: (id, name, locationId) => set({ terminalId: id, terminalName: name, locationId }),
            clearTerminal: () => set({ terminalId: null, terminalName: null, locationId: null }),

            // Shift actions
            setShift: (shiftId, userId) => set({ shiftId, shiftUserId: userId }),
            clearShift: () => set({ shiftId: null, shiftUserId: null }),

            // Cart actions
            addToCart: (item) => {
                const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                set((state) => ({
                    cart: [...state.cart, { ...item, id }]
                }))
                get().calculateTotals()
            },

            updateCartItem: (id, updates) => {
                set((state) => ({
                    cart: state.cart.map((item) =>
                        item.id === id ? { ...item, ...updates } : item
                    )
                }))
                get().calculateTotals()
            },

            removeFromCart: (id) => {
                set((state) => ({
                    cart: state.cart.filter((item) => item.id !== id)
                }))
                get().calculateTotals()
            },

            clearCart: () => {
                set({ cart: [], customerId: null, tableId: null })
                get().calculateTotals()
            },

            // Order type
            setOrderType: (type) => set({ orderType: type }),
            setTableId: (tableId) => set({ tableId }),
            setCustomerId: (customerId) => set({ customerId }),

            // Discount
            applyDiscount: (type, value, code) => {
                set({ discountType: type, discountValue: value, discountCode: code || null })
                get().calculateTotals()
            },

            clearDiscount: () => {
                set({ discountType: null, discountValue: 0, discountCode: null })
                get().calculateTotals()
            },

            // Calculate totals
            calculateTotals: () => {
                const state = get()
                const subtotal = state.cart.reduce((sum, item) => {
                    const modifiersTotal = (item.modifiers || []).reduce((m, mod) => m + mod.price, 0)
                    return sum + (item.price + modifiersTotal) * item.quantity
                }, 0)

                let discountAmount = 0
                if (state.discountType === 'percentage') {
                    discountAmount = subtotal * (state.discountValue / 100)
                } else if (state.discountType === 'fixed' || state.discountType === 'coupon') {
                    discountAmount = Math.min(state.discountValue, subtotal)
                }

                const taxableAmount = subtotal - discountAmount
                const taxAmount = taxableAmount * state.taxRate
                const total = taxableAmount + taxAmount

                set({ subtotal, discountAmount, taxAmount, total })
            },

            // Reset
            reset: () => {
                set({
                    cart: [],
                    customerId: null,
                    orderType: 'DINE_IN',
                    tableId: null,
                    discountType: null,
                    discountValue: 0,
                    discountCode: null,
                    subtotal: 0,
                    discountAmount: 0,
                    taxAmount: 0,
                    total: 0
                })
            }
        }),
        {
            name: 'pos-store',
            partialize: (state) => ({
                terminalId: state.terminalId,
                terminalName: state.terminalName,
                locationId: state.locationId,
                shiftId: state.shiftId,
                shiftUserId: state.shiftUserId
            })
        }
    )
)
