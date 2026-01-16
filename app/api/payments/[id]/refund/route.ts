import { NextRequest, NextResponse } from 'next/server'
import { processRefund } from '@/lib/payments'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/payments/[id]/refund - Process a refund
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { amount, reason, refundedBy } = body

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Valid amount is required' },
                { status: 400 }
            )
        }

        if (!reason) {
            return NextResponse.json(
                { error: 'Refund reason is required' },
                { status: 400 }
            )
        }

        const transaction = await processRefund(
            id,
            amount,
            reason,
            refundedBy || 'system'
        )

        return NextResponse.json({
            success: true,
            transaction,
            message: 'Refund processed successfully'
        })
    } catch (error) {
        console.error('Error processing refund:', error)
        const message = error instanceof Error ? error.message : 'Refund failed'
        return NextResponse.json({ error: message }, { status: 400 })
    }
}
