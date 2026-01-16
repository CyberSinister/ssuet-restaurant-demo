import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// PATCH /api/kitchen/items/[id]/status - Update individual item status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { status } = body

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 })
        }

        const validStatuses = ['PENDING', 'PREPARING', 'READY', 'CANCELLED']
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Status must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            )
        }

        const item = await prisma.kitchenOrderItem.findUnique({
            where: { id },
            include: { kitchenOrder: true }
        })

        if (!item) {
            return NextResponse.json({ error: 'Kitchen order item not found' }, { status: 404 })
        }

        const updateData: Record<string, unknown> = { status }
        if (status === 'READY') {
            updateData.completedAt = new Date()
        }

        const updatedItem = await prisma.kitchenOrderItem.update({
            where: { id },
            data: updateData,
            include: {
                menuItem: { select: { id: true, name: true } },
                kitchenOrder: { select: { id: true, ticketNumber: true, status: true } }
            }
        })

        // Check if all items in the kitchen order are ready
        const allItems = await prisma.kitchenOrderItem.findMany({
            where: { kitchenOrderId: item.kitchenOrderId }
        })

        const allReady = allItems.every(i => i.status === 'READY' || i.status === 'CANCELLED')
        const anyPreparing = allItems.some(i => i.status === 'PREPARING')

        // Update kitchen order status if needed
        if (allReady && item.kitchenOrder.status !== 'READY') {
            await prisma.kitchenOrder.update({
                where: { id: item.kitchenOrderId },
                data: { status: 'READY', completedAt: new Date() }
            })
        } else if (anyPreparing && item.kitchenOrder.status === 'NEW') {
            await prisma.kitchenOrder.update({
                where: { id: item.kitchenOrderId },
                data: { status: 'IN_PROGRESS', startedAt: new Date() }
            })
        }

        return NextResponse.json({ item: updatedItem })
    } catch (error) {
        console.error('Error updating kitchen item status:', error)
        return NextResponse.json({ error: 'Failed to update item status' }, { status: 500 })
    }
}
