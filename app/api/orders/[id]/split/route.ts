import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/orders/[id]/split - Split order for payment
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { splits } = body

        // Validate splits array
        if (!splits || !Array.isArray(splits) || splits.length < 2) {
            return NextResponse.json(
                { error: 'At least 2 splits are required' },
                { status: 400 }
            )
        }

        // Validate each split has amount
        for (const split of splits) {
            if (!split.amount || split.amount <= 0) {
                return NextResponse.json(
                    { error: 'Each split must have a positive amount' },
                    { status: 400 }
                )
            }
        }

        // Get order
        const order = await prisma.order.findUnique({
            where: { id },
            include: { orderItems: true }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Validate total matches
        const splitTotal = splits.reduce((sum: number, s: { amount: number }) => sum + s.amount, 0)
        const orderTotal = Number(order.total)

        if (Math.abs(splitTotal - orderTotal) > 0.01) {
            return NextResponse.json(
                { error: `Split total (${splitTotal}) must equal order total (${orderTotal})` },
                { status: 400 }
            )
        }

        // Return split suggestions with payment amounts
        const splitPayments = splits.map((split: { amount: number; label?: string }, index: number) => ({
            splitIndex: index + 1,
            amount: split.amount,
            label: split.label || `Payment ${index + 1}`,
            orderId: id,
            isPaid: false
        }))

        return NextResponse.json({
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                total: order.total
            },
            splits: splitPayments,
            message: 'Order split calculated. Use /api/payments to process each split payment with isSplitPayment=true and splitIndex.'
        })
    } catch (error) {
        console.error('Error splitting order:', error)
        return NextResponse.json({ error: 'Failed to split order' }, { status: 500 })
    }
}
