import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/waitlist/[id]/seat - Seat party from waitlist
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { tableId } = body

        if (!tableId) {
            return NextResponse.json({ error: 'tableId is required' }, { status: 400 })
        }

        const entry = await prisma.waitlistEntry.findUnique({ where: { id } })
        if (!entry) {
            return NextResponse.json({ error: 'Waitlist entry not found' }, { status: 404 })
        }

        if (!['WAITING', 'NOTIFIED'].includes(entry.status)) {
            return NextResponse.json(
                { error: `Cannot seat entry with status: ${entry.status}` },
                { status: 400 }
            )
        }

        // Verify table exists and is available
        const table = await prisma.table.findUnique({
            where: { id: tableId },
            include: { area: true }
        })

        if (!table) {
            return NextResponse.json({ error: 'Table not found' }, { status: 404 })
        }

        if (table.status !== 'AVAILABLE') {
            return NextResponse.json(
                { error: `Table is not available. Current status: ${table.status}` },
                { status: 400 }
            )
        }

        // Check capacity
        if (table.maxSeats < entry.partySize) {
            return NextResponse.json(
                { error: `Table capacity (${table.maxSeats}) is less than party size (${entry.partySize})` },
                { status: 400 }
            )
        }

        // Calculate actual wait time
        const actualWaitTime = Math.floor(
            (Date.now() - new Date(entry.joinedAt).getTime()) / 60000
        ) // minutes

        // Update waitlist entry
        const updatedEntry = await prisma.waitlistEntry.update({
            where: { id },
            data: {
                status: 'SEATED',
                seatedAt: new Date(),
                actualWaitTime
            }
        })

        // Update table status
        await prisma.table.update({
            where: { id: tableId },
            data: { status: 'OCCUPIED' }
        })

        // Recalculate positions for remaining entries
        await prisma.$executeRaw`
            UPDATE "WaitlistEntry" 
            SET position = position - 1 
            WHERE "locationId" = ${entry.locationId} 
            AND status = 'WAITING' 
            AND position > ${entry.position}
        `

        return NextResponse.json({
            entry: updatedEntry,
            table: { id: table.id, number: table.tableNumber, area: table.area.name },
            actualWaitMinutes: actualWaitTime,
            message: 'Party seated successfully'
        })
    } catch (error) {
        console.error('Error seating waitlist entry:', error)
        return NextResponse.json({ error: 'Failed to seat party' }, { status: 500 })
    }
}
