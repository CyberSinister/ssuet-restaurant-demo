import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/reservations/availability - Check availability
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const locationId = searchParams.get('locationId')
        const date = searchParams.get('date')
        const time = searchParams.get('time')
        const partySize = parseInt(searchParams.get('partySize') || '2')
        const duration = parseInt(searchParams.get('duration') || '90') // minutes

        if (!locationId || !date || !time) {
            return NextResponse.json(
                { error: 'locationId, date, and time are required' },
                { status: 400 }
            )
        }

        // Parse requested time slot
        const requestedStart = new Date(`${date}T${time}:00`)
        const requestedEnd = new Date(requestedStart.getTime() + duration * 60000)

        // Get all tables that can accommodate the party size
        const suitableTables = await prisma.table.findMany({
            where: {
                area: { locationId },
                isActive: true,
                maxSeats: { gte: partySize },
                status: { notIn: ['BLOCKED'] }
            },
            include: {
                area: { select: { id: true, name: true } }
            },
            orderBy: { minSeats: 'asc' } // Prefer smaller tables
        })

        // Get existing reservations that overlap
        const overlappingReservations = await prisma.reservation.findMany({
            where: {
                locationId,
                date: new Date(date),
                status: { in: ['PENDING', 'CONFIRMED'] },
                tableId: { not: null }
            }
        })

        // Check each table for availability
        const availability = suitableTables.map(table => {
            // Check if table has overlapping reservation
            const hasConflict = overlappingReservations.some(res => {
                if (res.tableId !== table.id) return false

                const resStart = new Date(res.startTime)
                const resEnd = res.endTime
                    ? new Date(res.endTime)
                    : new Date(resStart.getTime() + (res.duration || 90) * 60000)

                // Check overlap
                return requestedStart < resEnd && requestedEnd > resStart
            })

            return {
                tableId: table.id,
                tableNumber: table.tableNumber,
                area: table.area.name,
                capacity: { min: table.minSeats, max: table.maxSeats },
                available: !hasConflict,
                currentStatus: table.status
            }
        })

        const availableTables = availability.filter(t => t.available)
        const unavailableTables = availability.filter(t => !t.available)

        // Find alternative time slots if no tables available
        let alternativeSlots: { time: string; availableCount: number }[] = []
        if (availableTables.length === 0) {
            // Check slots in 30-minute increments for the day
            const dayStart = new Date(`${date}T11:00:00`)
            const dayEnd = new Date(`${date}T22:00:00`)

            for (let slot = dayStart; slot <= dayEnd; slot = new Date(slot.getTime() + 30 * 60000)) {
                const slotEnd = new Date(slot.getTime() + duration * 60000)

                let availableCount = 0
                for (const table of suitableTables) {
                    const hasConflict = overlappingReservations.some(res => {
                        if (res.tableId !== table.id) return false
                        const resStart = new Date(res.startTime)
                        const resEnd = res.endTime
                            ? new Date(res.endTime)
                            : new Date(resStart.getTime() + (res.duration || 90) * 60000)
                        return slot < resEnd && slotEnd > resStart
                    })
                    if (!hasConflict) availableCount++
                }

                if (availableCount > 0) {
                    alternativeSlots.push({
                        time: slot.toTimeString().slice(0, 5),
                        availableCount
                    })
                }
            }
        }

        return NextResponse.json({
            request: { date, time, partySize, duration },
            available: availableTables.length > 0,
            summary: {
                totalTablesChecked: suitableTables.length,
                available: availableTables.length,
                unavailable: unavailableTables.length
            },
            tables: {
                available: availableTables,
                unavailable: unavailableTables
            },
            alternativeSlots: alternativeSlots.slice(0, 6) // Show up to 6 alternatives
        })
    } catch (error) {
        console.error('Error checking availability:', error)
        return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 })
    }
}
