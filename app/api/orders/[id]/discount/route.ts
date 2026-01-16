import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/orders/[id]/discount - Apply discount to order
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { discountType, discountValue, discountCode, discountReason } = body

        if (!discountType || discountValue === undefined) {
            return NextResponse.json(
                { error: 'discountType and discountValue are required' },
                { status: 400 }
            )
        }

        const validTypes = ['percentage', 'fixed', 'coupon']
        if (!validTypes.includes(discountType)) {
            return NextResponse.json(
                { error: `discountType must be one of: ${validTypes.join(', ')}` },
                { status: 400 }
            )
        }

        // Get order
        const order = await prisma.order.findUnique({
            where: { id }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Check if order can be modified
        const nonModifiableStatuses = ['COMPLETED', 'CANCELLED']
        if (nonModifiableStatuses.includes(order.status)) {
            return NextResponse.json(
                { error: 'Cannot modify a completed or cancelled order' },
                { status: 400 }
            )
        }

        // Calculate discount amount
        const subtotal = Number(order.subtotal)
        let discountAmount: number

        if (discountType === 'percentage') {
            if (discountValue < 0 || discountValue > 100) {
                return NextResponse.json(
                    { error: 'Percentage discount must be between 0 and 100' },
                    { status: 400 }
                )
            }
            discountAmount = subtotal * (discountValue / 100)
        } else {
            // Fixed or coupon
            discountAmount = discountValue
        }

        // Ensure discount doesn't exceed subtotal
        if (discountAmount > subtotal) {
            discountAmount = subtotal
        }

        // Recalculate total
        const taxRate = Number(order.taxRate)
        const discountedSubtotal = subtotal - discountAmount
        const taxAmount = discountedSubtotal * taxRate
        const serviceCharge = Number(order.serviceCharge)
        const deliveryFee = Number(order.deliveryFee)
        const newTotal = discountedSubtotal + taxAmount + serviceCharge + deliveryFee

        // Update order
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                discountType,
                discountAmount,
                discountCode: discountCode || null,
                discountReason: discountReason || null,
                taxAmount,
                total: newTotal
            },
            include: {
                orderItems: {
                    include: { menuItem: { select: { id: true, name: true } } }
                }
            }
        })

        return NextResponse.json({
            order: updatedOrder,
            discount: {
                type: discountType,
                value: discountValue,
                amount: discountAmount,
                code: discountCode
            },
            message: `Discount of ${discountAmount.toFixed(2)} applied successfully`
        })
    } catch (error) {
        console.error('Error applying discount:', error)
        return NextResponse.json({ error: 'Failed to apply discount' }, { status: 500 })
    }
}
