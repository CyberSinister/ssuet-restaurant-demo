import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/kitchen/metrics - Kitchen performance metrics
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const stationId = searchParams.get('stationId')
        const locationId = searchParams.get('locationId')
        const startDate = searchParams.get('startDate') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const endDate = searchParams.get('endDate') || new Date().toISOString()

        const where: Record<string, unknown> = {
            createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        }

        if (stationId) where.stationId = stationId
        if (locationId) {
            where.station = { locationId }
        }

        // Get all completed orders in range
        const orders = await prisma.kitchenOrder.findMany({
            where: {
                ...where,
                status: { in: ['READY', 'SERVED'] }
            },
            include: {
                station: { select: { id: true, name: true } }
            }
        })

        // Calculate metrics
        const totalOrders = orders.length
        const ordersWithPrepTime = orders.filter(o => o.prepTime !== null)
        const ordersWithWaitTime = orders.filter(o => o.waitTime !== null)

        const avgPrepTime = ordersWithPrepTime.length > 0
            ? ordersWithPrepTime.reduce((sum, o) => sum + (o.prepTime || 0), 0) / ordersWithPrepTime.length
            : 0

        const avgWaitTime = ordersWithWaitTime.length > 0
            ? ordersWithWaitTime.reduce((sum, o) => sum + (o.waitTime || 0), 0) / ordersWithWaitTime.length
            : 0

        // Get currently pending orders
        const pendingOrders = await prisma.kitchenOrder.count({
            where: {
                status: { in: ['NEW', 'VIEWED', 'IN_PROGRESS'] },
                ...(stationId ? { stationId } : {}),
                ...(locationId ? { station: { locationId } } : {})
            }
        })

        // Get order counts by status
        const statusCounts = await prisma.kitchenOrder.groupBy({
            by: ['status'],
            where: {
                createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
                ...(stationId ? { stationId } : {}),
                ...(locationId ? { station: { locationId } } : {})
            },
            _count: true
        })

        // Get orders by station
        const byStation = await prisma.kitchenOrder.groupBy({
            by: ['stationId'],
            where: {
                createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
                status: { in: ['READY', 'SERVED'] },
                ...(locationId ? { station: { locationId } } : {})
            },
            _count: true,
            _avg: { prepTime: true, waitTime: true }
        })

        // Get station names
        const stationIds = byStation.map(s => s.stationId)
        const stations = await prisma.kitchenStation.findMany({
            where: { id: { in: stationIds } },
            select: { id: true, name: true }
        })

        const stationMetrics = byStation.map(s => {
            const station = stations.find(st => st.id === s.stationId)
            return {
                stationId: s.stationId,
                stationName: station?.name || 'Unknown',
                ordersCompleted: s._count,
                avgPrepTime: Math.round(s._avg.prepTime || 0),
                avgWaitTime: Math.round(s._avg.waitTime || 0)
            }
        })

        // Calculate hourly throughput
        const hourMs = 60 * 60 * 1000
        const rangeMs = new Date(endDate).getTime() - new Date(startDate).getTime()
        const hours = Math.max(1, rangeMs / hourMs)
        const ordersPerHour = (totalOrders / hours).toFixed(2)

        return NextResponse.json({
            period: { startDate, endDate },
            summary: {
                totalOrdersCompleted: totalOrders,
                pendingOrders,
                ordersPerHour: parseFloat(ordersPerHour),
                avgPrepTimeSeconds: Math.round(avgPrepTime),
                avgPrepTimeMinutes: (avgPrepTime / 60).toFixed(1),
                avgWaitTimeSeconds: Math.round(avgWaitTime),
                avgWaitTimeMinutes: (avgWaitTime / 60).toFixed(1)
            },
            statusBreakdown: statusCounts.reduce((acc, s) => {
                acc[s.status] = s._count
                return acc
            }, {} as Record<string, number>),
            byStation: stationMetrics
        })
    } catch (error) {
        console.error('Error fetching kitchen metrics:', error)
        return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
    }
}
