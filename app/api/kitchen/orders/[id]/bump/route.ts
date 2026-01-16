import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/kitchen/orders/[id]/bump - Bump order to next status
export async function POST(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const order = await prisma.kitchenOrder.findUnique({
            where: { id },
            include: { station: true }
        })

        if (!order) {
            return NextResponse.json({ error: 'Kitchen order not found' }, { status: 404 })
        }

        // Determine next status
        const statusFlow: Record<string, string> = {
            'NEW': 'VIEWED',
            'VIEWED': 'IN_PROGRESS',
            'IN_PROGRESS': 'READY',
            'READY': 'SERVED'
        }

        const nextStatus = statusFlow[order.status]
        if (!nextStatus) {
            return NextResponse.json({ error: 'Order cannot be bumped further' }, { status: 400 })
        }

        const now = new Date()
        const updateData: any = { status: nextStatus }

        // Track timing
        if (nextStatus === 'VIEWED') {
            updateData.viewedAt = now
        } else if (nextStatus === 'IN_PROGRESS') {
            updateData.startedAt = now
            updateData.waitTime = Math.floor(
                (now.getTime() - new Date(order.receivedAt).getTime()) / 1000
            )
        } else if (nextStatus === 'READY') {
            updateData.completedAt = now
            updateData.prepTime = order.startedAt
                ? Math.floor((now.getTime() - new Date(order.startedAt).getTime()) / 1000)
                : null

            // Also update all items to READY
            await prisma.kitchenOrderItem.updateMany({
                where: { kitchenOrderId: id, status: { not: 'CANCELLED' } },
                data: { status: 'READY', completedAt: now }
            })
        } else if (nextStatus === 'SERVED') {
            updateData.servedAt = now
        }

        const updatedOrder = await prisma.kitchenOrder.update({
            where: { id },
            data: updateData,
            include: {
                order: { select: { orderNumber: true, orderType: true } },
                station: { select: { id: true, name: true } }
            }
        })

        return NextResponse.json({ order: updatedOrder })
    } catch (error) {
        console.error('Error bumping kitchen order:', error)
        return NextResponse.json({ error: 'Failed to bump order' }, { status: 500 })
    }
}
