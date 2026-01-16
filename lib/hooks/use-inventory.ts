/**
 * Inventory Hooks
 * React hooks for inventory management
 */

import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

// ============================================================================
// INVENTORY ITEMS
// ============================================================================

export function useInventoryItems(params?: {
    categoryId?: string
    lowStock?: boolean
    search?: string
    page?: number
    limit?: number
}) {
    const searchParams = new URLSearchParams()
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId)
    if (params?.lowStock) searchParams.set('lowStock', 'true')
    if (params?.search) searchParams.set('search', params.search)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const url = `/api/inventory/items?${searchParams.toString()}`
    const { data, error, isLoading } = useSWR(url, fetcher)

    return {
        items: data?.items || [],
        pagination: data?.pagination,
        isLoading,
        error,
        refresh: () => mutate(url)
    }
}

export function useInventoryItem(id: string) {
    const { data, error, isLoading } = useSWR(
        id ? `/api/inventory/items/${id}` : null,
        fetcher
    )

    return {
        item: data?.item,
        isLoading,
        error,
        refresh: () => mutate(`/api/inventory/items/${id}`)
    }
}

// ============================================================================
// STOCK OPERATIONS
// ============================================================================

export function useStockAlerts(locationId?: string) {
    const url = locationId
        ? `/api/inventory/stock/alerts?locationId=${locationId}`
        : '/api/inventory/stock/alerts'

    const { data, error, isLoading } = useSWR(url, fetcher, {
        refreshInterval: 60000 // Refresh every minute
    })

    return {
        lowStock: data?.lowStock || { count: 0, items: [] },
        expiring: data?.expiring || { count: 0, lots: [] },
        isLoading,
        error
    }
}

export function useStockMovements(params?: {
    inventoryItemId?: string
    locationId?: string
    movementType?: string
    page?: number
}) {
    const searchParams = new URLSearchParams()
    if (params?.inventoryItemId) searchParams.set('inventoryItemId', params.inventoryItemId)
    if (params?.locationId) searchParams.set('locationId', params.locationId)
    if (params?.movementType) searchParams.set('movementType', params.movementType)
    if (params?.page) searchParams.set('page', params.page.toString())

    const url = `/api/inventory/stock/movements?${searchParams.toString()}`
    const { data, error, isLoading } = useSWR(url, fetcher)

    return {
        movements: data?.movements || [],
        pagination: data?.pagination,
        isLoading,
        error
    }
}

export async function adjustStock(data: {
    inventoryItemId: string
    locationId: string
    quantity: number
    reason?: string
    notes?: string
    performedById: string
}) {
    const res = await fetch('/api/inventory/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/inventory'), undefined, { revalidate: true })
    return res.json()
}

export async function transferStock(data: {
    inventoryItemId: string
    sourceLocationId: string
    destinationLocationId: string
    quantity: number
    performedById: string
    notes?: string
}) {
    const res = await fetch('/api/inventory/stock/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/inventory'), undefined, { revalidate: true })
    return res.json()
}

// ============================================================================
// SUPPLIERS
// ============================================================================

export function useSuppliers(activeOnly = true) {
    const { data, error, isLoading } = useSWR(
        `/api/inventory/suppliers?activeOnly=${activeOnly}`,
        fetcher
    )

    return {
        suppliers: data?.suppliers || [],
        isLoading,
        error,
        refresh: () => mutate('/api/inventory/suppliers')
    }
}

// ============================================================================
// PURCHASE ORDERS
// ============================================================================

export function usePurchaseOrders(params?: { supplierId?: string; status?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.supplierId) searchParams.set('supplierId', params.supplierId)
    if (params?.status) searchParams.set('status', params.status)

    const url = `/api/inventory/purchase-orders?${searchParams.toString()}`
    const { data, error, isLoading } = useSWR(url, fetcher)

    return {
        orders: data?.orders || [],
        isLoading,
        error,
        refresh: () => mutate(url)
    }
}

export function usePurchaseOrder(id: string) {
    const { data, error, isLoading } = useSWR(
        id ? `/api/inventory/purchase-orders/${id}` : null,
        fetcher
    )

    return {
        order: data?.order,
        isLoading,
        error
    }
}

// ============================================================================
// RECIPES
// ============================================================================

export function useRecipe(menuItemId: string) {
    const { data, error, isLoading } = useSWR(
        menuItemId ? `/api/inventory/recipes/${menuItemId}` : null,
        fetcher
    )

    return {
        recipe: data?.recipe,
        isLoading,
        error: error || (data?.error ? new Error(data.error) : null),
        hasRecipe: !error && data?.recipe
    }
}
