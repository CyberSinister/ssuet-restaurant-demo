import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/kitchen/orders - Get kitchen orders for station
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const stationId = searchParams.get('stationId')
        const status = searchParams.get('status')

        if (!stationId) {
            return NextResponse.json({ error: 'stationId is required' }, { status: 400 })
        }

        const statusFilter = status
            ? status.split(',')
            : ['NEW', 'VIEWED', 'IN_PROGRESS']

        const orders = await prisma.kitchenOrder.findMany({
            where: {
                stationId,
                status: { in: statusFilter as any }
            },
            include: {
                station: {
                    select: { warningTime: true, criticalTime: true }
                },
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        orderType: true,
                        customerName: true,
                        table: { select: { tableNumber: true } },
                        notes: true
                    }
                },
                items: {
                    include: {
                        menuItem: { select: { name: true, kitchenNote: true } },
                        orderItem: { select: { specialInstructions: true, modifiers: true } }
                    }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { receivedAt: 'asc' }
            ]
        })

        // Add time calculations
        const ordersWithTiming = orders.map(order => {
            const now = Date.now()
            const receivedTime = new Date(order.receivedAt).getTime()
            const elapsedSeconds = Math.floor((now - receivedTime) / 1000)

            return {
                ...order,
                elapsedSeconds,
                elapsedMinutes: Math.floor(elapsedSeconds / 60),
                isWarning: elapsedSeconds >= (order.station?.warningTime || 10) * 60,
                isCritical: elapsedSeconds >= (order.station?.criticalTime || 15) * 60
            }
        })

        return NextResponse.json({ orders: ordersWithTiming })
    } catch (error) {
        console.error('Error fetching kitchen orders:', error)
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }
}
