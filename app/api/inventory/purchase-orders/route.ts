import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Utility to generate PO number
function generatePONumber(): string {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `PO-${dateStr}-${random}`
}

// GET /api/inventory/purchase-orders - List purchase orders
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const supplierId = searchParams.get('supplierId')
        const locationId = searchParams.get('locationId')
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        const where: Record<string, unknown> = {}

        if (supplierId) where.supplierId = supplierId
        if (locationId) where.locationId = locationId
        if (status) where.status = status

        const [orders, total] = await Promise.all([
            prisma.purchaseOrder.findMany({
                where,
                include: {
                    supplier: { select: { id: true, name: true, code: true } },
                    location: { select: { id: true, name: true, code: true } },
                    createdBy: { select: { id: true, name: true, email: true } },
                    _count: { select: { items: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.purchaseOrder.count({ where })
        ])

        return NextResponse.json({
            orders,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        })
    } catch (error) {
        console.error('Error fetching purchase orders:', error)
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }
}

// POST /api/inventory/purchase-orders - Create purchase order
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            supplierId,
            locationId,
            createdById,
            items, // [{ inventoryItemId, quantity, unitPrice, notes }]
            notes,
            expectedDate
        } = body

        if (!supplierId || !locationId || !createdById) {
            return NextResponse.json(
                { error: 'supplierId, locationId, and createdById are required' },
                { status: 400 }
            )
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'At least one item is required' },
                { status: 400 }
            )
        }

        // Calculate totals
        let subtotal = 0
        const itemsData = items.map((item: { inventoryItemId: string; quantity: number; unitPrice: number; notes?: string }) => {
            const totalPrice = item.quantity * item.unitPrice
            subtotal += totalPrice
            return {
                inventoryItemId: item.inventoryItemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice,
                notes: item.notes
            }
        })

        const taxAmount = 0 // Can be calculated if needed
        const discountAmount = 0
        const total = subtotal + taxAmount - discountAmount

        const order = await prisma.purchaseOrder.create({
            data: {
                poNumber: generatePONumber(),
                supplierId,
                locationId,
                createdById,
                status: 'DRAFT',
                subtotal,
                taxAmount,
                discountAmount,
                total,
                notes,
                expectedDate: expectedDate ? new Date(expectedDate) : null,
                items: {
                    create: itemsData
                }
            },
            include: {
                supplier: { select: { id: true, name: true } },
                location: { select: { id: true, name: true } },
                items: {
                    include: {
                        inventoryItem: { select: { id: true, name: true, sku: true } }
                    }
                }
            }
        })

        return NextResponse.json({ order }, { status: 201 })
    } catch (error) {
        console.error('Error creating purchase order:', error)
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }
}
