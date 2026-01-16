import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/inventory/stock/movements - Get stock movement history
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const inventoryItemId = searchParams.get('inventoryItemId')
        const locationId = searchParams.get('locationId')
        const movementType = searchParams.get('movementType')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        const where: Record<string, unknown> = {}

        if (inventoryItemId) where.inventoryItemId = inventoryItemId
        if (locationId) where.locationId = locationId
        if (movementType) where.movementType = movementType
        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
            if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate)
        }

        const [movements, total] = await Promise.all([
            prisma.stockMovement.findMany({
                where,
                include: {
                    inventoryItem: { select: { id: true, name: true, sku: true } },
                    location: { select: { id: true, name: true, code: true } },
                    destinationLocation: { select: { id: true, name: true, code: true } },
                    performedBy: { select: { id: true, name: true, email: true } },
                    lot: { select: { id: true, lotNumber: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.stockMovement.count({ where })
        ])

        return NextResponse.json({
            movements,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        })
    } catch (error) {
        console.error('Error fetching stock movements:', error)
        return NextResponse.json({ error: 'Failed to fetch movements' }, { status: 500 })
    }
}
