import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/waitlist - Get current waitlist
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const locationId = searchParams.get('locationId')

        if (!locationId) {
            return NextResponse.json({ error: 'locationId is required' }, { status: 400 })
        }

        const entries = await prisma.waitlistEntry.findMany({
            where: {
                locationId,
                status: { in: ['WAITING', 'NOTIFIED'] }
            },
            include: {
                customer: { select: { id: true, name: true } }
            },
            orderBy: { position: 'asc' }
        })

        // Calculate current wait time estimates
        const avgTurnoverMinutes = 45 // Average table turnover time
        const entriesWithEstimates = entries.map((entry, idx) => ({
            ...entry,
            estimatedWaitMinutes: (idx + 1) * Math.ceil(avgTurnoverMinutes / 3)
        }))

        return NextResponse.json({ entries: entriesWithEstimates })
    } catch (error) {
        console.error('Error fetching waitlist:', error)
        return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 })
    }
}

// POST /api/waitlist - Add to waitlist
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { locationId, guestName, guestPhone, partySize, seatingPreference, notes, customerId } = body

        if (!locationId || !guestName || !guestPhone || !partySize) {
            return NextResponse.json(
                { error: 'locationId, guestName, guestPhone, and partySize are required' },
                { status: 400 }
            )
        }

        // Get next position
        const maxPosition = await prisma.waitlistEntry.aggregate({
            where: { locationId, status: { in: ['WAITING', 'NOTIFIED'] } },
            _max: { position: true }
        })

        const position = (maxPosition._max.position || 0) + 1

        // Estimate wait time based on position
        const avgTurnoverMinutes = 45
        const quotedWaitTime = position * Math.ceil(avgTurnoverMinutes / 3)

        const entry = await prisma.waitlistEntry.create({
            data: {
                locationId,
                customerId,
                guestName,
                guestPhone,
                partySize,
                position,
                quotedWaitTime,
                seatingPreference,
                notes,
                status: 'WAITING'
            }
        })

        return NextResponse.json({ entry, quotedWaitTime }, { status: 201 })
    } catch (error) {
        console.error('Error adding to waitlist:', error)
        return NextResponse.json({ error: 'Failed to add to waitlist' }, { status: 500 })
    }
}
