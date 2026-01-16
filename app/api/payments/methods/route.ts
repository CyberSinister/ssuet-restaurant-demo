import { NextRequest, NextResponse } from 'next/server'
import { getPaymentMethods, createPaymentMethod } from '@/lib/payments'

// GET /api/payments/methods - List payment methods
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const activeOnly = searchParams.get('activeOnly') !== 'false'

        const methods = await getPaymentMethods(activeOnly)

        return NextResponse.json({ methods })
    } catch (error) {
        console.error('Error fetching payment methods:', error)
        return NextResponse.json(
            { error: 'Failed to fetch payment methods' },
            { status: 500 }
        )
    }
}

// POST /api/payments/methods - Create payment method (admin only)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, code, type, gatewayProvider, isActive, allowsRefund, allowsTip, displayOrder, iconUrl } = body

        if (!name || !code || !type) {
            return NextResponse.json(
                { error: 'name, code, and type are required' },
                { status: 400 }
            )
        }

        const validTypes = ['CASH', 'CARD', 'DIGITAL_WALLET', 'BANK_TRANSFER', 'ONLINE']
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: `type must be one of: ${validTypes.join(', ')}` },
                { status: 400 }
            )
        }

        const method = await createPaymentMethod({
            name,
            code,
            type,
            gatewayProvider,
            isActive,
            allowsRefund,
            allowsTip,
            displayOrder,
            iconUrl
        })

        return NextResponse.json({ method }, { status: 201 })
    } catch (error: unknown) {
        console.error('Error creating payment method:', error)
        const prismaError = error as { code?: string }
        if (prismaError.code === 'P2002') {
            return NextResponse.json(
                { error: 'A payment method with this code already exists' },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to create payment method' },
            { status: 500 }
        )
    }
}
