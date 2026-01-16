import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/inventory/lots - List inventory lots
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const inventoryItemId = searchParams.get('inventoryItemId')
        const locationId = searchParams.get('locationId')
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        const where: Record<string, unknown> = {}

        if (inventoryItemId) where.inventoryItemId = inventoryItemId
        if (locationId) where.locationId = locationId
        if (status) where.status = status

        const [lots, total] = await Promise.all([
            prisma.inventoryLot.findMany({
                where,
                include: {
                    inventoryItem: { select: { id: true, name: true, sku: true, unitOfMeasure: true } },
                    location: { select: { id: true, name: true, code: true } },
                    supplier: { select: { id: true, name: true, code: true } }
                },
                orderBy: { expiryDate: 'asc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.inventoryLot.count({ where })
        ])

        return NextResponse.json({
            lots,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        })
    } catch (error) {
        console.error('Error fetching lots:', error)
        return NextResponse.json({ error: 'Failed to fetch lots' }, { status: 500 })
    }
}
