/**
 * POS Hooks
 * React hooks for POS terminal and shift management
 */

import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

// ============================================================================
// TERMINALS
// ============================================================================

export function useTerminals(locationId?: string) {
    const url = locationId
        ? `/api/pos/terminals?locationId=${locationId}`
        : '/api/pos/terminals'

    const { data, error, isLoading } = useSWR(url, fetcher)

    return {
        terminals: data?.terminals || [],
        isLoading,
        error,
        refresh: () => mutate(url)
    }
}

export function useTerminal(id: string) {
    const { data, error, isLoading } = useSWR(
        id ? `/api/pos/terminals/${id}` : null,
        fetcher
    )

    return {
        terminal: data?.terminal,
        isLoading,
        error,
        refresh: () => mutate(`/api/pos/terminals/${id}`)
    }
}

export async function createTerminal(data: {
    name: string
    terminalType?: string
    locationId: string
    deviceId?: string
    ipAddress?: string
}) {
    const res = await fetch('/api/pos/terminals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.startsWith('/api/pos/terminals'), undefined, { revalidate: true })
    return res.json()
}

export async function updateTerminal(id: string, data: Partial<{
    name: string
    terminalType: string
    isActive: boolean
    settings: Record<string, unknown>
}>) {
    const res = await fetch(`/api/pos/terminals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.startsWith('/api/pos/terminals'), undefined, { revalidate: true })
    return res.json()
}

// ============================================================================
// SHIFTS
// ============================================================================

export function useShifts(terminalId?: string, status?: string) {
    const params = new URLSearchParams()
    if (terminalId) params.set('terminalId', terminalId)
    if (status) params.set('status', status)

    const url = `/api/pos/shifts?${params.toString()}`
    const { data, error, isLoading } = useSWR(url, fetcher)

    return {
        shifts: data?.shifts || [],
        isLoading,
        error,
        refresh: () => mutate(url)
    }
}

export function useCurrentShift(terminalId: string) {
    const url = terminalId ? `/api/pos/shifts?terminalId=${terminalId}&status=OPEN` : null
    const { data, error, isLoading } = useSWR(url, fetcher)

    return {
        shift: data?.shifts?.[0] || null,
        isLoading,
        error,
        refresh: () => mutate(url)
    }
}

export async function openShift(data: {
    terminalId: string
    userId: string
    openingCash: number
}) {
    const res = await fetch('/api/pos/shifts/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/pos/shifts'), undefined, { revalidate: true })
    return res.json()
}

export async function closeShift(shiftId: string, data: {
    closingCash: number
    notes?: string
}) {
    const res = await fetch(`/api/pos/shifts/${shiftId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/pos/shifts'), undefined, { revalidate: true })
    return res.json()
}

// ============================================================================
// PAYMENTS
// ============================================================================

export function usePaymentMethods() {
    const { data, error, isLoading } = useSWR('/api/payments/methods', fetcher)

    return {
        methods: data?.methods || [],
        isLoading,
        error
    }
}

export function useOrderPayments(orderId: string) {
    const { data, error, isLoading } = useSWR(
        orderId ? `/api/payments?orderId=${orderId}` : null,
        fetcher
    )

    return {
        transactions: data?.transactions || [],
        isLoading,
        error,
        refresh: () => mutate(`/api/payments?orderId=${orderId}`)
    }
}

export async function processPayment(data: {
    orderId: string
    paymentMethodId: string
    amount: number
    tipAmount?: number
    terminalId?: string
    shiftId?: string
    isSplitPayment?: boolean
    splitIndex?: number
}) {
    const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/payments'), undefined, { revalidate: true })
    return res.json()
}

export async function processRefund(transactionId: string, data: {
    amount: number
    reason: string
    refundedBy?: string
}) {
    const res = await fetch(`/api/payments/${transactionId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error((await res.json()).error)
    mutate((key: string) => key.includes('/api/payments'), undefined, { revalidate: true })
    return res.json()
}

export async function splitOrder(orderId: string, splits: { amount: number; label?: string }[]) {
    const res = await fetch(`/api/orders/${orderId}/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ splits })
    })
    if (!res.ok) throw new Error((await res.json()).error)
    return res.json()
}

export async function applyDiscount(orderId: string, data: {
    discountType: 'percentage' | 'fixed' | 'coupon'
    discountValue: number
    discountCode?: string
    discountReason?: string
}) {
    const res = await fetch(`/api/orders/${orderId}/discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error((await res.json()).error)
    return res.json()
}
