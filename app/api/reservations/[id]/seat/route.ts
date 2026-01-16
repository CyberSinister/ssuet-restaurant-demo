import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/reservations/[id]/seat - Mark reservation as seated
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { tableId } = body

        const reservation = await prisma.reservation.findUnique({
            where: { id },
            include: { table: true }
        })

        if (!reservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
        }

        if (!['PENDING', 'CONFIRMED'].includes(reservation.status)) {
            return NextResponse.json(
                { error: `Cannot seat reservation with status: ${reservation.status}` },
                { status: 400 }
            )
        }

        // Use provided tableId or existing one
        const assignedTableId = tableId || reservation.tableId

        if (!assignedTableId) {
            return NextResponse.json(
                { error: 'No table assigned. Provide tableId.' },
                { status: 400 }
            )
        }

        // Update table status to occupied
        await prisma.table.update({
            where: { id: assignedTableId },
            data: { status: 'OCCUPIED' }
        })

        const updatedReservation = await prisma.reservation.update({
            where: { id },
            data: {
                status: 'SEATED',
                tableId: assignedTableId
            },
            include: {
                table: { select: { id: true, tableNumber: true } },
                location: { select: { id: true, name: true } }
            }
        })

        return NextResponse.json({
            reservation: updatedReservation,
            message: 'Party seated successfully'
        })
    } catch (error) {
        console.error('Error seating reservation:', error)
        return NextResponse.json({ error: 'Failed to seat reservation' }, { status: 500 })
    }
}
