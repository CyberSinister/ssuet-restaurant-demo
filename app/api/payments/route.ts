import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { processPayment } from '@/lib/payments'

// GET /api/payments - List transactions with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const orderId = searchParams.get('orderId')
        const status = searchParams.get('status')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        const where: Record<string, unknown> = {}

        if (orderId) where.orderId = orderId
        if (status) where.status = status
        if (startDate || endDate) {
            where.createdAt = {}
            if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate)
            if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate)
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    paymentMethod: { select: { id: true, name: true, code: true, type: true } },
                    order: { select: { id: true, orderNumber: true, total: true, status: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.transaction.count({ where })
        ])

        return NextResponse.json({
            transactions,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        })
    } catch (error) {
        console.error('Error fetching transactions:', error)
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }
}

// POST /api/payments - Process a payment
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            orderId,
            paymentMethodId,
            amount,
            tipAmount,
            terminalId,
            shiftId,
            isSplitPayment,
            splitIndex,
            customerEmail,
            customerPhone
        } = body

        if (!orderId || !paymentMethodId || !amount) {
            return NextResponse.json(
                { error: 'orderId, paymentMethodId, and amount are required' },
                { status: 400 }
            )
        }

        if (amount <= 0) {
            return NextResponse.json(
                { error: 'Amount must be greater than 0' },
                { status: 400 }
            )
        }

        const result = await processPayment({
            orderId,
            paymentMethodId,
            amount,
            tipAmount,
            terminalId,
            shiftId,
            isSplitPayment,
            splitIndex,
            customerEmail,
            customerPhone
        })

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Payment failed' },
                { status: 400 }
            )
        }

        return NextResponse.json({ transaction: result.transaction }, { status: 201 })
    } catch (error) {
        console.error('Error processing payment:', error)
        const message = error instanceof Error ? error.message : 'Payment processing failed'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
