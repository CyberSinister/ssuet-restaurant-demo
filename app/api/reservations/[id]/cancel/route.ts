import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/reservations/[id]/cancel - Cancel reservation
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { reason } = body

        const reservation = await prisma.reservation.findUnique({
            where: { id },
            include: { table: true }
        })

        if (!reservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
        }

        if (['SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(reservation.status)) {
            return NextResponse.json(
                { error: `Cannot cancel reservation with status: ${reservation.status}` },
                { status: 400 }
            )
        }

        // Free up the table if one was assigned
        if (reservation.tableId) {
            await prisma.table.update({
                where: { id: reservation.tableId },
                data: { status: 'AVAILABLE' }
            })
        }

        const updatedReservation = await prisma.reservation.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                internalNotes: reason
                    ? `${reservation.internalNotes || ''}\nCancellation reason: ${reason}`.trim()
                    : reservation.internalNotes
            },
            include: {
                table: { select: { id: true, tableNumber: true } },
                location: { select: { id: true, name: true } }
            }
        })

        return NextResponse.json({
            reservation: updatedReservation,
            message: 'Reservation cancelled successfully'
        })
    } catch (error) {
        console.error('Error cancelling reservation:', error)
        return NextResponse.json({ error: 'Failed to cancel reservation' }, { status: 500 })
    }
}
