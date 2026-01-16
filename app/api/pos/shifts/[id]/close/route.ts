import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/pos/shifts/[id]/close - Close a shift
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { closingCash, notes } = body

        if (closingCash === undefined) {
            return NextResponse.json(
                { error: 'closingCash is required' },
                { status: 400 }
            )
        }

        // Get the shift with transactions
        const existingShift = await prisma.pOSShift.findUnique({
            where: { id },
            include: {
                transactions: {
                    where: { status: 'COMPLETED' }
                }
            }
        })

        if (!existingShift) {
            return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
        }

        if (existingShift.status !== 'OPEN') {
            return NextResponse.json(
                { error: 'Shift is already closed' },
                { status: 400 }
            )
        }

        // Calculate expected cash (opening + cash transactions - refunds)
        const cashTransactions = existingShift.transactions.filter(
            t => t.paymentMethodId === 'cash' // This would be the cash payment method ID
        )

        const totalCashIn = cashTransactions
            .filter(t => t.amount.greaterThan(0))
            .reduce((sum, t) => sum + Number(t.amount), 0)

        const totalRefunds = cashTransactions
            .filter(t => t.refundedAmount.greaterThan(0))
            .reduce((sum, t) => sum + Number(t.refundedAmount), 0)

        const expectedCash = Number(existingShift.openingCash) + totalCashIn - totalRefunds
        const cashDifference = closingCash - expectedCash

        const shift = await prisma.pOSShift.update({
            where: { id },
            data: {
                closingCash,
                expectedCash,
                cashDifference,
                endTime: new Date(),
                status: 'CLOSED',
                notes,
            },
            include: {
                terminal: { select: { id: true, name: true } },
                user: { select: { id: true, name: true } },
                _count: { select: { transactions: true } }
            }
        })

        return NextResponse.json({ shift })
    } catch (error) {
        console.error('Error closing shift:', error)
        return NextResponse.json(
            { error: 'Failed to close shift' },
            { status: 500 }
        )
    }
}
