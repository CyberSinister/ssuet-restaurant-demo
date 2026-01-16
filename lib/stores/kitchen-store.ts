/**
 * Kitchen Store
 * Zustand store for kitchen display state
 */

import { create } from 'zustand'

interface KitchenOrder {
    id: string
    ticketNumber: number
    orderId: string
    orderNumber: string
    orderType: string
    tableNumber?: string
    status: string
    priority: number
    receivedAt: Date
    items: KitchenOrderItem[]
}

interface KitchenOrderItem {
    id: string
    menuItemName: string
    quantity: number
    status: string
    modifiers?: string[]
    notes?: string
}

interface KitchenState {
    // Station
    stationId: string | null
    stationName: string | null

    // Orders
    orders: KitchenOrder[]
    selectedOrderId: string | null

    // Filters
    statusFilter: string[]
    sortBy: 'time' | 'priority' | 'table'
    sortDirection: 'asc' | 'desc'

    // UI
    viewMode: 'tickets' | 'items'
    compactMode: boolean
    soundEnabled: boolean

    // Actions
    setStation: (id: string, name: string) => void
    clearStation: () => void

    setOrders: (orders: KitchenOrder[]) => void
    addOrder: (order: KitchenOrder) => void
    updateOrder: (id: string, updates: Partial<KitchenOrder>) => void
    removeOrder: (id: string) => void

    selectOrder: (id: string | null) => void

    setStatusFilter: (statuses: string[]) => void
    setSortBy: (sortBy: KitchenState['sortBy']) => void
    toggleSortDirection: () => void
    setViewMode: (mode: KitchenState['viewMode']) => void
    toggleCompactMode: () => void
    toggleSound: () => void

    getFilteredOrders: () => KitchenOrder[]
    getOrdersByStatus: () => Record<string, KitchenOrder[]>
}

export const useKitchenStore = create<KitchenState>()((set, get) => ({
    // Initial state
    stationId: null,
    stationName: null,
    orders: [],
    selectedOrderId: null,
    statusFilter: ['NEW', 'VIEWED', 'IN_PROGRESS'],
    sortBy: 'time',
    sortDirection: 'asc',
    viewMode: 'tickets',
    compactMode: false,
    soundEnabled: true,

    // Station actions
    setStation: (id, name) => set({ stationId: id, stationName: name }),
    clearStation: () => set({ stationId: null, stationName: null, orders: [] }),

    // Order actions
    setOrders: (orders) => set({ orders }),

    addOrder: (order) => {
        set((state) => ({
            orders: [...state.orders, order]
        }))
        // Play notification sound
        if (get().soundEnabled) {
            playNotificationSound()
        }
    },

    updateOrder: (id, updates) => {
        set((state) => ({
            orders: state.orders.map((order) =>
                order.id === id ? { ...order, ...updates } : order
            )
        }))
    },

    removeOrder: (id) => {
        set((state) => ({
            orders: state.orders.filter((order) => order.id !== id),
            selectedOrderId: state.selectedOrderId === id ? null : state.selectedOrderId
        }))
    },

    selectOrder: (id) => set({ selectedOrderId: id }),

    // Filter actions
    setStatusFilter: (statuses) => set({ statusFilter: statuses }),
    setSortBy: (sortBy) => set({ sortBy }),
    toggleSortDirection: () =>
        set((state) => ({
            sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc'
        })),
    setViewMode: (mode) => set({ viewMode: mode }),
    toggleCompactMode: () =>
        set((state) => ({ compactMode: !state.compactMode })),
    toggleSound: () =>
        set((state) => ({ soundEnabled: !state.soundEnabled })),

    // Computed
    getFilteredOrders: () => {
        const state = get()
        let filtered = state.orders.filter((order) =>
            state.statusFilter.includes(order.status)
        )

        // Sort
        filtered.sort((a, b) => {
            let comparison = 0
            switch (state.sortBy) {
                case 'time':
                    comparison = new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
                    break
                case 'priority':
                    comparison = b.priority - a.priority
                    break
                case 'table':
                    comparison = (a.tableNumber || '').localeCompare(b.tableNumber || '')
                    break
            }
            return state.sortDirection === 'asc' ? comparison : -comparison
        })

        return filtered
    },

    getOrdersByStatus: () => {
        const orders = get().orders
        return orders.reduce((acc, order) => {
            if (!acc[order.status]) acc[order.status] = []
            acc[order.status].push(order)
            return acc
        }, {} as Record<string, KitchenOrder[]>)
    }
}))

// Helper function for notification sound
function playNotificationSound() {
    if (typeof window !== 'undefined') {
        try {
            const audio = new Audio('/sounds/notification.mp3')
            audio.volume = 0.5
            audio.play().catch(() => {/* ignore errors */ })
        } catch {
            // Ignore audio errors
        }
    }
}
