import { NextRequest, NextResponse } from 'next/server'
import { getTransactionById } from '@/lib/payments'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/payments/[id] - Get transaction details
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const transaction = await getTransactionById(id)

        if (!transaction) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ transaction })
    } catch (error) {
        console.error('Error fetching transaction:', error)
        return NextResponse.json(
            { error: 'Failed to fetch transaction' },
            { status: 500 }
        )
    }
}

// PATCH /api/payments/[id] - Update transaction (limited fields)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()

        const existing = await prisma.transaction.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json(
                { error: 'Transaction not found' },
                { status: 404 }
            )
        }

        // Only allow updating specific fields
        const allowedFields = ['status', 'gatewayRef', 'gatewayResponse', 'cardLastFour', 'cardBrand']
        const updateData: Record<string, unknown> = {}
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field]
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            )
        }

        const transaction = await prisma.transaction.update({
            where: { id },
            data: updateData,
            include: {
                paymentMethod: true,
                order: { select: { id: true, orderNumber: true, total: true } }
            }
        })

        return NextResponse.json({ transaction })
    } catch (error) {
        console.error('Error updating transaction:', error)
        return NextResponse.json(
            { error: 'Failed to update transaction' },
            { status: 500 }
        )
    }
}
