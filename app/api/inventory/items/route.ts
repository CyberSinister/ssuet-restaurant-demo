import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/inventory/items - List inventory items
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const categoryId = searchParams.get('categoryId')
        const lowStock = searchParams.get('lowStock') === 'true'
        const search = searchParams.get('search')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        const where: Record<string, unknown> = { isActive: true }

        if (categoryId) where.categoryId = categoryId
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search } },
            ]
        }

        // For lowStock, we need to fetch all and filter in memory
        // because Prisma doesn't support comparing two columns
        const fetchLimit = lowStock ? 500 : limit

        const [allItems, total] = await Promise.all([
            prisma.inventoryItem.findMany({
                where,
                include: {
                    category: { select: { id: true, name: true } },
                    preferredSupplier: { select: { id: true, name: true, code: true } },
                },
                orderBy: { name: 'asc' },
                skip: lowStock ? 0 : (page - 1) * limit,
                take: fetchLimit,
            }),
            prisma.inventoryItem.count({ where })
        ])

        // Filter for low stock if needed
        let items = allItems
        let filteredTotal = total
        if (lowStock) {
            items = allItems.filter(item =>
                Number(item.currentStock) <= Number(item.minimumStock)
            )
            filteredTotal = items.length
            items = items.slice((page - 1) * limit, page * limit)
        }

        return NextResponse.json({
            items,
            pagination: {
                page,
                limit,
                total: lowStock ? filteredTotal : total,
                totalPages: Math.ceil((lowStock ? filteredTotal : total) / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching inventory items:', error)
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }
}

// POST /api/inventory/items - Create inventory item
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            sku, name, description, categoryId, unitOfMeasure,
            minimumStock, maximumStock, reorderPoint, reorderQuantity,
            costPrice, trackLots, trackExpiry, storageTemp, barcode,
            isPerishable, preferredSupplierId
        } = body

        if (!sku || !name || !categoryId || !unitOfMeasure) {
            return NextResponse.json(
                { error: 'sku, name, categoryId, and unitOfMeasure are required' },
                { status: 400 }
            )
        }

        const item = await prisma.inventoryItem.create({
            data: {
                sku,
                name,
                description,
                categoryId,
                unitOfMeasure,
                minimumStock: minimumStock || 0,
                maximumStock,
                reorderPoint: reorderPoint || 0,
                reorderQuantity,
                costPrice: costPrice || 0,
                trackLots: trackLots || false,
                trackExpiry: trackExpiry || false,
                storageTemp,
                barcode,
                isPerishable: isPerishable || false,
                preferredSupplierId,
                isActive: true,
            },
            include: {
                category: { select: { id: true, name: true } },
            }
        })

        return NextResponse.json({ item }, { status: 201 })
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'SKU or barcode already exists' }, { status: 400 })
        }
        console.error('Error creating inventory item:', error)
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
    }
}
