import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/inventory/lots/expiring - Get lots expiring soon
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const days = parseInt(searchParams.get('days') || '7')
        const locationId = searchParams.get('locationId')

        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + days)

        const lots = await prisma.inventoryLot.findMany({
            where: {
                status: 'AVAILABLE',
                expiryDate: {
                    lte: futureDate,
                    gte: new Date()
                },
                ...(locationId && { locationId })
            },
            include: {
                inventoryItem: { select: { id: true, name: true, sku: true, unitOfMeasure: true } },
                location: { select: { id: true, name: true, code: true } },
                supplier: { select: { id: true, name: true } }
            },
            orderBy: { expiryDate: 'asc' }
        })

        // Add days until expiry
        const lotsWithDays = lots.map(lot => ({
            ...lot,
            daysUntilExpiry: Math.ceil(
                (new Date(lot.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
        }))

        // Group by urgency
        const critical = lotsWithDays.filter(l => l.daysUntilExpiry <= 2)
        const warning = lotsWithDays.filter(l => l.daysUntilExpiry > 2 && l.daysUntilExpiry <= 5)
        const upcoming = lotsWithDays.filter(l => l.daysUntilExpiry > 5)

        return NextResponse.json({
            summary: {
                total: lots.length,
                critical: critical.length,
                warning: warning.length,
                upcoming: upcoming.length
            },
            lots: lotsWithDays,
            grouped: { critical, warning, upcoming }
        })
    } catch (error) {
        console.error('Error fetching expiring lots:', error)
        return NextResponse.json({ error: 'Failed to fetch expiring lots' }, { status: 500 })
    }
}
