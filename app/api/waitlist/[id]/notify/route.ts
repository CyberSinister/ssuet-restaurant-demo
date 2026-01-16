import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/waitlist/[id]/notify - Send table-ready notification
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { notificationMethod } = body // 'SMS', 'WHATSAPP', 'APP'

        const entry = await prisma.waitlistEntry.findUnique({ where: { id } })
        if (!entry) {
            return NextResponse.json({ error: 'Waitlist entry not found' }, { status: 404 })
        }

        if (entry.status !== 'WAITING') {
            return NextResponse.json(
                { error: `Cannot notify entry with status: ${entry.status}` },
                { status: 400 }
            )
        }

        // TODO: Integrate with actual notification service (Twilio, etc.)
        // For now, just mark as notified
        const updatedEntry = await prisma.waitlistEntry.update({
            where: { id },
            data: {
                status: 'NOTIFIED',
                notifiedAt: new Date(),
                notificationMethod: notificationMethod || 'SMS'
            }
        })

        // In production, send actual notification here
        // await sendSMS(entry.guestPhone, `Your table is ready at ${location.name}`)

        return NextResponse.json({
            entry: updatedEntry,
            message: `Notification sent via ${notificationMethod || 'SMS'}`
        })
    } catch (error) {
        console.error('Error notifying waitlist entry:', error)
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
    }
}
