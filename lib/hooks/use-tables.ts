/**
 * Tables Hooks
 * React hooks for table management
 */

import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

// ============================================================================
// AREAS
// ============================================================================

export function useAreas(locationId?: string) {
    const url = locationId ? `/api/areas?locationId=${locationId}` : '/api/areas'
    const { data, error, isLoading } = useSWR(url, fetcher)

    return {
        areas: data?.areas || [],
        isLoading,
        error
    }
}

// ============================================================================
// TABLES
// ============================================================================

export function useTables(params?: { areaId?: string; status?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.areaId) searchParams.set('areaId', params.areaId)
    if (params?.status) searchParams.set('status', params.status)

    const url = `/api/tables?${searchParams.toString()}`
    const { data, error, isLoading } = useSWR(url, fetcher, {
        refreshInterval: 10000 // Poll every 10 seconds
    })

    return {
        tables: data?.tables || [],
        isLoading,
        error,
        refresh: () => mutate(url)
    }
}

export function useTable(id: string) {
    const { data, error, isLoading } = useSWR(
        id ? `/api/tables/${id}` : null,
        fetcher
    )

    return {
        table: data?.table,
        isLoading,
        error
    }
}

export async function updateTableStatus(tableId: string, status: string) {
    const res = await fetch(`/api/tables/${tableId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/tables'), undefined, { revalidate: true })
    return res.json()
}

export async function combineTables(tableIds: string[], status?: string) {
    const res = await fetch('/api/tables/combine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableIds, status })
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/tables'), undefined, { revalidate: true })
    return res.json()
}

export async function separateTables(tableId: string) {
    const res = await fetch('/api/tables/separate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId })
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/tables'), undefined, { revalidate: true })
    return res.json()
}

// ============================================================================
// UTILITY
// ============================================================================

export function getTableStatusColor(status: string): string {
    const colors: Record<string, string> = {
        'AVAILABLE': '#22c55e', // green
        'OCCUPIED': '#f97316', // orange
        'RESERVED': '#3b82f6', // blue
        'CLEANING': '#eab308', // yellow
        'BLOCKED': '#6b7280'   // gray
    }
    return colors[status] || '#6b7280'
}
