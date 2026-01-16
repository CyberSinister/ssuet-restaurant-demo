import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Helper to generate reservation number
async function generateReservationNumber(): Promise<string> {
    const today = new Date()
    const datePrefix = today.toISOString().split('T')[0].replace(/-/g, '').slice(2) // YYMMDD

    const count = await prisma.reservation.count({
        where: {
            createdAt: {
                gte: new Date(today.setHours(0, 0, 0, 0)),
            }
        }
    })

    return `RES-${datePrefix}-${String(count + 1).padStart(4, '0')}`
}

// GET /api/reservations - List reservations
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const locationId = searchParams.get('locationId')
        const date = searchParams.get('date')
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        const where: any = {}

        if (locationId) where.locationId = locationId
        if (date) where.date = new Date(date)
        if (status) where.status = status

        const [reservations, total] = await Promise.all([
            prisma.reservation.findMany({
                where,
                include: {
                    location: { select: { id: true, name: true } },
                    table: { select: { id: true, tableNumber: true } },
                    customer: { select: { id: true, name: true, email: true, phone: true } }
                },
                orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.reservation.count({ where })
        ])

        return NextResponse.json({
            reservations,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        })
    } catch (error) {
        console.error('Error fetching reservations:', error)
        return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 })
    }
}

// POST /api/reservations - Create reservation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            locationId, guestName, guestEmail, guestPhone, partySize,
            date, startTime, duration, tableId, occasion, specialRequests,
            dietaryNotes, source, customerId
        } = body

        if (!locationId || !guestName || !guestPhone || !partySize || !date || !startTime) {
            return NextResponse.json(
                { error: 'locationId, guestName, guestPhone, partySize, date, and startTime are required' },
                { status: 400 }
            )
        }

        const reservationNumber = await generateReservationNumber()

        const reservation = await prisma.reservation.create({
            data: {
                reservationNumber,
                locationId,
                customerId,
                guestName,
                guestEmail,
                guestPhone,
                partySize,
                date: new Date(date),
                startTime: new Date(`1970-01-01T${startTime}`),
                duration: duration || 90,
                tableId,
                occasion,
                specialRequests,
                dietaryNotes,
                source: source || 'DIRECT',
                status: 'PENDING'
            },
            include: {
                location: { select: { id: true, name: true } },
                table: { select: { id: true, tableNumber: true } }
            }
        })

        return NextResponse.json({ reservation }, { status: 201 })
    } catch (error) {
        console.error('Error creating reservation:', error)
        return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 })
    }
}
