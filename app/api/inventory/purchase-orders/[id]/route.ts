import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/inventory/purchase-orders/[id] - Get single PO
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const order = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                supplier: true,
                location: { select: { id: true, name: true, code: true } },
                createdBy: { select: { id: true, name: true, email: true } },
                approvedBy: { select: { id: true, name: true, email: true } },
                items: {
                    include: {
                        inventoryItem: {
                            select: { id: true, name: true, sku: true, unitOfMeasure: true }
                        }
                    }
                },
                lots: {
                    select: { id: true, lotNumber: true, quantity: true, expiryDate: true }
                }
            }
        })

        if (!order) {
            return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
        }

        return NextResponse.json({ order })
    } catch (error) {
        console.error('Error fetching purchase order:', error)
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
    }
}

// PATCH /api/inventory/purchase-orders/[id] - Update PO
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()

        const existing = await prisma.purchaseOrder.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
        }

        // Only allow updates to draft/pending orders
        if (!['DRAFT', 'PENDING'].includes(existing.status)) {
            return NextResponse.json(
                { error: 'Can only update draft or pending orders' },
                { status: 400 }
            )
        }

        const { status, notes, expectedDate, approvedById } = body

        const updateData: Record<string, unknown> = {}
        if (notes !== undefined) updateData.notes = notes
        if (expectedDate) updateData.expectedDate = new Date(expectedDate)

        // Handle status transitions
        if (status) {
            const validTransitions: Record<string, string[]> = {
                'DRAFT': ['PENDING', 'CANCELLED'],
                'PENDING': ['APPROVED', 'CANCELLED'],
                'APPROVED': ['ORDERED', 'CANCELLED'],
                'ORDERED': ['PARTIAL', 'RECEIVED', 'CANCELLED'],
                'PARTIAL': ['RECEIVED', 'CANCELLED']
            }

            if (!validTransitions[existing.status]?.includes(status)) {
                return NextResponse.json(
                    { error: `Invalid status transition from ${existing.status} to ${status}` },
                    { status: 400 }
                )
            }

            updateData.status = status
            if (status === 'APPROVED' && approvedById) {
                updateData.approvedById = approvedById
                updateData.approvedAt = new Date()
            }
            if (status === 'ORDERED') {
                updateData.orderDate = new Date()
            }
        }

        const order = await prisma.purchaseOrder.update({
            where: { id },
            data: updateData,
            include: {
                supplier: { select: { id: true, name: true } },
                items: { include: { inventoryItem: { select: { id: true, name: true } } } }
            }
        })

        return NextResponse.json({ order })
    } catch (error) {
        console.error('Error updating purchase order:', error)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }
}

// DELETE /api/inventory/purchase-orders/[id] - Cancel PO
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const existing = await prisma.purchaseOrder.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
        }

        if (['RECEIVED', 'CANCELLED'].includes(existing.status)) {
            return NextResponse.json(
                { error: 'Cannot cancel a received or already cancelled order' },
                { status: 400 }
            )
        }

        await prisma.purchaseOrder.update({
            where: { id },
            data: { status: 'CANCELLED' }
        })

        return NextResponse.json({ message: 'Purchase order cancelled' })
    } catch (error) {
        console.error('Error cancelling purchase order:', error)
        return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
    }
}
