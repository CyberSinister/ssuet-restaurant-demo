/**
 * Kitchen Hooks
 * React hooks for kitchen display system
 */

import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

// ============================================================================
// STATIONS
// ============================================================================

export function useKitchenStations(locationId?: string) {
    const url = locationId
        ? `/api/kitchen/stations?locationId=${locationId}`
        : '/api/kitchen/stations'

    const { data, error, isLoading } = useSWR(url, fetcher)

    return {
        stations: data?.stations || [],
        isLoading,
        error
    }
}

// ============================================================================
// KITCHEN ORDERS
// ============================================================================

export function useKitchenOrders(params?: {
    stationId?: string
    status?: string
}) {
    const searchParams = new URLSearchParams()
    if (params?.stationId) searchParams.set('stationId', params.stationId)
    if (params?.status) searchParams.set('status', params.status)

    const url = `/api/kitchen/orders?${searchParams.toString()}`
    const { data, error, isLoading } = useSWR(url, fetcher, {
        refreshInterval: 5000 // Poll every 5 seconds for real-time feel
    })

    return {
        orders: data?.orders || [],
        isLoading,
        error,
        refresh: () => mutate(url)
    }
}

export function useActiveKitchenOrders(stationId: string) {
    const url = `/api/kitchen/orders?stationId=${stationId}&status=NEW,VIEWED,IN_PROGRESS`

    const { data, error, isLoading } = useSWR(stationId ? url : null, fetcher, {
        refreshInterval: 3000 // More frequent for active orders
    })

    return {
        orders: data?.orders || [],
        isLoading,
        error,
        refresh: () => mutate(url)
    }
}

export async function bumpOrder(orderId: string) {
    const res = await fetch(`/api/kitchen/orders/${orderId}/bump`, {
        method: 'POST'
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/kitchen/orders'), undefined, { revalidate: true })
    return res.json()
}

export async function updateItemStatus(itemId: string, status: string) {
    const res = await fetch(`/api/kitchen/items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/kitchen'), undefined, { revalidate: true })
    return res.json()
}

// ============================================================================
// METRICS
// ============================================================================

export function useKitchenMetrics(params?: {
    stationId?: string
    locationId?: string
    startDate?: string
    endDate?: string
}) {
    const searchParams = new URLSearchParams()
    if (params?.stationId) searchParams.set('stationId', params.stationId)
    if (params?.locationId) searchParams.set('locationId', params.locationId)
    if (params?.startDate) searchParams.set('startDate', params.startDate)
    if (params?.endDate) searchParams.set('endDate', params.endDate)

    const url = `/api/kitchen/metrics?${searchParams.toString()}`
    const { data, error, isLoading } = useSWR(url, fetcher, {
        refreshInterval: 30000 // Update every 30 seconds
    })

    return {
        summary: data?.summary,
        statusBreakdown: data?.statusBreakdown,
        byStation: data?.byStation || [],
        isLoading,
        error
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function calculateOrderAge(receivedAt: Date | string): { seconds: number; isOverdue: boolean; urgency: 'normal' | 'warning' | 'critical' } {
    const received = new Date(receivedAt)
    const seconds = Math.floor((Date.now() - received.getTime()) / 1000)

    let urgency: 'normal' | 'warning' | 'critical' = 'normal'
    if (seconds > 900) urgency = 'critical' // > 15 min
    else if (seconds > 600) urgency = 'warning' // > 10 min

    return {
        seconds,
        isOverdue: seconds > 600, // > 10 min default
        urgency
    }
}

export function formatPrepTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remaining = seconds % 60
    return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`
}
