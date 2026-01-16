'use client'

import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useKitchenSocket } from '@/lib/hooks/use-socket'

interface KitchenOrderItem {
    id: string
    menuItem: { name: string; kitchenNote?: string }
    orderItem: { specialInstructions?: string; modifiers?: any }
    quantity: number
    status: string
}

interface KitchenOrder {
    id: string
    ticketNumber: number
    order: {
        orderNumber: string
        orderType: string
        customerName?: string
        table?: { tableNumber: string }
        notes?: string
    }
    items: KitchenOrderItem[]
    status: string
    priority: string
    receivedAt: string
    elapsedMinutes: number
    isWarning: boolean
    isCritical: boolean
}

interface KitchenDisplayProps {
    stationId: string
    locationId: string
    stationName?: string
}

function formatElapsedTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
}

function OrderTicket({ order, onBump }: { order: KitchenOrder; onBump: () => void }) {
    const statusColors = {
        NEW: 'bg-yellow-500',
        VIEWED: 'bg-blue-500',
        IN_PROGRESS: 'bg-orange-500',
        READY: 'bg-green-500',
        SERVED: 'bg-gray-500',
    }

    const priorityColors = {
        RUSH: 'ring-4 ring-red-500',
        HIGH: 'ring-2 ring-orange-500',
        NORMAL: '',
        LOW: 'opacity-90',
    }

    return (
        <div
            className={cn(
                'flex flex-col rounded-lg overflow-hidden shadow-lg transition-all',
                order.isCritical ? 'bg-red-100 animate-pulse' : order.isWarning ? 'bg-yellow-50' : 'bg-white',
                priorityColors[order.priority as keyof typeof priorityColors]
            )}
        >
            {/* Header */}
            <div className={cn(
                'px-4 py-3 text-white flex items-center justify-between',
                statusColors[order.status as keyof typeof statusColors]
            )}>
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">#{order.ticketNumber}</span>
                    <span className="text-sm opacity-90">{order.order.orderNumber}</span>
                </div>
                <div className="text-right">
                    <div className="text-lg font-semibold">{formatElapsedTime(order.elapsedMinutes)}</div>
                    <div className="text-xs opacity-90">{order.order.orderType}</div>
                </div>
            </div>

            {/* Customer / Table Info */}
            {(order.order.customerName || order.order.table) && (
                <div className="px-4 py-2 bg-gray-100 text-sm flex items-center gap-2">
                    {order.order.table && (
                        <span className="font-semibold">Table {order.order.table.tableNumber}</span>
                    )}
                    {order.order.customerName && (
                        <span className="text-gray-600">{order.order.customerName}</span>
                    )}
                </div>
            )}

            {/* Items */}
            <div className="flex-1 p-4 space-y-3">
                {order.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                        <span className="text-xl font-bold text-gray-700 w-8">{item.quantity}x</span>
                        <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.menuItem.name}</div>
                            {item.orderItem.specialInstructions && (
                                <div className="text-sm text-red-600 mt-1">
                                    ⚠️ {item.orderItem.specialInstructions}
                                </div>
                            )}
                            {item.menuItem.kitchenNote && (
                                <div className="text-xs text-gray-500 mt-1">
                                    📝 {item.menuItem.kitchenNote}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Notes */}
            {order.order.notes && (
                <div className="px-4 py-2 bg-yellow-100 text-sm text-yellow-800">
                    📌 {order.order.notes}
                </div>
            )}

            {/* Bump Button */}
            <button
                onClick={onBump}
                className={cn(
                    'w-full py-4 font-bold text-lg uppercase tracking-wide transition-colors',
                    order.status === 'IN_PROGRESS'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                )}
            >
                {order.status === 'NEW' && 'Start'}
                {order.status === 'VIEWED' && 'Begin Prep'}
                {order.status === 'IN_PROGRESS' && '✓ Ready'}
                {order.status === 'READY' && 'Served'}
            </button>
        </div>
    )
}

export default function KitchenDisplay({ stationId, locationId, stationName }: KitchenDisplayProps) {
    const [orders, setOrders] = useState<KitchenOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const { isConnected, on, bumpOrder } = useKitchenSocket(stationId, locationId)

    // Fetch initial orders
    const fetchOrders = useCallback(async () => {
        try {
            const response = await fetch(`/api/kitchen/orders?stationId=${stationId}`)
            if (!response.ok) throw new Error('Failed to fetch orders')
            const data = await response.json()
            setOrders(data.orders)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }, [stationId])

    useEffect(() => {
        fetchOrders()
        // Poll every 30 seconds as backup
        const interval = setInterval(fetchOrders, 30000)
        return () => clearInterval(interval)
    }, [fetchOrders])

    // Listen for real-time updates
    useEffect(() => {
        const unsubNewOrder = on('kitchen:new-order', (data) => {
            setOrders(prev => [...prev, data.kitchenOrder as any])
        })

        const unsubOrderUpdated = on('kitchen:order-updated', (data) => {
            setOrders(prev =>
                prev.map(o => o.id === data.kitchenOrderId ? { ...o, status: data.status } : o)
            )
        })

        const unsubOrderBumped = on('kitchen:order-bumped', (data) => {
            // Remove completed orders
            setOrders(prev => prev.filter(o => o.id !== data.kitchenOrderId || o.status !== 'SERVED'))
        })

        return () => {
            unsubNewOrder()
            unsubOrderUpdated()
            unsubOrderBumped()
        }
    }, [on])

    // Handle bump action
    const handleBump = async (orderId: string) => {
        try {
            const response = await fetch(`/api/kitchen/orders/${orderId}/bump`, {
                method: 'POST',
            })
            if (!response.ok) throw new Error('Failed to bump order')

            const data = await response.json()

            // Update local state
            setOrders(prev =>
                prev.map(o => o.id === orderId ? { ...o, status: data.order.status } : o)
                    .filter(o => o.status !== 'SERVED')
            )

            // Emit to socket for other displays
            bumpOrder(orderId)
        } catch (err) {
            console.error('Error bumping order:', err)
        }
    }

    // Update elapsed times every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setOrders(prev => prev.map(order => ({
                ...order,
                elapsedMinutes: Math.floor(
                    (Date.now() - new Date(order.receivedAt).getTime()) / 60000
                ),
                isWarning: (Date.now() - new Date(order.receivedAt).getTime()) >= 10 * 60000,
                isCritical: (Date.now() - new Date(order.receivedAt).getTime()) >= 15 * 60000,
            })))
        }, 60000)
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-2xl">Loading Kitchen Display...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-red-400 text-xl">Error: {error}</div>
            </div>
        )
    }

    // Group orders by status
    const newOrders = orders.filter(o => o.status === 'NEW')
    const inProgressOrders = orders.filter(o => ['VIEWED', 'IN_PROGRESS'].includes(o.status))
    const readyOrders = orders.filter(o => o.status === 'READY')

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Header */}
            <header className="bg-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-white">
                        🍳 {stationName || 'Kitchen Display'}
                    </h1>
                    <div className={cn(
                        'w-3 h-3 rounded-full',
                        isConnected ? 'bg-green-500' : 'bg-red-500'
                    )} />
                </div>
                <div className="flex items-center gap-6 text-white">
                    <div className="text-center">
                        <div className="text-3xl font-bold">{newOrders.length}</div>
                        <div className="text-xs text-gray-400">New</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-orange-400">{inProgressOrders.length}</div>
                        <div className="text-xs text-gray-400">In Progress</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-400">{readyOrders.length}</div>
                        <div className="text-xs text-gray-400">Ready</div>
                    </div>
                </div>
            </header>

            {/* Orders Grid */}
            <main className="p-6">
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
                        <div className="text-6xl mb-4">👨‍🍳</div>
                        <div className="text-2xl">No orders in queue</div>
                        <div className="text-sm mt-2">Waiting for new orders...</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {orders
                            .sort((a, b) => {
                                // Sort by priority first, then by time
                                const priorityOrder = { RUSH: 0, HIGH: 1, NORMAL: 2, LOW: 3 }
                                const pA = priorityOrder[a.priority as keyof typeof priorityOrder]
                                const pB = priorityOrder[b.priority as keyof typeof priorityOrder]
                                if (pA !== pB) return pA - pB
                                return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
                            })
                            .map(order => (
                                <OrderTicket
                                    key={order.id}
                                    order={order}
                                    onBump={() => handleBump(order.id)}
                                />
                            ))
                        }
                    </div>
                )}
            </main>
        </div>
    )
}
