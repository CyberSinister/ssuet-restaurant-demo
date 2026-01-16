/**
 * Table Store
 * Zustand store for table map and reservation state
 */

import { create } from 'zustand'

interface Table {
    id: string
    tableNumber: string
    areaId: string
    areaName: string
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'BLOCKED'
    minSeats: number
    maxSeats: number
    positionX?: number
    positionY?: number
    shape?: string
    combinedWith?: string[]
}

interface Reservation {
    id: string
    guestName: string
    partySize: number
    date: string
    startTime: string
    status: string
    tableId?: string
}

interface TableState {
    // Location
    locationId: string | null

    // Tables
    tables: Table[]
    selectedTableId: string | null
    selectedTables: string[] // For combining

    // Reservations
    reservations: Reservation[]
    selectedDate: string // YYYY-MM-DD format

    // UI
    viewMode: 'grid' | 'map' | 'list'
    areaFilter: string | null
    statusFilter: string[]
    showCombined: boolean

    // Actions
    setLocationId: (id: string) => void
    setTables: (tables: Table[]) => void
    updateTable: (id: string, updates: Partial<Table>) => void

    selectTable: (id: string | null) => void
    toggleTableSelection: (id: string) => void
    clearTableSelection: () => void

    setReservations: (reservations: Reservation[]) => void
    setSelectedDate: (date: string) => void

    setViewMode: (mode: TableState['viewMode']) => void
    setAreaFilter: (areaId: string | null) => void
    setStatusFilter: (statuses: string[]) => void
    toggleShowCombined: () => void

    getFilteredTables: () => Table[]
    getTableById: (id: string) => Table | undefined
    getAvailableTables: (partySize?: number) => Table[]
    getTablesByArea: () => Record<string, Table[]>
}

export const useTableStore = create<TableState>()((set, get) => ({
    // Initial state
    locationId: null,
    tables: [],
    selectedTableId: null,
    selectedTables: [],
    reservations: [],
    selectedDate: new Date().toISOString().split('T')[0],
    viewMode: 'grid',
    areaFilter: null,
    statusFilter: [],
    showCombined: true,

    // Location
    setLocationId: (id) => set({ locationId: id }),

    // Table actions
    setTables: (tables) => set({ tables }),

    updateTable: (id, updates) => {
        set((state) => ({
            tables: state.tables.map((table) =>
                table.id === id ? { ...table, ...updates } : table
            )
        }))
    },

    selectTable: (id) => set({ selectedTableId: id }),

    toggleTableSelection: (id) => {
        set((state) => {
            const isSelected = state.selectedTables.includes(id)
            return {
                selectedTables: isSelected
                    ? state.selectedTables.filter((t) => t !== id)
                    : [...state.selectedTables, id]
            }
        })
    },

    clearTableSelection: () => set({ selectedTables: [], selectedTableId: null }),

    // Reservation actions
    setReservations: (reservations) => set({ reservations }),
    setSelectedDate: (date) => set({ selectedDate: date }),

    // UI actions
    setViewMode: (mode) => set({ viewMode: mode }),
    setAreaFilter: (areaId) => set({ areaFilter: areaId }),
    setStatusFilter: (statuses) => set({ statusFilter: statuses }),
    toggleShowCombined: () =>
        set((state) => ({ showCombined: !state.showCombined })),

    // Computed
    getFilteredTables: () => {
        const state = get()
        let filtered = [...state.tables]

        // Filter by area
        if (state.areaFilter) {
            filtered = filtered.filter((t) => t.areaId === state.areaFilter)
        }

        // Filter by status
        if (state.statusFilter.length > 0) {
            filtered = filtered.filter((t) => state.statusFilter.includes(t.status))
        }

        // Filter combined
        if (!state.showCombined) {
            filtered = filtered.filter((t) => !t.combinedWith?.length)
        }

        return filtered
    },

    getTableById: (id) => get().tables.find((t) => t.id === id),

    getAvailableTables: (partySize) => {
        const tables = get().tables.filter((t) => t.status === 'AVAILABLE')
        if (partySize) {
            return tables.filter((t) => t.maxSeats >= partySize)
        }
        return tables
    },

    getTablesByArea: () => {
        return get().tables.reduce((acc, table) => {
            const area = table.areaName || 'Unassigned'
            if (!acc[area]) acc[area] = []
            acc[area].push(table)
            return acc
        }, {} as Record<string, Table[]>)
    }
}))
