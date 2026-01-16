import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Helper to generate shift number
async function generateShiftNumber(): Promise<string> {
    const today = new Date()
    const datePrefix = today.toISOString().split('T')[0].replace(/-/g, '')

    // Get count of shifts today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const endOfDay = new Date(today.setHours(23, 59, 59, 999))

    const count = await prisma.pOSShift.count({
        where: {
            createdAt: { gte: startOfDay, lte: endOfDay }
        }
    })

    return `SFT-${datePrefix}-${String(count + 1).padStart(4, '0')}`
}

// POST /api/pos/shifts/open - Open a new shift
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { terminalId, userId, openingCash } = body

        if (!terminalId || !userId || openingCash === undefined) {
            return NextResponse.json(
                { error: 'terminalId, userId, and openingCash are required' },
                { status: 400 }
            )
        }

        // Check if terminal has an active shift
        const existingShift = await prisma.pOSShift.findFirst({
            where: {
                terminalId,
                status: 'OPEN'
            }
        })

        if (existingShift) {
            return NextResponse.json(
                { error: 'Terminal already has an open shift. Please close it first.' },
                { status: 400 }
            )
        }

        const shiftNumber = await generateShiftNumber()

        const shift = await prisma.pOSShift.create({
            data: {
                shiftNumber,
                terminalId,
                userId,
                openingCash,
                status: 'OPEN',
            },
            include: {
                terminal: { select: { id: true, name: true } },
                user: { select: { id: true, name: true, email: true } }
            }
        })

        // Update terminal last active
        await prisma.pOSTerminal.update({
            where: { id: terminalId },
            data: { lastActiveAt: new Date() }
        })

        return NextResponse.json({ shift }, { status: 201 })
    } catch (error) {
        console.error('Error opening shift:', error)
        return NextResponse.json(
            { error: 'Failed to open shift' },
            { status: 500 }
        )
    }
}
