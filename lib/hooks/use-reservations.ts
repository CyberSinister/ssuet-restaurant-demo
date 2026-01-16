/**
 * Reservations Hooks
 * React hooks for reservations and waitlist
 */

import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

// ============================================================================
// RESERVATIONS
// ============================================================================

export function useReservations(params?: {
    locationId?: string
    date?: string
    status?: string
    page?: number
}) {
    const searchParams = new URLSearchParams()
    if (params?.locationId) searchParams.set('locationId', params.locationId)
    if (params?.date) searchParams.set('date', params.date)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.page) searchParams.set('page', params.page.toString())

    const url = `/api/reservations?${searchParams.toString()}`
    const { data, error, isLoading } = useSWR(url, fetcher)

    return {
        reservations: data?.reservations || [],
        pagination: data?.pagination,
        isLoading,
        error,
        refresh: () => mutate(url)
    }
}

export function useReservation(id: string) {
    const { data, error, isLoading } = useSWR(
        id ? `/api/reservations/${id}` : null,
        fetcher
    )

    return {
        reservation: data?.reservation,
        isLoading,
        error
    }
}

export function useAvailability(params: {
    locationId: string
    date: string
    time: string
    partySize: number
    duration?: number
}) {
    const searchParams = new URLSearchParams()
    searchParams.set('locationId', params.locationId)
    searchParams.set('date', params.date)
    searchParams.set('time', params.time)
    searchParams.set('partySize', params.partySize.toString())
    if (params.duration) searchParams.set('duration', params.duration.toString())

    const url = `/api/reservations/availability?${searchParams.toString()}`
    const { data, error, isLoading } = useSWR(
        params.locationId && params.date && params.time ? url : null,
        fetcher
    )

    return {
        available: data?.available || false,
        tables: data?.tables || { available: [], unavailable: [] },
        alternativeSlots: data?.alternativeSlots || [],
        isLoading,
        error
    }
}

export async function createReservation(data: {
    locationId: string
    guestName: string
    guestPhone: string
    guestEmail?: string
    partySize: number
    date: string
    startTime: string
    tableId?: string
    specialRequests?: string
}) {
    const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/reservations'), undefined, { revalidate: true })
    return res.json()
}

export async function confirmReservation(id: string) {
    const res = await fetch(`/api/reservations/${id}/confirm`, { method: 'POST' })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/reservations'), undefined, { revalidate: true })
    return res.json()
}

export async function seatReservation(id: string, tableId?: string) {
    const res = await fetch(`/api/reservations/${id}/seat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId })
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/reservations'), undefined, { revalidate: true })
    mutate((key: string) => key.includes('/api/tables'), undefined, { revalidate: true })
    return res.json()
}

export async function cancelReservation(id: string, reason?: string) {
    const res = await fetch(`/api/reservations/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/reservations'), undefined, { revalidate: true })
    return res.json()
}

// ============================================================================
// WAITLIST
// ============================================================================

export function useWaitlist(locationId: string, status?: string) {
    const params = new URLSearchParams()
    params.set('locationId', locationId)
    if (status) params.set('status', status)

    const url = `/api/waitlist?${params.toString()}`
    const { data, error, isLoading } = useSWR(locationId ? url : null, fetcher, {
        refreshInterval: 15000 // Poll every 15 seconds
    })

    return {
        entries: data?.entries || [],
        isLoading,
        error,
        refresh: () => mutate(url)
    }
}

export async function addToWaitlist(data: {
    locationId: string
    guestName: string
    guestPhone: string
    partySize: number
    seatingPreference?: string
    notes?: string
}) {
    const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/waitlist'), undefined, { revalidate: true })
    return res.json()
}

export async function notifyWaitlistEntry(id: string, method?: string) {
    const res = await fetch(`/api/waitlist/${id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationMethod: method })
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/waitlist'), undefined, { revalidate: true })
    return res.json()
}

export async function seatWaitlistEntry(id: string, tableId: string) {
    const res = await fetch(`/api/waitlist/${id}/seat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId })
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/waitlist'), undefined, { revalidate: true })
    mutate((key: string) => key.includes('/api/tables'), undefined, { revalidate: true })
    return res.json()
}
