import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/inventory/stock/alerts - Get low stock and expiring items
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const locationId = searchParams.get('locationId')

        // Get all active items and filter for low stock in memory
        // (Prisma doesn't support comparing two columns directly)
        const allItems = await prisma.inventoryItem.findMany({
            where: { isActive: true },
            select: {
                id: true,
                sku: true,
                name: true,
                currentStock: true,
                minimumStock: true,
                reorderPoint: true,
                unitOfMeasure: true,
                category: { select: { name: true } },
                preferredSupplier: { select: { name: true } }
            },
            orderBy: { currentStock: 'asc' },
            take: 200 // Get more items to filter
        })

        // Filter for low stock items
        const lowStockItems = allItems.filter(item =>
            Number(item.currentStock) <= Number(item.minimumStock)
        ).slice(0, 50)

        // Get expiring lots (within 7 days)
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

        const whereClause: Record<string, unknown> = {
            status: 'AVAILABLE',
            expiryDate: {
                lte: sevenDaysFromNow,
                gte: new Date()
            }
        }
        if (locationId) {
            whereClause.locationId = locationId
        }

        const expiringLots = await prisma.inventoryLot.findMany({
            where: whereClause,
            include: {
                inventoryItem: { select: { id: true, name: true, sku: true } },
                location: { select: { id: true, name: true } }
            },
            orderBy: { expiryDate: 'asc' },
            take: 50
        })

        return NextResponse.json({
            lowStock: {
                count: lowStockItems.length,
                items: lowStockItems
            },
            expiring: {
                count: expiringLots.length,
                lots: expiringLots.map(lot => ({
                    ...lot,
                    daysUntilExpiry: lot.expiryDate
                        ? Math.ceil((new Date(lot.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        : null
                }))
            }
        })
    } catch (error) {
        console.error('Error fetching stock alerts:', error)
        return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }
}

