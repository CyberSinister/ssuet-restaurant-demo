import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/reservations/[id]/confirm - Confirm reservation
export async function POST(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const reservation = await prisma.reservation.findUnique({ where: { id } })

        if (!reservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
        }

        if (reservation.status !== 'PENDING') {
            return NextResponse.json(
                { error: `Cannot confirm a reservation with status ${reservation.status}` },
                { status: 400 }
            )
        }

        const updated = await prisma.reservation.update({
            where: { id },
            data: {
                status: 'CONFIRMED',
                confirmationSent: true,
                confirmationSentAt: new Date()
            },
            include: {
                location: { select: { name: true } },
                table: { select: { tableNumber: true } }
            }
        })

        // TODO: Queue confirmation email/SMS via BullMQ
        // jobs.sendReservationConfirmation(updated.guestEmail, {...})

        return NextResponse.json({ reservation: updated })
    } catch (error) {
        console.error('Error confirming reservation:', error)
        return NextResponse.json({ error: 'Failed to confirm reservation' }, { status: 500 })
    }
}
